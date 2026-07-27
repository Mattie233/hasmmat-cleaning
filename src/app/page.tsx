"use client";

import Link from "next/link";
import Logo from "../components/Logo";
import { useMemo, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
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
  Phone,
  ShieldCheck,
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

const galleryItems = [
  {
    title: "Residential deep clean",
    category: "Residential cleaning",
    before: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
    after: "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Workspace refresh",
    category: "Commercial cleaning",
    before: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80",
    after: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Airbnb turnaround",
    category: "Airbnb cleaning",
    before: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
    after: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "End-of-tenancy sparkle",
    category: "End-of-tenancy cleaning",
    before: "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=900&q=80",
    after: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
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
  "Do you provide cleaning supplies?",
  "Are you insured?",
  "Can I book recurring cleaning?",
  "Do you clean commercial properties?",
  "Do you offer Airbnb turnaround cleaning?",
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

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedGallery, setSelectedGallery] = useState<(typeof galleryItems)[number] | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [postcode, setPostcode] = useState("");
  const [postcodeMessage, setPostcodeMessage] = useState("Enter your postcode to see whether we cover your area.");
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    propertyType: "Residential",
    service: "Regular cleaning",
    date: "",
    message: "",
  });
  const [contactStatus, setContactStatus] = useState<"idle" | "success" | "error">("idle");
  const [quoteStep, setQuoteStep] = useState(0);
  const [quoteData, setQuoteData] = useState({
    serviceType: "Residential",
    propertyType: "House",
    rooms: "3 bedrooms, 2 bathrooms",
    size: "Medium",
    cleanType: "Regular cleaning",
    schedule: "One-off",
    frequency: "Weekly",
    addOns: [] as string[],
    date: "",
    name: "",
    email: "",
    phone: "",
  });
  const [quoteStatus, setQuoteStatus] = useState<"idle" | "success">("idle");

  const filteredGallery = useMemo(() => {
    if (activeFilter === "All") return galleryItems;
    return galleryItems.filter((item) => item.category === activeFilter);
  }, [activeFilter]);

  const priceEstimate = useMemo(() => {
    const base = quoteData.serviceType === "Commercial" ? 180 : 140;
    const sizeFactor = quoteData.size === "Large" ? 1.4 : quoteData.size === "Medium" ? 1.1 : 1;
    const roomsFactor = quoteData.rooms.includes("bedroom") ? 1.05 : 1;
    return `£${Math.round(base * sizeFactor * roomsFactor)}–£${Math.round(base * sizeFactor * roomsFactor + 140)}`;
  }, [quoteData]);

  const handleQuoteSubmit = (event: FormEvent) => {
    event.preventDefault();
    setQuoteStatus("success");
  };

  const handleContactSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      setContactStatus("error");
      return;
    }
    setContactStatus("success");
  };

  const handlePostcodeCheck = (event: FormEvent) => {
    event.preventDefault();
    const normalized = postcode.toUpperCase().replace(/\s/g, "");
    if (normalized.includes("LS") || normalized.includes("WF") || normalized.includes("YO")) {
      setPostcodeMessage("We cover your area and would be happy to help with your booking.");
      return;
    }
    setPostcodeMessage("We are expanding quickly, but please contact us to confirm availability in your postcode.");
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(137,179,151,0.16),_transparent_55%)] text-slate-900">
      <nav className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <Logo />
          </Link>
          <div className="hidden items-center gap-6 text-sm font-medium text-slate-700 lg:flex">
            {[
              ["Home", "/"],
              ["Residential", "/residential"],
              ["Commercial", "/commercial"],
              ["About", "#about"],
              ["Reviews", "#reviews"],
              ["Contact", "#contact"],
            ].map(([label, href]) => (
              <Link key={label} href={href} className="transition hover:text-rose-700">
                {label}
              </Link>
            ))}
          </div>
          <Link href="#contact" className="hidden rounded-full bg-rose-800 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-900/20 transition hover:bg-rose-700 lg:inline-flex">
            Get a Free Quote
          </Link>
          <button className="rounded-full border border-slate-300 p-2 lg:hidden" onClick={() => setMenuOpen((open) => !open)}>
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">Menu</span>
          </button>
        </div>
        {menuOpen ? (
          <div className="border-t border-slate-200 bg-white/95 px-4 py-4 lg:hidden">
            <div className="flex flex-col gap-3 text-sm font-medium text-slate-700">
              {[
                ["Home", "/"],
                ["Residential Cleaning", "/residential"],
                ["Commercial Cleaning", "/commercial"],
                ["About Us", "#about"],
                ["Service Areas", "#areas"],
                ["Reviews", "#reviews"],
                ["Contact", "#contact"],
              ].map(([label, href]) => (
                <Link key={label} href={href} className="rounded-full border border-slate-200 px-3 py-2 transition hover:border-rose-400" onClick={() => setMenuOpen(false)}>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/70 to-rose-950/70" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-24 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-28">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-rose-100 backdrop-blur">
              <Sparkles size={16} /> Premium cleaning for Leeds and surrounding areas
            </div>
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              Professional Cleaning for Homes and Businesses
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-200">
              Reliable residential and commercial cleaning services tailored to your property, schedule and requirements.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="#contact" className="inline-flex items-center justify-center rounded-full bg-rose-500 px-6 py-3.5 font-semibold text-white shadow-lg shadow-rose-400/20 transition hover:bg-rose-400">
                Get a Free Quote <ArrowRight className="ml-2" size={18} />
              </Link>
              <Link href="#services" className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 py-3.5 font-semibold text-white backdrop-blur transition hover:bg-white/20">
                View Our Services
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-rose-50">
              {[
                "Fully Insured",
                "Reliable Cleaners",
                "Flexible Scheduling",
                "Residential and Commercial",
                "Leeds and Surrounding Areas",
              ].map((item) => (
                <div key={item} className="rounded-full border border-white/20 bg-white/10 px-3 py-2 backdrop-blur">
                  {item}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} className="rounded-[32px] border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
            <div className="rounded-[28px] bg-slate-950/70 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-rose-200">Trusted by local clients</p>
                  <h2 className="mt-2 text-2xl font-semibold">Your property, polished to perfection</h2>
                </div>
                <div className="rounded-full border border-rose-400/30 bg-rose-400/10 p-3">
                  <ShieldCheck size={24} className="text-rose-300" />
                </div>
              </div>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  { label: "Properties cleaned", value: "200+" },
                  { label: "Repeat customers", value: "96%" },
                  { label: "Commercial clients", value: "45+" },
                  { label: "Areas covered", value: "30+" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-3xl font-semibold text-white">{stat.value}</p>
                    <p className="mt-1 text-sm text-slate-300">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
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
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <motion.article
                key={service.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
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
                  <Link href="#contact" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700">
                    Request a Quote
                  </Link>
                  <Link href={service.title.includes("Commercial") ? "/commercial" : service.title.includes("Residential") ? "/residential" : "#contact"} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-rose-400 hover:text-rose-700">
                    Learn More
                  </Link>
                </div>
              </motion.article>
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
                <div className="h-2 rounded-full bg-rose-400 transition-all" style={{ width: `${((quoteStep + 1) / 4) * 100}%` }} />
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
                  <label className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm">
                    <span className="mb-2 block font-medium">Bedrooms or rooms</span>
                    <input className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-white" value={quoteData.rooms} onChange={(event) => setQuoteData({ ...quoteData, rooms: event.target.value })} />
                  </label>
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
                <div className="grid gap-4">
                  <label className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm">
                    <span className="mb-2 block font-medium">Preferred date</span>
                    <input className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-white" type="date" value={quoteData.date} onChange={(event) => setQuoteData({ ...quoteData, date: event.target.value })} />
                  </label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm">
                      <span className="mb-2 block font-medium">Name</span>
                      <input className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-white" value={quoteData.name} onChange={(event) => setQuoteData({ ...quoteData, name: event.target.value })} />
                    </label>
                    <label className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm">
                      <span className="mb-2 block font-medium">Email</span>
                      <input className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-white" type="email" value={quoteData.email} onChange={(event) => setQuoteData({ ...quoteData, email: event.target.value })} />
                    </label>
                  </div>
                  <label className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm">
                    <span className="mb-2 block font-medium">Phone</span>
                    <input className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-white" value={quoteData.phone} onChange={(event) => setQuoteData({ ...quoteData, phone: event.target.value })} />
                  </label>
                </div>
              ) : null}

              <div className="mt-5 flex items-center justify-between gap-3">
                <div className="text-sm text-rose-100">
                  Estimated range: <span className="font-semibold">{priceEstimate}</span>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setQuoteStep((step) => Math.max(0, step - 1))} className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
                    Back
                  </button>
                  {quoteStep < 3 ? (
                    <button type="button" onClick={() => setQuoteStep((step) => Math.min(3, step + 1))} className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400">
                      Continue
                    </button>
                  ) : (
                    <button type="submit" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-rose-900 transition hover:bg-rose-50">
                      Request Quote
                    </button>
                  )}
                </div>
              </div>
              {quoteStatus === "success" ? <div className="mt-4 rounded-2xl border border-rose-300/30 bg-rose-500/10 p-3 text-sm text-rose-50">Your personalised quotation will be confirmed after reviewing your requirements.</div> : null}
            </form>
          </div>
        </div>
      </section>

      <section id="gallery" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-700">Before & after</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">Polished transformations, visible results</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["All", "Residential cleaning", "Commercial cleaning", "Deep cleaning", "Airbnb cleaning", "End-of-tenancy cleaning"] as const).map((filter) => (
              <button key={filter} onClick={() => setActiveFilter(filter)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeFilter === filter ? "bg-rose-700 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                {filter}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredGallery.map((item) => (
              <button key={item.title} onClick={() => { setSelectedGallery(item); setSliderPosition(50); }} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white text-left shadow-[0_20px_60px_-25px_rgba(15,23,42,0.2)]">
                <img src={item.after} alt={item.title} className="h-48 w-full object-cover" />
                <div className="p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-700">{item.category}</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">{item.title}</h3>
                </div>
              </button>
            ))}
          </div>
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-25px_rgba(15,23,42,0.2)]">
            {selectedGallery ? (
              <>
                <div className="overflow-hidden rounded-[24px] bg-slate-100">
                  <div className="relative h-[420px] w-full">
                    <img src={selectedGallery.before} alt={`${selectedGallery.title} before`} className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPosition}%` }}>
                      <img src={selectedGallery.after} alt={`${selectedGallery.title} after`} className="h-full w-full object-cover" />
                    </div>
                    <div className="absolute inset-y-0 w-1 bg-white/70" style={{ left: `${sliderPosition}%` }} />
                  </div>
                  <input type="range" min="0" max="100" value={sliderPosition} onChange={(event) => setSliderPosition(Number(event.target.value))} className="w-full accent-rose-600" />
                </div>
                <p className="mt-4 text-sm font-semibold uppercase tracking-[0.22em] text-rose-700">{selectedGallery.category}</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900">{selectedGallery.title}</h3>
                <p className="mt-3 text-lg text-slate-600">Our team focuses on delivering a spotless finish that is clear, bright and guest-ready.</p>
              </>
            ) : (
              <div className="flex h-full items-center justify-center rounded-[24px] border border-dashed border-slate-300 p-10 text-center text-slate-600">
                Select a project to preview the transformation.
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
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
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_-25px_rgba(15,23,42,0.2)]">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: "Properties cleaned", value: "200+" },
                { label: "Repeat customers", value: "96%" },
                { label: "Commercial clients", value: "45+" },
                { label: "Areas covered", value: "30+" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-3xl font-semibold text-slate-900">{stat.value}</p>
                  <p className="mt-2 text-sm text-slate-600">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-[24px] bg-gradient-to-br from-rose-50 to-slate-100 p-5">
              <div className="flex items-center gap-3 text-rose-700">
                <Clock3 size={20} />
                <p className="font-semibold">Flexible booking windows and real-time support</p>
              </div>
              <p className="mt-2 text-slate-600">We tailor every quotation and cleaning plan around your schedule and property needs.</p>
            </div>
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

      <section id="reviews" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
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
        <motion.div key={testimonialIndex} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="rounded-[32px] border border-slate-200 bg-gradient-to-br from-white to-rose-50 p-8 shadow-[0_20px_60px_-25px_rgba(15,23,42,0.2)] sm:p-10">
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
        </motion.div>
      </section>

      <section id="areas" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
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
              <input value={postcode} onChange={(event) => setPostcode(event.target.value)} placeholder="Enter postcode" className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-slate-300" />
              <button type="submit" className="rounded-full bg-rose-500 px-5 py-3 font-semibold text-white transition hover:bg-rose-400">Check availability</button>
            </form>
            <p className="mt-4 text-sm leading-7 text-slate-300">{postcodeMessage}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_-25px_rgba(15,23,42,0.2)]">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-700">About us</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">Quality, consistency and customer care at the heart of everything we do</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Hasmmat Cleaning Service Ltd is a trusted local provider of professional residential and commercial cleaning. We combine careful attention to detail with a warm, reliable service that gives property owners confidence from the first visit.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {[
                "Reliability",
                "Integrity",
                "Quality",
                "Respect",
                "Consistency",
                "Customer care",
              ].map((value) => (
                <span key={value} className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{value}</span>
              ))}
            </div>
          </div>
          <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-8 shadow-[0_20px_60px_-25px_rgba(15,23,42,0.2)]">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-700">Contact</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">Book your free consultation</h2>
            <div className="mt-6 space-y-3 text-slate-700">
              <p className="flex items-center gap-3"><Phone size={18} className="text-rose-600" /> +44 7700 000000</p>
              <p className="flex items-center gap-3"><MessageCircle size={18} className="text-rose-600" /> Hasmmatcleaningservice@gmail.com</p>
              <p className="flex items-center gap-3"><Clock3 size={18} className="text-rose-600" /> Mon–Sat • 8am–6pm</p>
            </div>
            <Link href="#contact" className="mt-6 inline-flex items-center rounded-full bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-rose-700">Start your request</Link>
          </div>
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_-25px_rgba(15,23,42,0.2)]">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-700">Contact us</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">Tell us about your property and we will follow up promptly</h2>
            <p className="mt-4 leading-8 text-slate-600">We respond quickly to enquiries, provide honest guidance and never confirm availability until the request has been reviewed by our team.</p>
            <div className="mt-6 space-y-3 text-slate-700">
              <p className="flex items-center gap-3"><Phone size={18} className="text-rose-600" /> +44 7700 000000</p>
              <p className="flex items-center gap-3"><MessageCircle size={18} className="text-rose-600" /> Hasmmatcleaningservice@gmail.com</p>
              <p className="flex items-center gap-3"><Clock3 size={18} className="text-rose-600" /> Open 7 days a week for estimates and support</p>
            </div>
          </div>
          <form onSubmit={handleContactSubmit} className="rounded-[32px] border border-slate-200 bg-slate-950 p-8 text-white shadow-[0_20px_60px_-25px_rgba(15,23,42,0.2)]">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm">
                <span className="mb-2 block font-medium">Name</span>
                <input className="w-full rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-white placeholder:text-slate-400" value={contactForm.name} onChange={(event) => setContactForm({ ...contactForm, name: event.target.value })} placeholder="Your name" />
              </label>
              <label className="text-sm">
                <span className="mb-2 block font-medium">Email</span>
                <input className="w-full rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-white placeholder:text-slate-400" type="email" value={contactForm.email} onChange={(event) => setContactForm({ ...contactForm, email: event.target.value })} placeholder="you@email.com" />
              </label>
              <label className="text-sm">
                <span className="mb-2 block font-medium">Telephone number</span>
                <input className="w-full rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-white placeholder:text-slate-400" value={contactForm.phone} onChange={(event) => setContactForm({ ...contactForm, phone: event.target.value })} placeholder="Phone" />
              </label>
              <label className="text-sm">
                <span className="mb-2 block font-medium">Property type</span>
                <select className="w-full rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-white" value={contactForm.propertyType} onChange={(event) => setContactForm({ ...contactForm, propertyType: event.target.value })}>
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                </select>
              </label>
            </div>
            <label className="mt-4 block text-sm">
              <span className="mb-2 block font-medium">Required service</span>
              <input className="w-full rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-white placeholder:text-slate-400" value={contactForm.service} onChange={(event) => setContactForm({ ...contactForm, service: event.target.value })} placeholder="Regular cleaning" />
            </label>
            <label className="mt-4 block text-sm">
              <span className="mb-2 block font-medium">Preferred date</span>
              <input className="w-full rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-white" type="date" value={contactForm.date} onChange={(event) => setContactForm({ ...contactForm, date: event.target.value })} />
            </label>
            <label className="mt-4 block text-sm">
              <span className="mb-2 block font-medium">Message</span>
              <textarea className="min-h-32 w-full rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-white placeholder:text-slate-400" value={contactForm.message} onChange={(event) => setContactForm({ ...contactForm, message: event.target.value })} placeholder="Tell us more about your property and cleaning requirements." />
            </label>
            <button type="submit" className="mt-6 rounded-full bg-rose-500 px-5 py-3 font-semibold text-white transition hover:bg-rose-400">Submit enquiry</button>
            {contactStatus === "success" ? <p className="mt-3 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">Thanks for your enquiry. Our team will follow up shortly.</p> : null}
            {contactStatus === "error" ? <p className="mt-3 rounded-2xl border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-200">Please complete the required details before sending.</p> : null}
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_-25px_rgba(15,23,42,0.2)]">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-700">Frequently asked questions</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">Helpful answers before you book</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={faq} className="rounded-2xl border border-slate-200 bg-slate-50">
                <button className="flex w-full items-center justify-between px-5 py-4 text-left" onClick={() => setOpenFaq(openFaq === index ? null : index)}>
                  <span className="font-semibold text-slate-900">{faq}</span>
                  <ChevronDown className={`transition ${openFaq === index ? "rotate-180" : ""}`} />
                </button>
                {openFaq === index ? <p className="px-5 pb-5 text-slate-600">We tailor every cleaning plan around your property, schedule and preferred level of detail, while staying transparent about pricing and service scope.</p> : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <button className="fixed bottom-24 right-4 z-40 rounded-full bg-rose-600 p-4 text-white shadow-xl shadow-rose-900/20 lg:right-8">
        <MessageCircle size={22} />
      </button>
      <Link href="#contact" className="fixed bottom-6 right-4 z-40 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-xl lg:right-8">
        Book a Cleaning Visit
      </Link>

      <footer className="border-t border-slate-200 bg-slate-950 text-slate-300">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr_0.9fr] lg:px-8">
          <div>
            <p className="text-lg font-semibold tracking-[0.3em] text-white">HASMMAT CLEANING SERVICE LTD</p>
            <p className="mt-3 max-w-md text-sm leading-7 text-slate-400">Professional residential and commercial cleaning for Leeds and surrounding areas.</p>
            <p className="mt-4 text-sm text-slate-400">Company registration number: 15850067</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white">Quick links</h3>
            <div className="mt-4 space-y-2 text-sm">
              <Link href="/residential" className="block transition hover:text-rose-300">Residential Cleaning</Link>
              <Link href="/commercial" className="block transition hover:text-rose-300">Commercial Cleaning</Link>
              <Link href="#about" className="block transition hover:text-rose-300">About Us</Link>
              <Link href="#contact" className="block transition hover:text-rose-300">Contact</Link>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white">Contact</h3>
            <div className="mt-4 space-y-2 text-sm text-slate-400">
              <p>Hasmmatcleaningservice@gmail.com</p>
              <p>+44 7700 000000</p>
              <p>Leeds service area</p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
