import { Resend } from "resend";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UK_POSTCODE = /^(GIR 0AA|[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2})$/i;
const PHONE = /^[+\d][\d\s().-]{6,23}$/;
const emptyToUndefined = (value: unknown) => value === "" || value == null ? undefined : value;
const sanitizeSingleLine = (value: string) =>
  value.normalize("NFC").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
const sanitizeMessage = (value: string) =>
  value.normalize("NFC").replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim();
const shortText = (minimum: number, maximum: number) =>
  z.string().transform(sanitizeSingleLine).pipe(z.string().min(minimum).max(maximum));

const quoteDetailsSchema = z.object({
  serviceType: z.enum(["Residential", "Commercial"]),
  propertyType: shortText(1, 50),
  bedrooms: z.number().int().min(0).max(30).optional(),
  bathrooms: z.number().int().min(0).max(30).optional(),
  size: z.enum(["Small", "Medium", "Large"]),
  cleaningService: shortText(2, 80),
  frequency: z.enum(["One-off", "Weekly", "Fortnightly", "Monthly"]),
  addOns: z.array(shortText(1, 60)).max(10),
  estimatedRange: shortText(1, 60),
}).strict();

const enquirySchema = z.object({
  name: shortText(1, 100),
  email: z.string().trim().email().max(254).refine((email) => !/[\r\n]/.test(email)),
  phone: z.string().transform(sanitizeSingleLine).pipe(z.string().regex(PHONE)),
  cleaningService: z.enum([
    "Regular residential cleaning",
    "One-off cleaning",
    "Deep cleaning",
    "End-of-tenancy cleaning",
    "Airbnb and short-let cleaning",
    "Commercial cleaning",
    "Office cleaning",
    "Other",
  ]),
  propertyType: z.enum(["House", "Flat", "Apartment", "Office", "Retail", "Gym", "Restaurant", "Other"]),
  postcode: z.string().trim().max(10).regex(UK_POSTCODE).transform((postcode) => postcode.toUpperCase()),
  preferredDate: z.preprocess(emptyToUndefined, z.iso.date().optional()),
  bedrooms: z.preprocess((value) => value === "" || value == null ? undefined : Number(value), z.number().int().min(0).max(30).optional()),
  bathrooms: z.preprocess((value) => value === "" || value == null ? undefined : Number(value), z.number().int().min(0).max(30).optional()),
  frequency: z.enum(["One-off", "Weekly", "Fortnightly", "Monthly"]),
  message: z.string().transform(sanitizeMessage).pipe(z.string().max(2000)),
  quoteDetails: quoteDetailsSchema.optional(),
  website: z.string().max(200),
}).strict();

const emailConfigSchema = z.object({
  apiKey: z.string().trim().min(1),
  from: z.string().trim().email().refine((email) => email.toLowerCase().endsWith("@hasmmatcleaning.com")),
  notificationTo: z.string().trim().email(),
  replyTo: z.string().trim().email(),
});

type RateEntry = { count: number; resetAt: number };
type SubmissionEntry = { state: "pending" | "accepted"; expiresAt: number };
type EnquiryGlobal = typeof globalThis & {
  __hasmmatEnquiryRates?: Map<string, RateEntry>;
  __hasmmatEnquirySubmissions?: Map<string, SubmissionEntry>;
};

const sharedGlobal = globalThis as EnquiryGlobal;
const rateEntries = sharedGlobal.__hasmmatEnquiryRates ??= new Map<string, RateEntry>();
const submissionEntries = sharedGlobal.__hasmmatEnquirySubmissions ??= new Map<string, SubmissionEntry>();
const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const IDEMPOTENCY_WINDOW_MS = 10 * 60 * 1000;

function jsonResponse(body: { ok: boolean; code?: string }, status: number) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function getClientAddress(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return request.headers.get("x-real-ip")?.trim() || forwardedFor?.split(",")[0]?.trim() || null;
}

function isRateLimited(address: string) {
  const now = Date.now();
  for (const [key, entry] of rateEntries) {
    if (entry.resetAt <= now) rateEntries.delete(key);
  }

  const entry = rateEntries.get(address);
  if (!entry || entry.resetAt <= now) {
    rateEntries.set(address, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > MAX_REQUESTS_PER_WINDOW;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

function getEmailConfig() {
  const config = emailConfigSchema.safeParse({
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.ENQUIRY_FROM_EMAIL,
    notificationTo: process.env.ENQUIRY_NOTIFICATION_TO,
    replyTo: process.env.ENQUIRY_REPLY_TO,
  });

  return config.success ? config.data : null;
}

function buildNotification(enquiry: z.infer<typeof enquirySchema>) {
  const quoteDetails = enquiry.quoteDetails;
  const details: [string, string][] = [
    ["Name", enquiry.name],
    ["Email", enquiry.email],
    ["Telephone", enquiry.phone],
    ["Service", enquiry.cleaningService],
    ["Property type", enquiry.propertyType],
    ["Postcode", enquiry.postcode],
    ["Frequency", enquiry.frequency],
    ["Preferred date", enquiry.preferredDate ?? "Not specified"],
    ["Bedrooms", enquiry.bedrooms === undefined ? "Not supplied" : String(enquiry.bedrooms)],
    ["Bathrooms", enquiry.bathrooms === undefined ? "Not supplied" : String(enquiry.bathrooms)],
    ["Additional requirements", enquiry.message || "None supplied"],
  ];

  if (quoteDetails) {
    details.push(
      ["Calculator service type", quoteDetails.serviceType],
      ["Calculator property type", quoteDetails.propertyType],
      ["Calculator property size", quoteDetails.size],
      ["Calculator service", quoteDetails.cleaningService],
      ["Calculator frequency", quoteDetails.frequency],
      ["Calculator extras", quoteDetails.addOns.join(", ") || "None"],
      ["Indicative calculator range", quoteDetails.estimatedRange],
    );
  }

  const text = details.map(([label, value]) => `${label}: ${value}`).join("\n");
  const rows = details.map(([label, value]) => `
    <tr>
      <th align="left" style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#475569;font-weight:600;vertical-align:top">${escapeHtml(label)}</th>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#0f172a">${escapeHtml(value).replace(/\n/g, "<br>")}</td>
    </tr>`).join("");

  return {
    text,
    html: `<div style="font-family:Arial,sans-serif;color:#0f172a;max-width:680px;margin:0 auto"><div style="background:#881337;padding:20px 24px;color:#fff"><p style="margin:0;font-size:12px;letter-spacing:1px;text-transform:uppercase">Hasmmat Cleaning</p><h1 style="margin:8px 0 0;font-size:22px">New quote enquiry</h1></div><table role="presentation" style="width:100%;border-collapse:collapse;margin-top:16px">${rows}</table><p style="margin-top:20px;font-size:12px;color:#64748b">Submitted through the Hasmmat Cleaning website.</p></div>`,
  };
}

function buildAcknowledgement(name: string) {
  const firstName = escapeHtml(name.split(" ")[0] || "there");
  return {
    subject: "We’ve received your cleaning enquiry",
    text: `Hello ${name},\n\nThank you for contacting Hasmmat Cleaning. We have received your enquiry and our team will review your requirements before getting back to you.\n\nThis email confirms receipt only. It is not a quotation, confirmed availability, or a cleaning booking. Your quote and any booking will only be agreed after our team has reviewed the request and confirmed the details with you.\n\nHasmmat Cleaning Service`,
    html: `<div style="font-family:Arial,sans-serif;color:#0f172a;background:#f8fafc;padding:32px 16px"><div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden"><div style="background:#881337;padding:22px 28px;color:#fff"><p style="margin:0;font-size:12px;letter-spacing:1px;text-transform:uppercase">Hasmmat Cleaning</p></div><div style="padding:28px"><h1 style="margin:0 0 16px;font-size:22px">We’ve received your enquiry</h1><p style="line-height:1.6">Hello ${firstName},</p><p style="line-height:1.6">Thank you for contacting Hasmmat Cleaning. Our team has received your enquiry and will review your requirements before getting back to you.</p><div style="margin:20px 0;padding:16px;border-left:3px solid #be123c;background:#fff1f2"><strong>This is confirmation of receipt only.</strong><p style="margin:8px 0 0;line-height:1.6">It is not an agreed quotation, confirmed availability, or a cleaning booking. We will confirm a quote and any booking with you separately after reviewing your request.</p></div><p style="margin:24px 0 0;line-height:1.6">Kind regards,<br><strong>Hasmmat Cleaning Service</strong></p></div></div></div>`,
  };
}

export async function POST(request: Request) {
  const emailConfig = getEmailConfig();
  if (!emailConfig) return jsonResponse({ ok: false, code: "not_configured" }, 503);

  const address = getClientAddress(request) ?? "unknown";
  if (isRateLimited(address)) {
    return jsonResponse({ ok: false, code: "rate_limited" }, 429);
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 32_000) return jsonResponse({ ok: false, code: "invalid_request" }, 413);

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return jsonResponse({ ok: false, code: "invalid_request" }, 400);
  }

  if (rawBody.length > 32_000) return jsonResponse({ ok: false, code: "invalid_request" }, 413);

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ ok: false, code: "invalid_request" }, 400);
  }

  const parsed = enquirySchema.safeParse(payload);
  if (!parsed.success) return jsonResponse({ ok: false, code: "invalid_request" }, 400);
  if (parsed.data.website.trim()) return jsonResponse({ ok: false, code: "invalid_request" }, 400);

  const idempotencyKey = request.headers.get("idempotency-key");
  if (!idempotencyKey || !/^[0-9a-f-]{36}$/i.test(idempotencyKey)) {
    return jsonResponse({ ok: false, code: "invalid_request" }, 400);
  }

  const now = Date.now();
  for (const [key, entry] of submissionEntries) {
    if (entry.expiresAt <= now) submissionEntries.delete(key);
  }

  const existingSubmission = submissionEntries.get(idempotencyKey);
  if (existingSubmission?.state === "accepted") return jsonResponse({ ok: true }, 200);
  if (existingSubmission?.state === "pending") return jsonResponse({ ok: false, code: "already_processing" }, 409);
  submissionEntries.set(idempotencyKey, { state: "pending", expiresAt: now + IDEMPOTENCY_WINDOW_MS });

  const resend = new Resend(emailConfig.apiKey);
  const from = `Hasmmat Cleaning <${emailConfig.from}>`;
  const notification = buildNotification(parsed.data);
  const acknowledgement = buildAcknowledgement(parsed.data.name);
  try {
    const notificationResult = await resend.emails.send({
      from,
      to: emailConfig.notificationTo,
      replyTo: emailConfig.replyTo,
      subject: "New Hasmmat Cleaning quote enquiry",
      text: notification.text,
      html: notification.html,
    }, {
      idempotencyKey: `${idempotencyKey}-notification`,
      signal: AbortSignal.timeout(12_000),
    });

    if (notificationResult.error) {
      submissionEntries.delete(idempotencyKey);
      return jsonResponse({ ok: false, code: "provider_error" }, 502);
    }

    const acknowledgementResult = await resend.emails.send({
      from,
      to: parsed.data.email,
      replyTo: emailConfig.replyTo,
      subject: acknowledgement.subject,
      text: acknowledgement.text,
      html: acknowledgement.html,
    }, {
      idempotencyKey: `${idempotencyKey}-acknowledgement`,
      signal: AbortSignal.timeout(12_000),
    });

    if (acknowledgementResult.error) {
      submissionEntries.delete(idempotencyKey);
      return jsonResponse({ ok: false, code: "provider_error" }, 502);
    }

    submissionEntries.set(idempotencyKey, { state: "accepted", expiresAt: Date.now() + IDEMPOTENCY_WINDOW_MS });
    return jsonResponse({ ok: true }, 200);
  } catch {
    submissionEntries.delete(idempotencyKey);
    return jsonResponse({ ok: false, code: "provider_error" }, 502);
  }
}
