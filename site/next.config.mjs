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

/** @type {import('next').NextConfig} */
export default {
  output: "export",
  basePath,
  // Exposed so src/lib/href.ts can prefix plain <a href> values. Next rewrites
  // <Link> automatically but not raw anchors, and this site uses anchors so it
  // stays a pure static export.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
};
