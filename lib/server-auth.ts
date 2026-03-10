import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { createLookupHash, createSessionToken, hashSecret, verifySecret } from "@/lib/auth"
import { getSessionCookieName } from "@/lib/env"
import { repository } from "@/lib/repository"

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14

export async function getSessionToken() {
  const cookieStore = await cookies()
  return cookieStore.get(getSessionCookieName())?.value ?? null
}

export async function getCurrentSessionUser() {
  const token = await getSessionToken()
  if (!token) {
    return null
  }

  return repository.getSessionUser(createLookupHash(token))
}

export async function requireSessionUser() {
  const sessionUser = await getCurrentSessionUser()
  if (!sessionUser) {
    redirect("/auth")
  }

  return sessionUser
}

export async function establishSession(userId: string) {
  const token = createSessionToken()
  const tokenHash = createLookupHash(token)
  const createdAt = Date.now()
  const expiresAt = createdAt + SESSION_TTL_MS

  await repository.createSession({
    userId,
    tokenHash,
    createdAt,
    expiresAt,
  })

  const cookieStore = await cookies()
  cookieStore.set(getSessionCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  })
}

export async function clearSession() {
  const token = await getSessionToken()
  if (token) {
    await repository.deleteSession(createLookupHash(token))
  }

  const cookieStore = await cookies()
  cookieStore.delete(getSessionCookieName())
}

export async function authenticateUser(email: string, password: string) {
  const user = await repository.getUserByEmail(email)
  if (!user || !verifySecret(password, user.passwordHash)) {
    return null
  }

  return user
}

export async function registerUser(input: {
  name: string
  email: string
  password: string
  teamName: string
}) {
  const existing = await repository.getUserByEmail(input.email)
  if (existing) {
    throw new Error("An account already exists for that email.")
  }

  return repository.createUser({
    ...input,
    passwordHash: hashSecret(input.password),
  })
}

export function hashDeckPassword(password: string) {
  return password ? hashSecret(password) : undefined
}

export function verifyDeckPassword(password: string, digest?: string) {
  if (!digest) {
    return true
  }

  return verifySecret(password, digest)
}
