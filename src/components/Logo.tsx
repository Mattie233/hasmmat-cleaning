export default function Logo() {
  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div className="relative h-14 w-14 overflow-hidden rounded-3xl bg-white/0 shadow-lg">
        <img src="/images/logo.jpg" alt="HASMMAT logo" className="h-full w-full object-cover" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-900">HASMMAT</p>
        <p className="text-[10px] uppercase tracking-[0.28em] text-slate-600">Cleaning Service LTD</p>
      </div>
    </div>
  );
}
