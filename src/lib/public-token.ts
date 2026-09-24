/** 16 random bytes, base64url-encoded: 22 characters, 128 bits. */
export const PUBLIC_TOKEN_PATTERN = /^[A-Za-z0-9_-]{22}$/

export const isPublicToken = (token: string) => PUBLIC_TOKEN_PATTERN.test(token)

/** Safe to log: never log a full public token. */
export const tokenPrefix = (token: string) => token.slice(0, 6)

export const publicCertificatePath = (token: string) => `/c/${token}`
export const certificateQrPath = (token: string) => `/api/c/${token}/qr`
export const certificatePdfPath = (token: string) => `/api/c/${token}/pdf`
