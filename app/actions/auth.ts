"use server"

import { redirect } from "next/navigation"

import {
  authenticateUser,
  clearSession,
  establishSession,
  registerUser,
} from "@/lib/server-auth"

export interface AuthFormState {
  error?: string
}

export async function signInAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")

  if (!email || !password) {
    return { error: "Email and password are required." }
  }

  const user = await authenticateUser(email, password)
  if (!user) {
    return { error: "Invalid credentials. Use demo account morgan@northstarlabs.com / demo1234 or create a new team." }
  }

  await establishSession(user.id)
  redirect("/app")
}

export async function signUpAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")
  const teamName = String(formData.get("teamName") ?? "").trim()

  if (!name || !email || !password || !teamName) {
    return { error: "Name, team name, email, and password are required." }
  }

  try {
    const user = await registerUser({ name, email, password, teamName })
    await establishSession(user.id)
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to create your account.",
    }
  }

  redirect("/app")
}

export async function signOutAction() {
  await clearSession()
  redirect("/")
}
