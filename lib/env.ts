export function hasConvexEnv() {
  return Boolean(process.env.NEXT_PUBLIC_CONVEX_URL)
}

export function hasConvexAdminEnv() {
  return Boolean(process.env.NEXT_PUBLIC_CONVEX_URL && process.env.CONVEX_ADMIN_KEY)
}

export function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.replace(/^/, "https://") ??
    "http://localhost:3000"
  )
}

export function getSessionCookieName() {
  return "slides_session"
}
