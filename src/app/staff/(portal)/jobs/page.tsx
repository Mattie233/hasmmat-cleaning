import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { requireCleaner } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Cleaner Portal | Hasmmat Cleaning Service",
  robots: { index: false, follow: false },
};

export default async function StaffJobsPlaceholderPage() {
  const { profile } = await requireCleaner();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 aria-hidden="true" />
        </div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-rose-700">
          Phase 1 authentication check
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Cleaner Portal</h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">
          You are successfully signed in as {profile.full_name}.
        </p>
        <p className="mt-3 text-sm text-slate-500">
          Job management will be added in Phase 2.
        </p>
      </section>
    </main>
  );
}
