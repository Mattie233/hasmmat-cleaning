export default function Logo() {
  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div className="relative flex h-14 w-14 items-center justify-center rounded-3xl bg-rose-600 text-white shadow-lg shadow-rose-500/20">
        <svg viewBox="0 0 64 64" className="h-8 w-8" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M32 8C21 24 21 40 32 56C43 40 43 24 32 8Z" fill="currentColor" />
          <path d="M28 20C30.5 17.5 35.5 17.5 38 20C40.5 22.5 40.5 27.5 38 30C35.5 32.5 30.5 32.5 28 30C25.5 27.5 25.5 22.5 28 20Z" fill="white" />
        </svg>
        <div className="absolute -right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-rose-600 text-[10px] font-bold">
          S
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-900">HASMMAT</p>
        <p className="text-[10px] uppercase tracking-[0.28em] text-slate-600">Cleaning Service LTD</p>
      </div>
    </div>
  );
}
