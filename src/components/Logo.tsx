export default function Logo() {
  return (
    <div className="inline-flex items-center gap-3">
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-white">
        <img src="/images/logo.jpg" alt="HASMMAT logo" className="h-full w-full object-cover" />
      </div>
      <div className="text-left">
        <p className="text-sm font-semibold uppercase text-slate-900">Hasmmat</p>
        <p className="text-[10px] uppercase text-slate-600">Cleaning Service Ltd</p>
      </div>
    </div>
  );
}
