"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

export type QuoteDetails = {
  serviceType: "Residential" | "Commercial";
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  size: "Small" | "Medium" | "Large";
  cleaningService: string;
  frequency: "One-off" | "Weekly" | "Fortnightly" | "Monthly";
  addOns: string[];
  estimatedRange: string;
};

export type EnquiryPrefill = {
  name?: string;
  email?: string;
  phone?: string;
  cleaningService?: string;
  propertyType?: string;
  postcode?: string;
  preferredDate?: string;
  bedrooms?: string;
  bathrooms?: string;
  frequency?: string;
  message?: string;
  quoteDetails?: QuoteDetails;
};

type EnquiryValues = Required<Omit<EnquiryPrefill, "quoteDetails">> & {
  quoteDetails?: QuoteDetails;
  website: string;
};

type EnquiryFormProps = {
  id?: string;
  initialValues?: EnquiryPrefill;
  focusOnMount?: boolean;
};

const serviceOptions = [
  "Regular residential cleaning",
  "One-off cleaning",
  "Deep cleaning",
  "End-of-tenancy cleaning",
  "Airbnb and short-let cleaning",
  "Commercial cleaning",
  "Office cleaning",
  "Other",
];

const propertyOptions = ["House", "Flat", "Apartment", "Office", "Retail", "Gym", "Restaurant", "Other"];
const frequencyOptions = ["One-off", "Weekly", "Fortnightly", "Monthly"] as const;

function makeInitialValues(initialValues: EnquiryPrefill = {}): EnquiryValues {
  return {
    name: initialValues.name ?? "",
    email: initialValues.email ?? "",
    phone: initialValues.phone ?? "",
    cleaningService: initialValues.cleaningService ?? "Regular residential cleaning",
    propertyType: initialValues.propertyType ?? "House",
    postcode: initialValues.postcode ?? "",
    preferredDate: initialValues.preferredDate ?? "",
    bedrooms: initialValues.bedrooms ?? "",
    bathrooms: initialValues.bathrooms ?? "",
    frequency: initialValues.frequency ?? "One-off",
    message: initialValues.message ?? "",
    quoteDetails: initialValues.quoteDetails,
    website: "",
  };
}

export default function EnquiryForm({ id = "enquiry", initialValues, focusOnMount = false }: EnquiryFormProps) {
  const [values, setValues] = useState(() => makeInitialValues(initialValues));
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const submittingRef = useRef(false);
  const idempotencyKeyRef = useRef<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const feedbackRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (focusOnMount) nameInputRef.current?.focus();
  }, [focusOnMount]);

  useEffect(() => {
    if (status === "success" || status === "error") feedbackRef.current?.focus();
  }, [status]);

  function updateValue<K extends keyof EnquiryValues>(key: K, value: EnquiryValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;

    submittingRef.current = true;
    const idempotencyKey = idempotencyKeyRef.current ?? crypto.randomUUID();
    idempotencyKeyRef.current = idempotencyKey;
    setStatus("sending");
    setErrorMessage("");

    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { code?: string } | null;
        setErrorMessage(
            result?.code === "rate_limited"
              ? "Too many attempts. Please wait a few minutes or contact us by phone."
              : result?.code === "not_configured"
                ? "Online enquiries are not configured yet. Please contact us by phone or email."
                : "We couldn't send your enquiry. Please try again or contact us by phone or email.",
        );
        setStatus("error");
        return;
      }

      idempotencyKeyRef.current = null;
      setStatus("success");
      setValues(makeInitialValues({
        cleaningService: values.cleaningService,
        propertyType: values.propertyType,
      }));
    } catch {
      setErrorMessage("We couldn't connect to send your enquiry. Please try again or contact us by phone or email.");
      setStatus("error");
    } finally {
      submittingRef.current = false;
    }
  }

  const isHomeProperty = ["House", "Flat", "Apartment"].includes(values.propertyType);

  return (
    <section id={id} aria-labelledby={`${id}-title`} className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-25px_rgba(15,23,42,0.18)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-700">Enquiries</p>
          <h2 id={`${id}-title`} className="mt-2 text-3xl font-semibold text-slate-900">Tell us what you need</h2>
          <p className="mt-4 leading-7 text-slate-600">Send your requirements to our team and we will follow up to discuss availability and a quote.</p>
          <div className="mt-6 space-y-3 text-slate-700">
            <p><a className="font-medium underline decoration-slate-300 underline-offset-4 hover:text-rose-700" href="tel:07983818344">Call 07983818344</a></p>
            <p><a className="break-all font-medium underline decoration-slate-300 underline-offset-4 hover:text-rose-700" href="mailto:Hasmmatcleaningservice@gmail.com">Hasmmatcleaningservice@gmail.com</a></p>
          </div>
        </div>

        <form onSubmit={handleSubmit} aria-busy={status === "sending"} className="relative rounded-[28px] border border-slate-200 bg-slate-950 p-5 text-white shadow-[0_20px_60px_-25px_rgba(15,23,42,0.2)] sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-2 block font-medium">Name <span aria-hidden="true">*</span></span>
              <input ref={nameInputRef} autoComplete="name" name="name" required maxLength={100} value={values.name} onChange={(event) => updateValue("name", event.target.value)} className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-white placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-300" />
            </label>
            <label className="text-sm">
              <span className="mb-2 block font-medium">Email address <span aria-hidden="true">*</span></span>
              <input autoComplete="email" inputMode="email" name="email" type="email" required maxLength={254} value={values.email} onChange={(event) => updateValue("email", event.target.value)} className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-white placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-300" />
            </label>
            <label className="text-sm">
              <span className="mb-2 block font-medium">Telephone number <span aria-hidden="true">*</span></span>
              <input autoComplete="tel" inputMode="tel" name="phone" type="tel" required maxLength={24} value={values.phone} onChange={(event) => updateValue("phone", event.target.value)} className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-white placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-300" />
            </label>
            <label className="text-sm">
              <span className="mb-2 block font-medium">Cleaning service <span aria-hidden="true">*</span></span>
              <select name="cleaningService" required value={values.cleaningService} onChange={(event) => updateValue("cleaningService", event.target.value)} className="w-full rounded-xl border border-white/15 bg-slate-900 px-3 py-3 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-300">
                {serviceOptions.map((service) => <option key={service}>{service}</option>)}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-2 block font-medium">Property type <span aria-hidden="true">*</span></span>
              <select name="propertyType" required value={values.propertyType} onChange={(event) => updateValue("propertyType", event.target.value)} className="w-full rounded-xl border border-white/15 bg-slate-900 px-3 py-3 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-300">
                {propertyOptions.map((property) => <option key={property}>{property}</option>)}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-2 block font-medium">Property postcode <span aria-hidden="true">*</span></span>
              <input autoComplete="postal-code" name="postcode" required maxLength={10} pattern="(GIR 0AA|[A-Za-z]{1,2}[0-9][A-Za-z0-9]?\s?[0-9][A-Za-z]{2})" title="Enter a valid UK postcode" value={values.postcode} onChange={(event) => updateValue("postcode", event.target.value.toUpperCase())} className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-3 uppercase text-white placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-300" />
            </label>
            <label className="text-sm">
              <span className="mb-2 block font-medium">Service frequency <span aria-hidden="true">*</span></span>
              <select name="frequency" required value={values.frequency} onChange={(event) => updateValue("frequency", event.target.value)} className="w-full rounded-xl border border-white/15 bg-slate-900 px-3 py-3 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-300">
                {frequencyOptions.map((frequency) => <option key={frequency}>{frequency}</option>)}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-2 block font-medium">Preferred date <span className="font-normal text-slate-400">(optional)</span></span>
              <input name="preferredDate" type="date" value={values.preferredDate} onChange={(event) => updateValue("preferredDate", event.target.value)} className="w-full rounded-xl border border-white/15 bg-slate-900 px-3 py-3 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-300" />
            </label>
            {isHomeProperty ? (
              <>
                <label className="text-sm">
                  <span className="mb-2 block font-medium">Bedrooms <span className="font-normal text-slate-400">(optional)</span></span>
                  <input name="bedrooms" type="number" min="0" max="30" inputMode="numeric" value={values.bedrooms} onChange={(event) => updateValue("bedrooms", event.target.value)} className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-300" />
                </label>
                <label className="text-sm">
                  <span className="mb-2 block font-medium">Bathrooms <span className="font-normal text-slate-400">(optional)</span></span>
                  <input name="bathrooms" type="number" min="0" max="30" inputMode="numeric" value={values.bathrooms} onChange={(event) => updateValue("bathrooms", event.target.value)} className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-300" />
                </label>
              </>
            ) : null}
          </div>

          <label className="mt-4 block text-sm">
            <span className="mb-2 block font-medium">Additional requirements or message <span className="font-normal text-slate-400">(optional)</span></span>
            <textarea name="message" maxLength={2000} rows={4} value={values.message} onChange={(event) => updateValue("message", event.target.value)} className="w-full resize-y rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-white placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-300" />
          </label>

          {values.quoteDetails ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
              <p className="font-semibold text-white">Estimate details will be included</p>
              <p className="mt-1">{values.quoteDetails.cleaningService} · {values.quoteDetails.propertyType}{values.quoteDetails.bedrooms !== undefined ? ` · ${values.quoteDetails.bedrooms} bedroom(s), ${values.quoteDetails.bathrooms ?? 0} bathroom(s)` : ""} · {values.quoteDetails.frequency}</p>
              <p className="mt-1">Calculator range: {values.quoteDetails.estimatedRange} (indicative, subject to review)</p>
            </div>
          ) : null}

          <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
            <label htmlFor={`${id}-website`}>Leave this field empty</label>
            <input id={`${id}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" value={values.website} onChange={(event) => updateValue("website", event.target.value)} />
          </div>

          <button type="submit" disabled={status === "sending"} className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-rose-500 px-5 py-3 font-semibold text-white transition hover:bg-rose-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300 disabled:cursor-wait disabled:opacity-70 sm:w-auto">
            {status === "sending" ? "Sending enquiry…" : "Submit enquiry"}
          </button>

          {status === "success" ? (
            <p ref={feedbackRef} tabIndex={-1} role="status" aria-live="polite" className="mt-4 rounded-xl border border-emerald-300/30 bg-emerald-500/10 p-4 text-sm text-emerald-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-300">
              Your enquiry was accepted. Our team will follow up shortly.
            </p>
          ) : null}
          {status === "error" ? (
            <p ref={feedbackRef} tabIndex={-1} role="alert" aria-live="assertive" className="mt-4 rounded-xl border border-rose-300/40 bg-rose-500/10 p-4 text-sm text-rose-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-300">
              {errorMessage}
            </p>
          ) : null}
        </form>
      </div>
    </section>
  );
}
