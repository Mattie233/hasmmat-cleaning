import Link from "next/link";
import { Menu, X } from "lucide-react";
import Logo from "../Logo";

const navigation = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/#services" },
  { label: "About", href: "/#about" },
  { label: "Reviews", href: "/#reviews" },
  { label: "Areas", href: "/#areas" },
  { label: "Contact", href: "/#contact" },
];

export default function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Hasmmat Cleaning Service home" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-3 text-xs font-medium text-slate-700 xl:gap-4 xl:text-sm lg:flex">
          {navigation.map((item) => (
            <Link key={item.label} href={item.href} className="transition hover:text-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rose-700">
              {item.label}
            </Link>
          ))}
        </nav>

        <Link href="/#contact" className="hidden shrink-0 rounded-full bg-rose-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rose-700 lg:inline-flex">
          Get a Free Quote
        </Link>

        <details className="public-mobile-nav group relative lg:hidden">
          <summary className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-full border border-slate-300 text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700">
            <span className="sr-only">Navigation menu</span>
            <Menu aria-hidden="true" className="group-open:hidden" size={21} />
            <X aria-hidden="true" className="hidden group-open:block" size={21} />
          </summary>
          <nav id="public-mobile-navigation" aria-label="Mobile navigation" className="absolute right-0 top-full z-50 mt-2 flex w-[min(20rem,calc(100vw-2rem))] flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
            {navigation.map((item) => (
              <Link key={item.label} href={item.href} className="rounded-xl px-3 py-3 text-sm font-medium text-slate-800 transition hover:bg-rose-50 hover:text-rose-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-700">
                {item.label}
              </Link>
            ))}
            <Link href="/#contact" className="mt-1 rounded-full bg-rose-800 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700">
              Get a Free Quote
            </Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
