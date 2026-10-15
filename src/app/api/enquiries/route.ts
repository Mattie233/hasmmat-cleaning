import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UK_POSTCODE = /^(GIR 0AA|[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2})$/i;
const PHONE = /^[+\d][\d\s().-]{6,23}$/;
const emptyToUndefined = (value: unknown) => value === "" || value == null ? undefined : value;

const quoteDetailsSchema = z.object({
  serviceType: z.enum(["Residential", "Commercial"]),
  propertyType: z.string().trim().min(1).max(50),
  bedrooms: z.number().int().min(0).max(30).optional(),
  bathrooms: z.number().int().min(0).max(30).optional(),
  size: z.enum(["Small", "Medium", "Large"]),
  cleaningService: z.string().trim().min(2).max(80),
  frequency: z.enum(["One-off", "Weekly", "Fortnightly", "Monthly"]),
  addOns: z.array(z.string().trim().min(1).max(60)).max(10),
  estimatedRange: z.string().trim().min(1).max(60),
}).strict();

const enquirySchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().regex(PHONE),
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
  message: z.string().trim().max(2000),
  quoteDetails: quoteDetailsSchema.optional(),
  website: z.string().max(200),
}).strict();

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

function getGetformEndpoint() {
  const configuredEndpoint = process.env.GETFORM_ENDPOINT;
  if (!configuredEndpoint) return null;

  try {
    const endpoint = new URL(configuredEndpoint);
    if (
      endpoint.protocol !== "https:" ||
      !["getform.io", "www.getform.io"].includes(endpoint.hostname) ||
      !/^\/f\/[A-Za-z0-9_-]+\/?$/.test(endpoint.pathname)
    ) {
      return null;
    }
    return endpoint;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const endpoint = getGetformEndpoint();
  if (!endpoint) return jsonResponse({ ok: false, code: "not_configured" }, 503);

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

  const formData = new FormData();
  const { quoteDetails, ...enquiry } = parsed.data;
  for (const [key, value] of Object.entries(enquiry)) {
    if (value !== undefined && value !== "") formData.append(key, String(value));
  }
  if (quoteDetails) formData.append("quoteDetails", JSON.stringify(quoteDetails));

  try {
    const providerResponse = await fetch(endpoint, {
      method: "POST",
      body: formData,
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });

    if (!providerResponse.ok) {
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
