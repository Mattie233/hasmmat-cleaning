import Link from "next/link";

export default function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr_0.9fr] lg:px-8">
        <div>
          <p className="text-base font-semibold text-white">HASMMAT CLEANING SERVICE LTD</p>
          <p className="mt-3 max-w-md text-sm leading-7 text-slate-400">Professional residential and commercial cleaning for Leeds and surrounding areas.</p>
          <p className="mt-4 text-sm text-slate-400">Company registration number: 15850067</p>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase text-white">Quick links</h2>
          <nav aria-label="Footer navigation" className="mt-4 space-y-2 text-sm">
            <Link href="/residential" className="block transition hover:text-rose-300">Residential Cleaning</Link>
            <Link href="/commercial" className="block transition hover:text-rose-300">Commercial Cleaning</Link>
            <Link href="/#about" className="block transition hover:text-rose-300">About Us</Link>
            <Link href="/#contact" className="block transition hover:text-rose-300">Contact</Link>
          </nav>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase text-white">Contact</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-400">
            <p><a href="mailto:Hasmmatcleaningservice@gmail.com" className="hover:text-rose-300">Hasmmatcleaningservice@gmail.com</a></p>
            <p><a href="tel:07983818344" className="hover:text-rose-300">07983818344</a></p>
            <p>Leeds service area</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
