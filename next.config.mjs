/** @type {import('next').NextConfig} */
const nextConfig = {
  // @duckdb/node-api is a native module. It must stay external to the server
  // bundle or Next will try to trace/bundle the .node binary and fail.
  serverExternalPackages: ["@duckdb/node-api"],
  // site/ is a separate, fully static Next project. Keep it out of this build.
  outputFileTracingExcludes: { "*": ["./site/**"] },
};
export default nextConfig;
