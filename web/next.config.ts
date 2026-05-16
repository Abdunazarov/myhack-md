import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse / pdfjs-dist break when webpack bundles them; load at runtime on the server only.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  // Serve Vite UI from public/ on unmatched routes (production: npm run build && npm start).
  // API routes under /api/* are handled first by the App Router.
  async rewrites() {
    return {
      fallback: [
        {
          source: "/:path*",
          destination: "/index.html",
        },
      ],
    };
  },
};

export default nextConfig;
