"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * App chrome for the MVP.
 *
 * The marketing page moved to `site/`, so there is no longer a dark homepage to
 * invert for — one light chrome on every route.
 *
 * Mobile: the nav is a horizontally scrollable strip rather than a wrapping grid
 * or a hamburger. Seven short labels wrap to three lines on a phone and a
 * hamburger hides the current location; a scroll strip keeps the active item
 * visible and costs one line.
 */

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/inbox", label: "Tap inbox" },
  { href: "/tap-types", label: "Tap types" },
  { href: "/analytics", label: "Analytics" },
  { href: "/pricing", label: "Pricing" },
  { href: "/config", label: "Configuration" },
  { href: "/notes", label: "Design notes" },
];

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const active = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1180px] items-center gap-3 px-4 py-2.5 sm:gap-5 sm:px-6 sm:py-3">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-teal-600 text-[13px] font-bold text-white">
              T
            </span>
            <span className="text-sm font-semibold tracking-tight text-slate-900">Tap AI</span>
            <span className="hidden rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 sm:inline">
              MVP
            </span>
          </Link>

          {/* scroll strip on mobile, plain row from sm up */}
          <nav
            className="-mx-1 flex min-w-0 flex-1 gap-0.5 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Sections"
          >
            {NAV.map((n) => {
              const on = active(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={on ? "page" : undefined}
                  className={`shrink-0 whitespace-nowrap rounded px-2.5 py-1.5 text-[13px] transition-colors ${
                    on
                      ? "bg-slate-100 font-medium text-slate-900"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto hidden shrink-0 items-center gap-2 text-xs text-slate-500 lg:flex">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
            demo workspace
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 sm:py-8">{children}</main>

      <footer className="mx-auto max-w-[1180px] px-4 pb-10 pt-2 text-[11px] leading-relaxed text-slate-400 sm:px-6">
        Local MVP. Config from <code>org/</code>, <code>config/</code> and <code>tap-types/</code>;
        activity from <code>db/tap-ai.duckdb</code>. Slack, SSO and assistant delivery are
        simulated. The public site is a separate static project under <code>site/</code>.
      </footer>
    </>
  );
}
