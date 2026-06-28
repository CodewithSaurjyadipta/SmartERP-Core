'use client';

import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Branding Panel (left side) ──────────────────────── */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col items-center justify-center overflow-hidden bg-slate-950">
        {/* Blurred 3D background visual */}
        <div className="absolute inset-0 z-0 select-none pointer-events-none">
          <Image
            src="/portal-hero.png"
            alt="Dashboard Visual Background"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover opacity-25"
            priority
          />
          {/* Dark overlay gradients to ensure text readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/60 to-indigo-950/85" />
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-slate-950/40 to-slate-950/90" />
        </div>

        {/* Branding content */}
        <div className="relative z-10 flex flex-col items-center gap-8 px-12 text-center py-8 max-w-lg">
          {/* Clean Minimalist Logo */}
          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-white/10 bg-slate-950/95 p-4 shadow-2xl shadow-primary/10">
            <Image
              src="/logo.png"
              alt="SmartERP Logo"
              width={80}
              height={80}
              className="object-contain scale-125"
              priority
            />
          </div>

          {/* App name & Tagline */}
          <div className="space-y-3">
            <div className="inline-block bg-white/95 px-6 py-2.5 rounded-xl shadow-2xl border border-white/10 select-none">
              <h1 className="text-3xl font-normal tracking-tight text-slate-800 sm:text-4xl font-logo">
                Smart<span className="text-black font-logo">Erp</span>
              </h1>
            </div>
            <div className="mx-auto h-0.5 w-12 rounded-full bg-gradient-to-r from-primary to-indigo-500" />
            <p className="text-base font-light leading-relaxed text-slate-300">
              A high-end, keyboard-first cloud ERP system inspired by Tally. Complete with GST calculation, double-entry bookkeeping, and detailed financial statements.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {['GST Auto-Calculate', 'Multi-Company Seeding', 'Bookkeeping Vouchers', 'Analytical Reports'].map((feature) => (
              <span
                key={feature}
                className="rounded-full border border-white/5 bg-slate-900/80 px-3.5 py-1 text-[11px] font-medium tracking-wide text-slate-300 shadow-sm"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom attribution */}
        <div className="absolute bottom-8 text-xs font-light text-slate-500 tracking-wider z-10 font-logo">
          © {new Date().getFullYear()} Smart<span className="font-logo">Erp</span>. Seeding Double-Entry Integrity.
        </div>
      </div>

      {/* ── Form Panel (right side) ─────────────────────────── */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2 xl:w-[45%] bg-background">
        {/* Mobile branding (shown only on small screens) */}
        <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card p-2 shadow-md">
            <Image
              src="/logo.png"
              alt="SmartERP Logo"
              width={60}
              height={60}
              className="object-contain scale-125"
            />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-normal font-logo text-foreground select-none">
              Smart<span className="text-black dark:text-black font-logo">Erp</span>
            </h1>
            <p className="text-xs text-muted-foreground">
              Cloud ERP for Modern Businesses
            </p>
          </div>
        </div>

        <div className="w-full max-w-[420px]">
          {children}
        </div>
      </div>
    </div>
  );
}
