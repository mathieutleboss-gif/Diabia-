import type { NextConfig } from "next";

const estHorsProduction = process.env.NODE_ENV !== "production";
const contentSecurityPolicy = "default-src 'self'; worker-src 'self' blob:; base-uri 'self'; connect-src 'self'; font-src 'self' data:; form-action 'self'; frame-ancestors 'none'; img-src 'self' data: blob:; object-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'";

const siteExport = process.env.DIABIA_SITE_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(siteExport ? { output: "export" as const, trailingSlash: true, images: { unoptimized: true } } : {}),
  async redirects() {
    if (siteExport) return [];
    return [{ source: "/glycemie", destination: "/add-measure", permanent: true }];
  },
  async headers() {
    if (siteExport) return [];
    return [
      {
        source: "/(.*)",
        headers: [
          ...(!estHorsProduction
            ? [{ key: "Content-Security-Policy", value: contentSecurityPolicy }]
            : []),
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
