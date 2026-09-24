export {}

export type AppRole = "admin"

declare global {
  // Shape of the custom session token claim configured in the Clerk
  // dashboard: { "metadata": "{{user.public_metadata}}" }
  interface CustomJwtSessionClaims {
    metadata?: {
      role?: AppRole
    }
  }
}
