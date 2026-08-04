"use client";

import { useEffect, useState } from "react";
import { href } from "@/lib/href";

/**
 * Sticky site nav with a real mobile menu.
 *
 * A hamburger that toggles a panel rather than a row of links that wraps onto
 * three lines. The anchors are the sections of a single page, so there is no
 * routing to get wrong — which is also why this site can be a static export.
 */

/** In-page anchors, plus one real route. */
const LINKS: [string, string][] = [
  ["Walk through it", "/#flow"],
  ["Why it works", "/#values"],
  ["Alternatives", "/#alternatives"],
  ["Pricing", "/#pricing"],
  ["How it works", "/how-it-works/"],
];

export function SiteNav() {
  const [open, setOpen] = useState(false);

  // Close on hash change so tapping a link in the mobile panel dismisses it.
  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("hashchange", close);
    return () => window.removeEventListener("hashchange", close);
  }, []);

  // Lock scroll while the mobile panel is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-[1180px] items-center gap-4 px-5 py-3 sm:px-6">
        <a href={href("/")} className="flex shrink-0 items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-teal-600 text-sm font-bold text-white">
            T
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-white">Tap AI</span>
        </a>

        <nav className="ml-auto hidden items-center gap-0.5 lg:flex">
          {LINKS.map(([label, target]) => (
            <a
              key={target}
              href={href(target)}
              className="rounded-md px-2.5 py-1.5 text-[13px] text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              {label}
            </a>
          ))}
        </nav>

        <a
          href={href("/#cta")}
          className="ml-auto hidden shrink-0 rounded-lg bg-white/10 px-3.5 py-1.5 text-[13px] font-medium text-white ring-1 ring-inset ring-white/15 transition-colors hover:bg-white/15 sm:block lg:ml-3"
        >
          Get in touch
        </a>

        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-300 ring-1 ring-inset ring-white/15 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="animate-[fadeIn_.2s_ease-out] border-t border-white/10 bg-slate-950 lg:hidden">
          <nav className="mx-auto flex max-w-[1180px] flex-col px-5 py-2 sm:px-6">
            {LINKS.map(([label, target]) => (
              <a
                key={target}
                href={href(target)}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2.5 text-[14px] text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                {label}
              </a>
            ))}
            <a
              href={href("/#cta")}
              onClick={() => setOpen(false)}
              className="mt-2 mb-2 rounded-lg bg-white px-3 py-2.5 text-center text-[14px] font-semibold text-slate-900"
            >
              Get in touch
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
