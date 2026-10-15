"use client";

import Link from "next/link";
import { Fragment, useMemo, useState, type FormEvent } from "react";
import EnquiryForm, { type EnquiryPrefill, type QuoteDetails } from "../components/public/EnquiryForm";
import PublicFooter from "../components/public/PublicFooter";
import PublicHeader from "../components/public/PublicHeader";
import {
  ArrowRight,
  Bath,
  BedDouble,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  House,
  MessageCircle,
  Sparkles,
  Star,
  Store,
  Waves,
} from "lucide-react";

const services = [
  {
    title: "Residential Cleaning",
    description: "Regular and one-off cleaning for homes, flats and apartments.",
    icon: House,
    badge: "Homes",
  },
  {
    title: "Commercial Cleaning",
    description: "Professional cleaning for offices, gyms and retail premises.",
    icon: Building2,
    badge: "Businesses",
  },
  {
    title: "Airbnb & Short-Let",
    description: "Refresh your property between bookings and keep every stay guest-ready.",
    icon: Store,
    badge: "Guest Ready",
  },
  {
    title: "Deep Cleaning",
    description: "Detailed top-to-bottom cleaning for neglected areas and high-touch spaces.",
    icon: Sparkles,
    badge: "Detailed",
  },
  {
    title: "End-of-Tenancy",
    description: "Move-in and move-out cleans designed for tenants, landlords and agents.",
    icon: BedDouble,
    badge: "Move Out",
  },
  {
    title: "Office Cleaning",
    description: "Flexible schedules that work around busy operating hours and footfall.",
    icon: Building2,
    badge: "Office",
  },
];

const homeStats = [
  { label: "Properties cleaned", value: "50+" },
  { label: "Repeat customers", value: "96%" },
  { label: "Commercial clients", value: "2" },
  { label: "Areas covered", value: "10+" },
];

const serviceEnquiryDefaults: Record<string, EnquiryPrefill> = {
  "Residential Cleaning": { cleaningService: "Regular residential cleaning", propertyType: "House" },
  "Commercial Cleaning": { cleaningService: "Commercial cleaning", propertyType: "Office" },
  "Airbnb & Short-Let": { cleaningService: "Airbnb and short-let cleaning", propertyType: "Apartment" },
  "Deep Cleaning": { cleaningService: "Deep cleaning", propertyType: "House" },
  "End-of-Tenancy": { cleaningService: "End-of-tenancy cleaning", propertyType: "Flat" },
  "Office Cleaning": { cleaningService: "Office cleaning", propertyType: "Office" },
};

const newLocal = "";
const galleryItems = [
  {
    id: "residential-deep-clean",
    title: "Residential deep clean",
    category: "Residential cleaning",
    before: "/images/res7.jpg",
    after: "/images/res8.jpg",
    images: [
      "/images/res1.jpg",
      "/images/res2.jpg",
      "/images/res3.jpg",
      "/images/res4.jpg",
      "/images/res6.jpg",

    ],
  },
  {
    id: "workspace-refresh",
    title: "Workspace refresh",
    category: "Commercial cleaning",
    images: [
      "/images/commercial-1.jpg",
      "/images/commercial-2.jpg",
      "/images/commercial-3.jpg",
      "/images/commercial-4.jpg",
    ],
  },
  {
    id: "airbnb-turnaround",
    title: "Airbnb turnaround",
    category: "Airbnb cleaning",
    before: "/images/airbnb-2.jpg",
    after: "/images/airbnb-1.jpg",
    images: [
      "/images/airbnb-1.jpg",
      "/images/airbnb-2.jpg",
      "/images/air.jpg",
      "/images/image0.jpeg",
      "/images/image1.jpeg",
      "/images/image7.jpeg",
      "/images/image10.jpeg",
      "/images/IMAGE11.jpg",
      "/images/Image12.jpg",
    ],
  },
  {
    id: "end-of-tenancy-sparkle",
    title: "End-of-tenancy sparkle",
    category: "End-of-tenancy cleaning",
    before: "/images/eot2.jpg",
    after: "/images/eot1.jpg",
    images: [
      "/images/eot1.jpg",
      "/images/eot2.jpg",
      "/images/eot3.jpg",
      "/images/eot4.jpg",


    ],


  },
];

const testimonials = [
  {
    name: "Naomi P.",
    type: "Homeowner",
    service: "Residential cleaning",
    review:
      "The team arrived promptly, left every room immaculate and made our home feel calm again. The detail was outstanding.",
    rating: 5,
  },
  {
    name: "James L.",
    type: "Airbnb Host",
    service: "Short-let turnover",
    review:
      "Our turnovers are now effortless. Guests always comment on how fresh and polished the property feels.",
    rating: 5,
  },
  {
    name: "Aisha K.",
    type: "Letting Agent",
    service: "End-of-tenancy",
    review:
      "We rely on them for move-out cleans and the standard is consistently brilliant. The communication is excellent.",
    rating: 5,
  },
  {
    name: "Strong Leeds",
    type: "Business Client",
    service: "Commercial cleaning",
    review:
      "Hasmmat keeps our workspace spotless and presentable every week. Their reliability has made a big difference to our team and customers.",
    rating: 5,
  },
];

const faqs = [
  {
    question: "Do you provide cleaning supplies?",
    answer:
      "Yes — our teams bring standard cleaning supplies and equipment. If you prefer we use yours, let us know when booking.",
  },
  {
    question: "Are you insured?",
    answer:
      "Yes — we carry public liability and employer's liability insurance. Certificates can be provided on request.",
  },
  {
    question: "Can I book recurring cleaning?",
    answer:
      "Yes — we offer weekly, fortnightly, monthly and one-off cleans. Contact us to set up a recurring schedule that suits you.",
  },
  {
    question: "Do you clean commercial properties?",
    answer:
      "Yes — we provide office, retail and gym cleaning with flexible scheduling and commercial-grade processes.",
  },
  {
    question: "Do you offer Airbnb turnaround cleaning?",
    answer:
      "Yes — we offer quick turnovers, linen change and guest-ready checks. For same-day or high-frequency turnovers, contact us to confirm availability.",
  },
];

const serviceAreas = [
  "Leeds City Centre",
  "Beeston",
  "Holbeck",
  "Armley",
  "Bramley",
  "Headingley",
  "Cookridge",
  "Batley",
  "Selby",
  "White Rose",
];

const postcodeServiceAreas = [
  { district: "LS11", areas: ["Beeston", "Holbeck", "White Rose"] },
  { district: "LS12", areas: ["Armley"] },
  { district: "LS13", areas: ["Bramley"] },
  { district: "LS16", areas: ["Cookridge"] },
  { district: "WF17", areas: ["Batley"] },
  { district: "YO8", areas: ["Selby"] },
  { district: "LS1", areas: ["Leeds City Centre"] },
  { district: "LS2", areas: ["Leeds City Centre"] },
  { district: "LS6", areas: ["Headingley"] },
];

export default function Home() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [postcode, setPostcode] = useState("");
  const [postcodeMessage, setPostcodeMessage] = useState("Enter your postcode to see whether we cover your area.");
  const [quotePrefill, setQuotePrefill] = useState<EnquiryPrefill>();
  const [quotePrefillVersion, setQuotePrefillVersion] = useState(0);
  const [quoteStep, setQuoteStep] = useState(0);
  const [quoteData, setQuoteData] = useState({
    serviceType: "Residential",
    propertyType: "House",
    bedrooms: "3",
    bathrooms: "2",
    size: "Medium",
    cleanType: "Regular cleaning",
    frequency: "One-off",
    addOns: [] as string[],
  });

  const filteredGallery = useMemo(() => {
    if (activeFilter === "All") return galleryItems;
    return galleryItems.filter((item) => item.category === activeFilter);
  }, [activeFilter]);

  const priceEstimate = useMemo(() => {
    const base = quoteData.serviceType === "Commercial" ? 180 : 140;
    const sizeFactor = quoteData.size === "Large" ? 1.4 : quoteData.size === "Medium" ? 1.1 : 1;
    const roomsFactor = quoteData.serviceType === "Residential" && Number(quoteData.bedrooms) > 0 ? 1.05 : 1;
    return `£${Math.round(base * sizeFactor * roomsFactor)}–£${Math.round(base * sizeFactor * roomsFactor + 140)}`;
  }, [quoteData]);

  const handleQuoteSubmit = (event: FormEvent) => {
    event.preventDefault();
    const cleaningService = quoteData.serviceType === "Commercial"
      ? quoteData.propertyType === "Office" ? "Office cleaning" : "Commercial cleaning"
      : quoteData.cleanType === "Regular cleaning" ? "Regular residential cleaning"
        : quoteData.cleanType === "End-of-tenancy" ? "End-of-tenancy cleaning" : "Deep cleaning";
    const quoteDetails: QuoteDetails = {
      serviceType: quoteData.serviceType === "Commercial" ? "Commercial" : "Residential",
      propertyType: quoteData.propertyType,
      bedrooms: quoteData.serviceType === "Residential" ? Number(quoteData.bedrooms) || 0 : undefined,
      bathrooms: quoteData.serviceType === "Residential" ? Number(quoteData.bathrooms) || 0 : undefined,
      size: quoteData.size as QuoteDetails["size"],
      cleaningService,
      frequency: quoteData.frequency as QuoteDetails["frequency"],
      addOns: quoteData.addOns,
      estimatedRange: priceEstimate,
    };
    setQuotePrefill({
      cleaningService,
      propertyType: quoteData.propertyType,
      bedrooms: quoteData.bedrooms,
      bathrooms: quoteData.bathrooms,
      frequency: quoteData.frequency,
      message: quoteData.addOns.length ? `Additional services: ${quoteData.addOns.join(", ")}` : "",
      quoteDetails,
    });
    setQuotePrefillVersion((version) => version + 1);
    window.setTimeout(() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  const handlePostcodeCheck = (event: FormEvent) => {
    event.preventDefault();
    const normalized = postcode.trim().toUpperCase().replace(/\s/g, "");
    if (!/^(?:GIR0AA|[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2})$/.test(normalized)) {
      setPostcodeMessage("Please enter a valid UK postcode, for example LS1 4AB.");
      return;
    }

    const matchingArea = postcodeServiceAreas.find(({ district }) => normalized.startsWith(district));
    if (matchingArea) {
      setPostcodeMessage(`We list service in ${matchingArea.areas.join(", ")} (${matchingArea.district}). Contact us to confirm availability at your exact address.`);
      return;
    }

    setPostcodeMessage("This postcode is outside the districts listed on our site. Please contact us to confirm whether we can serve your address.");
  };

  const nextTestimonial = () => {
    setTestimonialIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setTestimonialIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const quoteSteps = [
    { title: "Service type", description: "Choose the right cleaning service for your property." },
    { title: "Property needs", description: "Tell us about the space and size." },
    { title: "Schedule", description: "Select the service type and frequency." },
    { title: "Contact", description: "Share your details and we will confirm the quote." },
  ];

  return (
    <>
      <PublicHeader />
      <main className="public-page min-h-screen bg-white text-slate-900">

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/70 to-rose-950/70" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-rose-100">
              <Sparkles aria-hidden="true" size={16} /> Cleaning for Leeds homes and businesses
            </p>
            <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
              Professional Cleaning for Homes and Businesses
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
              Residential, commercial and short-let cleaning shaped around your property and schedule.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="#contact" className="inline-flex min-h-12 items-center justify-center rounded-full bg-rose-500 px-5 py-3 font-semibold text-white transition hover:bg-rose-400">
                Get a Free Quote <ArrowRight className="ml-2" size={18} />
              </Link>
              <Link href="#services" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/30 bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/20">
                View Our Services
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Business statistics" className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-slate-200 px-4 sm:px-6 md:grid-cols-4 md:divide-y-0 lg:px-8">
          {homeStats.map((stat) => (
            <div key={stat.label} className="px-3 py-4 text-center sm:py-5">
              <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
              <p className="mt-1 text-xs text-slate-600 sm:text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="services" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-700">Our services</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">
              Tailored cleaning solutions for every property
            </h2>
          </div>
          <p className="max-w-2xl text-lg text-slate-600">
            From routine domestic care to detailed commercial cleaning, every visit is delivered with care, consistency and the highest standards.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <article
                key={service.title}
                className="group rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_20px_60px_-25px_rgba(15,23,42,0.25)] transition hover:-translate-y-1 hover:shadow-[0_30px_70px_-25px_rgba(15,23,42,0.35)]"
              >
                <div className="mb-6 flex items-center justify-between">
                  <div className="rounded-2xl bg-rose-50 p-3 text-rose-700">
                    <Icon size={24} />
                  </div>
                  <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-rose-700">
                    {service.badge}
                  </span>
                </div>
                <h3 className="text-2xl font-semibold text-slate-900">{service.title}</h3>
                <p className="mt-3 text-base leading-7 text-slate-600">{service.description}</p>
                <div className="mt-6 flex gap-3">
                  <Link
                    href="#contact"
                    onClick={() => {
                      setQuotePrefill(serviceEnquiryDefaults[service.title]);
                      setQuotePrefillVersion((version) => version + 1);
                    }}
                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
                  >
                    Request a Quote
                  </Link>
                  <Link href={service.title.includes("Commercial") ? "/commercial" : service.title.includes("Residential") ? "/residential" : service.title.includes("Airbnb") ? "/airbnb" : "#contact"} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-rose-400 hover:text-rose-700">
                    Learn More
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-[36px] border border-rose-100 bg-gradient-to-br from-rose-950 via-rose-900 to-slate-900 p-8 text-white shadow-2xl sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200">Interactive quote calculator</p>
              <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Get a tailored estimate in minutes</h2>
              <p className="mt-4 max-w-lg text-lg text-rose-50/90">
                Select the details of your property and we will build a personalised estimate that reflects your cleaning needs.
              </p>
            </div>
            <form onSubmit={handleQuoteSubmit} className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
              <div className="mb-4 h-2 rounded-full bg-white/10">
                <div className={`h-2 rounded-full bg-rose-400 transition-all ${["w-1/4", "w-2/4", "w-3/4", "w-full"][quoteStep]}`} />
              </div>
              <div className="mb-4 text-sm text-rose-100">Step {quoteStep + 1} of 4 • {quoteSteps[quoteStep].title}</div>

              {quoteStep === 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm">
                    <span className="mb-2 block font-medium">Service type</span>
                    <select className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-white" value={quoteData.serviceType} onChange={(event) => setQuoteData({ ...quoteData, serviceType: event.target.value })}>
                      <option value="Residential">Residential cleaning</option>
                      <option value="Commercial">Commercial cleaning</option>
                    </select>
                  </label>
                  <label className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm">
                    <span className="mb-2 block font-medium">Property type</span>
                    <select className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-white" value={quoteData.propertyType} onChange={(event) => setQuoteData({ ...quoteData, propertyType: event.target.value })}>
                      <option value="House">House</option>
                      <option value="Flat">Flat</option>
                      <option value="Office">Office</option>
                      <option value="Retail">Retail</option>
                    </select>
                  </label>
                </div>
              ) : null}

                      {quoteStep === 1 ? (
                <div className="grid gap-4 md:grid-cols-2">
                          {quoteData.serviceType === "Residential" ? (
                            <>
                              <label className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm">
                                <span className="mb-2 block font-medium">Bedrooms</span>
                                <input type="number" min="0" max="30" inputMode="numeric" className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-white" value={quoteData.bedrooms} onChange={(event) => setQuoteData({ ...quoteData, bedrooms: event.target.value })} />
                              </label>
                              <label className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm">
                                <span className="mb-2 block font-medium">Bathrooms</span>
                                <input type="number" min="0" max="30" inputMode="numeric" className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-white" value={quoteData.bathrooms} onChange={(event) => setQuoteData({ ...quoteData, bathrooms: event.target.value })} />
                              </label>
                            </>
                          ) : (
                            <p className="self-center text-sm text-rose-100">For commercial spaces, include room count or floor area in your enquiry message.</p>
                          )}
                  <label className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm">
                    <span className="mb-2 block font-medium">Property size</span>
                    <select className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-white" value={quoteData.size} onChange={(event) => setQuoteData({ ...quoteData, size: event.target.value })}>
                      <option value="Small">Small</option>
                      <option value="Medium">Medium</option>
                      <option value="Large">Large</option>
                    </select>
                  </label>
                </div>
              ) : null}

              {quoteStep === 2 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm">
                    <span className="mb-2 block font-medium">Type of clean</span>
                    <select className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-white" value={quoteData.cleanType} onChange={(event) => setQuoteData({ ...quoteData, cleanType: event.target.value })}>
                      <option value="Regular cleaning">Regular cleaning</option>
                      <option value="Deep cleaning">Deep cleaning</option>
                      <option value="End-of-tenancy">End-of-tenancy</option>
                    </select>
                  </label>
                  <label className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm">
                    <span className="mb-2 block font-medium">Service frequency</span>
                    <select className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-white" value={quoteData.frequency} onChange={(event) => setQuoteData({ ...quoteData, frequency: event.target.value })}>
                      <option value="Weekly">Weekly</option>
                      <option value="Fortnightly">Fortnightly</option>
                      <option value="Monthly">Monthly</option>
                      <option value="One-off">One-off</option>
                    </select>
                  </label>
                  <div className="md:col-span-2 rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm">
                    <span className="mb-2 block font-medium">Additional services</span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "Oven cleaning",
                        "Carpet cleaning",
                        "Interior window cleaning",
                        "Fridge cleaning",
                        "Laundry and linen change",
                      ].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setQuoteData({ ...quoteData, addOns: quoteData.addOns.includes(option) ? quoteData.addOns.filter((item) => item !== option) : [...quoteData.addOns, option] })}
                          className={`rounded-full px-3 py-2 text-sm ${quoteData.addOns.includes(option) ? "bg-rose-500 text-white" : "bg-white/10 text-rose-50"}`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {quoteStep === 3 ? (
                <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm text-rose-50">
                  <p className="font-semibold text-white">Your selected details</p>
                  <p className="mt-2">{quoteData.serviceType} · {quoteData.propertyType}{quoteData.serviceType === "Residential" ? ` · ${quoteData.bedrooms} bedroom(s) · ${quoteData.bathrooms} bathroom(s)` : ""} · {quoteData.size} · {quoteData.frequency}</p>
                  {quoteData.addOns.length ? <p className="mt-2">Extras: {quoteData.addOns.join(", ")}</p> : null}
                  <p className="mt-3">Calculator range: {priceEstimate}. This is indicative only; the team will confirm pricing after reviewing your enquiry.</p>
                </div>
              ) : null}

              <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-sm text-rose-100">Estimated range: <span className="font-semibold">{priceEstimate}</span></div>
                <div className="flex w-full sm:w-auto gap-2">
                  <button type="button" onClick={() => setQuoteStep((step) => Math.max(0, step - 1))} className="w-full sm:w-auto rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">Back</button>
                  {quoteStep < 3 ? (
                    <button type="button" onClick={() => setQuoteStep((step) => Math.min(3, step + 1))} className="w-full sm:w-auto rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400">Continue</button>
                  ) : (
                    <button type="submit" className="w-full sm:w-auto rounded-full bg-white px-4 py-2 text-sm font-semibold text-rose-900 transition hover:bg-rose-50">Request Quote</button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section id="gallery" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-700">Gallery</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">A closer look at our cleaning work</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["All", "Residential cleaning", "Commercial cleaning", "Deep cleaning", "Airbnb cleaning", "End-of-tenancy cleaning"] as const).map((filter) => (
              <button key={filter} onClick={() => setActiveFilter(filter)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeFilter === filter ? "bg-rose-700 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                {filter}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredGallery.map((item) => {
              const slideId = (index: number) => `gallery-${item.id}-slide-${index}`;
              return (
                <div
                  key={item.title}
                  className="gallery-card relative overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition hover:border-rose-300"
                >
                  {item.images.map((image, index) => {
                    const previousIndex = (index - 1 + item.images.length) % item.images.length;
                    const nextIndex = (index + 1) % item.images.length;

                    return (
                      <Fragment key={image}>
                        <input
                          className="gallery-slide-input"
                          type="radio"
                          name={`gallery-${item.id}`}
                          id={slideId(index)}
                          aria-label={`${item.title}, image ${index + 1} of ${item.images.length}`}
                          defaultChecked={index === 0}
                        />
                        <div className="gallery-slide relative h-52 w-full overflow-hidden bg-slate-100 sm:h-60">
                          <img src={image} alt={`${item.title}, image ${index + 1}`} className="h-full w-full object-cover" />
                          <label htmlFor={slideId(previousIndex)} className="gallery-arrow absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true">
                            <ChevronLeft size={20} />
                          </label>
                          <label htmlFor={slideId(nextIndex)} className="gallery-arrow absolute right-3 top-1/2 -translate-y-1/2" aria-hidden="true">
                            <ChevronRight size={20} />
                          </label>
                          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
                            {item.images.map((_, dotIndex) => (
                              <label
                                key={dotIndex}
                                htmlFor={slideId(dotIndex)}
                                className={`gallery-dot ${index === dotIndex ? "is-current" : ""}`}
                                aria-hidden="true"
                              />
                            ))}
                          </div>
                        </div>
                      </Fragment>
                    );
                  })}
                  <div className="p-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-700">{item.category}</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900">{item.title}</h3>
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      <section id="about" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-700">Why choose us</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">A premium, dependable cleaning partner</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Hasmmat Cleaning Service Ltd provides dependable residential and commercial cleaning with a strong focus on quality, professionalism and customer satisfaction. Our teams take pride in discreet, thoughtful service and immaculate results.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                "Professional and dependable service",
                "Fully insured business",
                "Flexible cleaning plans",
                "Carefully selected cleaners",
                "Attention to detail",
                "Competitive quotations",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <CheckCircle2 className="text-rose-600" size={20} />
                  <p className="mt-2 font-medium text-slate-800">{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
            <div className="flex items-center gap-3 text-rose-700">
              <Clock3 aria-hidden="true" size={20} />
              <h3 className="font-semibold">Flexible booking windows</h3>
            </div>
            <p className="mt-3 leading-7 text-slate-600">We tailor each quotation and cleaning plan around your schedule and property needs.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_-25px_rgba(15,23,42,0.2)] sm:p-10">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-700">How it works</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">A simple path from enquiry to a beautifully cleaned space</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-4">
            {[
              "Tell Us What You Need",
              "Receive Your Personalised Quote",
              "Select a Convenient Date",
              "Enjoy a Professionally Cleaned Space",
            ].map((step, index) => (
              <div key={step} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-600 text-white">{index + 1}</div>
                <h3 className="text-lg font-semibold text-slate-900">{step}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="reviews" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-700">Testimonials</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">Trusted by homeowners, hosts and local businesses</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={prevTestimonial} className="rounded-full border border-slate-300 p-3 text-slate-700 transition hover:border-rose-400 hover:text-rose-700"><ChevronLeft size={18} /></button>
            <button onClick={nextTestimonial} className="rounded-full border border-slate-300 p-3 text-slate-700 transition hover:border-rose-400 hover:text-rose-700"><ChevronRight size={18} /></button>
          </div>
        </div>
        <div className="rounded-[32px] border border-slate-200 bg-gradient-to-br from-white to-rose-50 p-8 shadow-[0_20px_60px_-25px_rgba(15,23,42,0.2)] sm:p-10">
          <div className="flex flex-wrap items-center gap-3 text-amber-500">
            {Array.from({ length: testimonials[testimonialIndex].rating }).map((_, index) => (<Star key={index} size={18} fill="currentColor" />))}
          </div>
          <p className="mt-5 text-xl leading-8 text-slate-700">“{testimonials[testimonialIndex].review}”</p>
          <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-semibold text-slate-900">{testimonials[testimonialIndex].name}</p>
              <p className="text-sm text-slate-600">{testimonials[testimonialIndex].type} • {testimonials[testimonialIndex].service}</p>
            </div>
            <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm">Highly recommended</div>
          </div>
        </div>
      </section>

      <section id="areas" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_-25px_rgba(15,23,42,0.2)]">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-700">Service areas</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">Covering Leeds and surrounding West Yorkshire</h2>
            <p className="mt-4 text-lg text-slate-600">We provide responsive cleaning services across Leeds city centre and nearby communities, from busy homes to commercial premises.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {serviceAreas.map((area) => (
                <div key={area} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">{area}</div>
              ))}
            </div>
          </div>
          <div className="rounded-[32px] border border-slate-200 bg-gradient-to-br from-slate-900 to-rose-950 p-8 text-white shadow-[0_20px_60px_-25px_rgba(15,23,42,0.2)]">
            <div className="flex items-center gap-3 text-rose-200">
              <Waves size={20} />
              <p className="text-sm font-semibold uppercase tracking-[0.3em]">Postcode checker</p>
            </div>
            <h3 className="mt-3 text-2xl font-semibold">Find out if your area is covered</h3>
            <form onSubmit={handlePostcodeCheck} className="mt-6 space-y-4">
              <label htmlFor="service-postcode" className="sr-only">UK postcode</label>
              <input id="service-postcode" name="postcode" type="text" autoComplete="postal-code" required maxLength={8} pattern="(GIR ?0AA|[A-Za-z]{1,2}[0-9][A-Za-z0-9]?[ ]?[0-9][A-Za-z]{2})" aria-describedby="postcode-result" value={postcode} onChange={(event) => setPostcode(event.target.value)} placeholder="Enter postcode" className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-slate-300" />
              <button type="submit" className="rounded-full bg-rose-500 px-5 py-3 font-semibold text-white transition hover:bg-rose-400">Check availability</button>
            </form>
            <p id="postcode-result" aria-live="polite" className="mt-4 text-sm leading-7 text-slate-300">{postcodeMessage}</p>
          </div>
        </div>
      </section>

      <EnquiryForm
        id="contact"
        key={`home-enquiry-${quotePrefillVersion}`}
        initialValues={quotePrefill}
        focusOnMount={quotePrefillVersion > 0}
      />

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_-25px_rgba(15,23,42,0.2)]">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-700">Frequently asked questions</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">Helpful answers before you book</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details key={faq.question} className="faq-disclosure rounded-2xl border border-slate-200 bg-slate-50">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700">
                  <span className="font-semibold text-slate-900">{faq.question}</span>
                  <ChevronDown aria-hidden="true" className="faq-chevron shrink-0 transition-transform" />
                </summary>
                <p className="px-5 pb-5 text-slate-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-5 border-y border-slate-200 py-7 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase text-rose-700">Accommodation booking</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">Looking to book accommodation?</h2>
            <p className="mt-1 text-slate-600">Explore Hasmmat Residence booking options.</p>
          </div>
          <a href="https://hasmmatresidence.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold text-slate-900 underline decoration-rose-600 underline-offset-4 hover:text-rose-700">
            Visit Hasmmat Residence <ArrowRight aria-hidden="true" size={18} />
          </a>
        </div>
      </section>

      <button className="hidden lg:inline-flex fixed bottom-24 right-4 z-40 rounded-full bg-rose-600 p-4 text-white shadow-xl shadow-rose-900/20 lg:right-8">
        <MessageCircle size={22} />
      </button>
      <Link href="#contact" className="fixed bottom-6 right-4 z-40 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-xl lg:right-8">
        Book a Cleaning Visit
      </Link>

      </main>
      <PublicFooter />
    </>
  );
}
