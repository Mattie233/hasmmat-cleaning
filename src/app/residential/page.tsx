import Link from "next/link";
import { CheckCircle2, Sparkles, Bath, BedDouble, Sofa, Utensils, ArrowRight } from "lucide-react";

const checklist = [
  {
    title: "Kitchens",
    items: ["Surface sanitising", "Appliance wipe-down", "Floor mopping", "Bins emptied"],
  },
  {
    title: "Bathrooms",
    items: ["Toilet sanitisation", "Shower and bath cleaning", "Mirror polish", "Towel refresh"],
  },
  {
    title: "Bedrooms",
    items: ["Dusting", "Bed making", "Furniture care", "Floor vacuuming"],
  },
  {
    title: "Living areas",
    items: ["Vacuuming", "Dusting", "Window wipe-down", "Soft furnishing attention"],
  },
];

const extras = ["Oven cleaning", "Carpet cleaning", "Window cleaning", "Laundry and linen change", "Fridge clean"];

export default function ResidentialPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(137,179,151,0.16),_transparent_55%)] text-slate-900">
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-700">Residential cleaning</p>
            <h1 className="mt-3 text-4xl font-semibold text-slate-900 sm:text-5xl">
              Dependable cleaning for homes, flats and apartments
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Choose a regular visit, a one-off refresh, or a deep clean for busy homes, family properties and rental accommodation.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {[
                "Weekly cleaning",
                "Fortnightly cleaning",
                "Monthly cleaning",
                "One-off cleaning",
                "Deep cleaning",
                "End-of-tenancy cleaning",
              ].map((item) => (
                <span key={item} className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_-25px_rgba(15,23,42,0.2)]">
            <div className="rounded-[24px] bg-gradient-to-br from-slate-900 to-rose-900 p-6 text-white">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200">Popular options</p>
              <div className="mt-5 space-y-4">
                {[
                  { title: "Weekly cleaning", desc: "Consistent home care with flexible scheduling." },
                  { title: "Deep cleaning", desc: "Detailed treatment for stubborn dirt and neglected areas." },
                  { title: "Move-in / move-out", desc: "A polished finish for new tenants and landlords." },
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
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_-25px_rgba(15,23,42,0.2)]">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-700">What is included</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">A room-by-room cleaning checklist</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {checklist.map((section) => (
                <div key={section.title} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center gap-3">
                    {section.title === "Kitchens" ? <Utensils size={20} className="text-rose-600" /> : null}
                    {section.title === "Bathrooms" ? <Bath size={20} className="text-rose-600" /> : null}
                    {section.title === "Bedrooms" ? <BedDouble size={20} className="text-rose-600" /> : null}
                    {section.title === "Living areas" ? <Sofa size={20} className="text-rose-600" /> : null}
                    <h3 className="text-xl font-semibold text-slate-900">{section.title}</h3>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-slate-600">
                    {section.items.map((item) => (
                      <li key={item} className="flex items-center gap-2"><CheckCircle2 size={16} className="text-rose-600" /> {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[32px] border border-slate-200 bg-slate-950 p-8 text-white shadow-[0_20px_60px_-25px_rgba(15,23,42,0.2)]">
            <div className="flex items-center gap-3 text-rose-200">
              <Sparkles size={20} />
              <p className="text-sm font-semibold uppercase tracking-[0.3em]">Optional extras</p>
            </div>
            <h2 className="mt-3 text-3xl font-semibold">Add more detail where it matters most</h2>
            <div className="mt-6 space-y-3">
              {extras.map((extra) => (
                <div key={extra} className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm font-medium">{extra}</div>
              ))}
            </div>
            <Link href="#contact" className="mt-8 inline-flex items-center rounded-full bg-rose-500 px-5 py-3 font-semibold text-white transition hover:bg-rose-400">
              Request a quote <ArrowRight className="ml-2" size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_-25px_rgba(15,23,42,0.2)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-700">Quotation request</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">Let us tailor a plan around your home</h2>
          <p className="mt-4 max-w-2xl text-lg text-slate-600">Tell us about your property, preferred frequency and any extras and our team will prepare a personalised quote.</p>
          <Link href="/" className="mt-8 inline-flex items-center rounded-full bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-rose-700">Return to homepage</Link>
        </div>
      </section>
    </main>
  );
}
