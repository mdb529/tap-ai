import type { Metadata, Viewport } from "next";
import { SiteNav } from "@/components/site-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tap AI — put your experts' knowledge to work",
  description:
    "Tap AI turns the business context in your experts' heads into governed decisions your systems act on. One question, answered in seconds, in the app they already use.",
  openGraph: {
    title: "Tap AI — put your experts' knowledge to work",
    description:
      "Lightweight, governed, active. One question, answered in seconds, in the app they already use.",
    type: "website",
  },
};

/** Mobile first. `maximum-scale` is deliberately absent — capping zoom breaks
 *  accessibility for anyone who needs to pinch. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#020617",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body id="top" className="min-h-screen bg-slate-950 text-slate-900 antialiased">
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
