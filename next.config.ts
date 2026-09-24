import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    // Enables `forbidden()` so non-admins get a real 403 response.
    authInterrupts: true,
  },
}

export default nextConfig
