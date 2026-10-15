import Link from "next/link";
import Logo from "@/components/Logo";
import { signOutAction } from "@/lib/auth/actions";

export default function PortalHeader({
  areaLabel,
  userName,
}: {
  areaLabel: string;
  userName: string;
}) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0" aria-label="Hasmmat homepage">
          <Logo />
        </Link>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-700">
              {areaLabel}
            </p>
            <p className="mt-1 text-sm text-slate-600">{userName}</p>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="min-h-11 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-rose-400 hover:text-rose-700"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
