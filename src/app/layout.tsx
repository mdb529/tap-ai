import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "TapIQ",
  description:
    "A lightweight, portable feedback layer that lets business stakeholders contribute subject-matter context into an organization's codebase.",
};

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/inbox", label: "Tap inbox" },
  { href: "/tap-types", label: "Tap types" },
  { href: "/analytics", label: "Analytics" },
  { href: "/billing", label: "Plan & pool" },
  { href: "/config", label: "Configuration" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen text-slate-900">
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-[1180px] items-center gap-6 px-6 py-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-teal-700 text-[13px] font-bold text-white">
                T
              </span>
              <span className="text-sm font-semibold tracking-tight">TapIQ</span>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                MVP
              </span>
            </Link>
            <nav className="flex flex-wrap gap-1">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="rounded px-2.5 py-1.5 text-[13px] text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
            <div className="ml-auto hidden items-center gap-2 text-xs text-slate-500 sm:flex">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
              simulated SSO · Hana Yusuf
            </div>
          </div>
        </div>
        <main className="mx-auto max-w-[1180px] px-6 py-8">{children}</main>
        <footer className="mx-auto max-w-[1180px] px-6 pb-10 pt-2 text-[11px] leading-relaxed text-slate-400">
          Local MVP. Org context is read from <code>org/</code>, tap types from{" "}
          <code>tap-types/</code>, activity from <code>db/tapiq.duckdb</code>. Slack, Okta, and
          Claude delivery are simulated -- see the tap inbox for the intended form factor.
        </footer>
      </body>
    </html>
  );
}
