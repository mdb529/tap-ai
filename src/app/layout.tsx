import type { Metadata, Viewport } from "next";
import { Shell } from "@/components/shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tap AI — MVP",
  description:
    "Tap AI turns the business context in your experts' heads into governed decisions your systems act on.",
};

/** No maximum-scale: capping zoom breaks accessibility for anyone who pinches. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen text-slate-900 antialiased">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
