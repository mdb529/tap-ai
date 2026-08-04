/**
 * Static export. The whole point of this project is portability: `npm run build`
 * emits a plain `out/` directory of HTML, CSS and JS that will run on GitHub
 * Pages, Vercel, Netlify, S3, or a USB stick. No server, no database, no
 * environment variables required.
 *
 * BASE_PATH exists because GitHub Pages serves project sites from a subpath
 * (/repo-name). Set it in CI; leave it empty for Vercel or a custom domain.
 */
const basePath = process.env.BASE_PATH ?? "";

// This project sits inside a repo that has its own lockfile at the root (the
// MVP). Without this, Next walks up, finds ../package-lock.json, and infers the
// PARENT directory as the workspace root -- which means it traces files from the
// MVP into this build. Harmless for a static export, but it is the wrong root and
// it emits a warning on every build.
const here = new URL(".", import.meta.url).pathname;

/** @type {import('next').NextConfig} */
export default {
  output: "export",
  outputFileTracingRoot: here,
  basePath,
  // Exposed so src/lib/href.ts can prefix plain <a href> values. Next rewrites
  // <Link> automatically but not raw anchors, and this site uses anchors so it
  // stays a pure static export.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
};
