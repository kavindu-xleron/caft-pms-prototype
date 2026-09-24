import type { NextConfig } from "next"

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
]

const nextConfig: NextConfig = {
  experimental: {
    // Enables `forbidden()` so non-admins get a real 403 response.
    authInterrupts: true,
  },
  // These routes read fonts and the logo from disk at runtime, which file tracing cannot
  // see; include them explicitly so they ship with each function.
  outputFileTracingIncludes: {
    "/api/c/*/pdf": [
      "./src/assets/fonts/**/*.ttf",
      "./src/assets/caft-logo.png",
    ],
    "/c/*/opengraph-image*": [
      "./src/assets/fonts/**/*.ttf",
      "./src/assets/caft-logo.png",
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }]
  },
}

export default nextConfig
