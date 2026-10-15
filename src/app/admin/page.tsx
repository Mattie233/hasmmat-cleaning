import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Admin Dashboard | Hasmmat Cleaning Service",
  robots: { index: false, follow: false },
};

export default async function AdminPlaceholderPage() {
  const { profile } = await requireAdmin();

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-700">
          <ShieldCheck aria-hidden="true" />
        </div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-rose-700">
          Phase 1 authorization check
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Admin Dashboard</h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">
          You are successfully signed in as {profile.full_name}.
        </p>
        <p className="mt-3 text-sm text-slate-500">
          Administrative operations will be added in later phases.
        </p>
      </section>
    </main>
  );
}
