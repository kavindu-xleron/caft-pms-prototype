import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    // Enables `forbidden()` so non-admins get a real 403 response.
    authInterrupts: true,
  },
  // The PDF route reads its fonts from disk at runtime, which file tracing
  // cannot see; include them explicitly so they ship with the function.
  outputFileTracingIncludes: {
    "/api/c/*/pdf": ["./src/assets/fonts/**/*.ttf"],
  },
}

export default nextConfig
