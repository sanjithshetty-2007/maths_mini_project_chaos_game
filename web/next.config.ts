import type { NextConfig } from "next";

// The browser only talks to Next.js, which forwards every /api/* request to
// the Python backend: on this computer that is api.py on port 8000, and on
// Vercel it is the Python function in api/index.py.
const PYTHON_API = process.env.PYTHON_API ?? "http://127.0.0.1:8000";
const ON_VERCEL = Boolean(process.env.VERCEL);

const nextConfig: NextConfig = {
  devIndicators: false,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: ON_VERCEL ? "/api/" : `${PYTHON_API}/api/:path*` }];
  },
};

export default nextConfig;
