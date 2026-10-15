import Link from "next/link";
import type { ReactNode } from "react";
import Logo from "@/components/Logo";

type AuthShellProps = {
  children: ReactNode;
  description: string;
  title: string;
};

export default function AuthShell({
  children,
  description,
  title,
}: AuthShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(190,24,93,0.14),_transparent_52%)] px-4 py-12 text-slate-900">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mx-auto mb-8 flex w-fit justify-center rounded-3xl focus:outline-none focus:ring-2 focus:ring-rose-700 focus:ring-offset-4"
          aria-label="Return to the Hasmmat Cleaning Service homepage"
        >
          <Logo />
        </Link>
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-30px_rgba(15,23,42,0.4)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-700">
            Secure staff access
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">{title}</h1>
          <p className="mt-3 leading-7 text-slate-600">{description}</p>
          <div className="mt-7">{children}</div>
        </section>
        <p className="mt-6 text-center text-xs leading-5 text-slate-500">
          Authorised Hasmmat Cleaning Service personnel only.
        </p>
      </div>
    </main>
  );
}
