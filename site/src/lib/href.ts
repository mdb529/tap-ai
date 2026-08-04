/**
 * basePath-aware href.
 *
 * GitHub Pages serves this site from /tap-ai, Vercel from /. Next rewrites
 * <Link> hrefs automatically but does nothing for a plain <a href>, so a
 * hand-written "/how-it-works/" 404s on Pages. Everything internal goes through
 * here instead.
 *
 * NEXT_PUBLIC_BASE_PATH is inlined at build time, which is why it works in a
 * static export with no runtime.
 */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const href = (path: string): string =>
  path.startsWith("/") ? `${BASE}${path}` : path;
