import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import EnquiryForm from "../../components/public/EnquiryForm";
import PublicFooter from "../../components/public/PublicFooter";
import PublicHeader from "../../components/public/PublicHeader";

export const metadata: Metadata = {
  title: "Airbnb & Short-Let Cleaning | Hasmmat Cleaning Service",
  description: "Short-let changeover cleaning, linen changes and guest-ready checks. Contact Hasmmat Cleaning Service to discuss your property and availability.",
};

const services = [
  "Cleaning between guest bookings",
  "Optional linen changes",
  "Guest-ready property checks",
];

export default function AirbnbPage() {
  return (
    <>
      <PublicHeader />
      <main className="public-page min-h-screen bg-white text-slate-900">
        <section className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-700">Airbnb &amp; short-let cleaning</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">Guest-ready changeovers, made simpler</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Cleaning support between bookings for short-let hosts and property managers. Tell us about your property and schedule so we can discuss availability.
            </p>
            <Link href="#enquiry" className="mt-7 inline-flex items-center rounded-full bg-rose-800 px-5 py-3 font-semibold text-white transition hover:bg-rose-700">
              Request an Airbnb cleaning quote <ArrowRight className="ml-2" size={18} />
            </Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
            <img src="/images/image0.jpeg" alt="Interior of a short-let property" className="aspect-[4/3] w-full object-cover" />
          </div>
        </section>

        <section className="border-y border-slate-200 bg-slate-50/70">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[0.8fr_1.2fr] lg:px-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-700">Short-let support</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">A considered reset between stays</h2>
            </div>
            <ul className="grid gap-4 sm:grid-cols-3">
              {services.map((service) => (
                <li key={service} className="flex items-start gap-3 text-slate-700">
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0 text-rose-700" size={19} />
                  <span>{service}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <EnquiryForm id="enquiry" initialValues={{ cleaningService: "Airbnb and short-let cleaning", propertyType: "Apartment" }} />
      </main>
      <PublicFooter />
    </>
  );
}
