import Link from "next/link";
import { ArrowRight, Briefcase, Building2, CheckCircle2, Sparkles, Store } from "lucide-react";

const sectors = [
  "Offices",
  "Gyms and fitness centres",
  "Retail properties",
  "Communal areas",
  "Letting agencies",
  "Serviced accommodation",
  "Restaurants and hospitality",
  "Small business premises",
];

export default function CommercialPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(137,179,151,0.16),_transparent_55%)] text-slate-900">
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-700">Commercial cleaning</p>
            <h1 className="mt-3 text-4xl font-semibold text-slate-900 sm:text-5xl">
              Professional cleaning for business premises across Leeds
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              We create tailored commercial cleaning plans around your hours, footfall and standards, helping your workplaces stay welcoming, hygienic and presentation-ready.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {[
                "Office cleaning",
                "Gym cleaning",
                "Retail cleaning",
                "Letting agency cleaning",
                "Hospitality cleaning",
              ].map((item) => (
                <span key={item} className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_-25px_rgba(15,23,42,0.2)]">
            <div className="rounded-[24px] bg-gradient-to-br from-slate-900 to-rose-900 p-6 text-white">
              <div className="flex items-center gap-3 text-rose-200">
                <Building2 size={20} />
                <p className="text-sm font-semibold uppercase tracking-[0.3em]">Flexible business support</p>
              </div>
              <div className="mt-6 space-y-4">
                {[
                  { title: "Out-of-hours visits", desc: "Work around your business schedule." },
                  { title: "Custom frequency", desc: "Daily, weekly or periodic service options." },
                  { title: "Supplies available", desc: "We can provide equipment and consumables where needed." },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-300">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_-25px_rgba(15,23,42,0.2)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-700">We support</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">Businesses of all sizes and sectors</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {sectors.map((sector) => (
              <div key={sector} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-3">
                  {sector.includes("Retail") || sector.includes("Hospitality") ? <Store size={20} className="text-rose-600" /> : <Briefcase size={20} className="text-rose-600" />}
                  <h3 className="font-semibold text-slate-900">{sector}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[32px] border border-slate-200 bg-slate-950 p-8 text-white shadow-[0_20px_60px_-25px_rgba(15,23,42,0.2)]">
            <div className="flex items-center gap-3 text-rose-200">
              <Sparkles size={20} />
              <p className="text-sm font-semibold uppercase tracking-[0.3em]">Commercial enquiry</p>
            </div>
            <h2 className="mt-3 text-3xl font-semibold">Let us assess your premises</h2>
            <p className="mt-4 leading-8 text-slate-300">Commercial cleaning plans are customised following an assessment of the premises, expected traffic and the cleaning standards required.</p>
            <div className="mt-6 space-y-3 text-sm text-slate-300">
              {[
                "Business name",
                "Business type",
                "Property address",
                "Approximate property size",
                "Number of required cleaning hours",
                "Cleaning frequency",
                "Preferred cleaning days",
                "Whether cleaning supplies are required",
                "Preferred start date",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2"><CheckCircle2 size={16} className="text-rose-400" /> {item}</div>
              ))}
            </div>
          </div>
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_-25px_rgba(15,23,42,0.2)]">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-700">Book a commercial visit</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">Start with a no-obligation enquiry</h2>
            <p className="mt-4 text-lg text-slate-600">We will follow up with recommendations, pricing guidance and an initial service plan for your property.</p>
            <Link href="/" className="mt-8 inline-flex items-center rounded-full bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-rose-700">
              Return to homepage <ArrowRight className="ml-2" size={18} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
