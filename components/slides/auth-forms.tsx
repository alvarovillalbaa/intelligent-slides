"use client"

import { useActionState } from "react"

import { signInAction, signUpAction, type AuthFormState } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

const initialState: AuthFormState = {}

export function AuthForms() {
  const [signInState, signInFormAction, signInPending] = useActionState(signInAction, initialState)
  const [signUpState, signUpFormAction, signUpPending] = useActionState(signUpAction, initialState)

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="border border-white/60 bg-white/85 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Start with the live demo workspace</CardTitle>
          <CardDescription>
            Demo credentials: <span className="font-medium text-foreground">morgan@northstarlabs.com</span> /{" "}
            <span className="font-medium text-foreground">demo1234</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signInFormAction} className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground" htmlFor="sign-in-email">
                Email
              </label>
              <Input id="sign-in-email" name="email" placeholder="morgan@northstarlabs.com" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground" htmlFor="sign-in-password">
                Password
              </label>
              <Input id="sign-in-password" name="password" type="password" placeholder="demo1234" />
            </div>
            {signInState.error ? (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {signInState.error}
              </p>
            ) : null}
            <Button type="submit" size="lg" disabled={signInPending}>
              {signInPending ? "Signing in..." : "Enter Slides"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border border-[#102114]/10 bg-[#102114] text-white shadow-[0_30px_120px_rgba(16,33,20,0.22)]">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-white">Create your own team</CardTitle>
          <CardDescription className="text-white/72">
            Self-host-friendly auth with team creation and a workspace ready for deck generation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signUpFormAction} className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-white" htmlFor="sign-up-name">
                Name
              </label>
              <Input
                id="sign-up-name"
                name="name"
                placeholder="Taylor Brooks"
                className="border-white/15 bg-white/8 text-white placeholder:text-white/40"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-white" htmlFor="sign-up-team">
                Team
              </label>
              <Input
                id="sign-up-team"
                name="teamName"
                placeholder="Acme Studio"
                className="border-white/15 bg-white/8 text-white placeholder:text-white/40"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-white" htmlFor="sign-up-email">
                Email
              </label>
              <Input
                id="sign-up-email"
                name="email"
                type="email"
                placeholder="you@company.com"
                className="border-white/15 bg-white/8 text-white placeholder:text-white/40"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-white" htmlFor="sign-up-password">
                Password
              </label>
              <Input
                id="sign-up-password"
                name="password"
                type="password"
                placeholder="At least 8 characters"
                className="border-white/15 bg-white/8 text-white placeholder:text-white/40"
              />
            </div>
            {signUpState.error ? (
              <p className="rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-sm text-white">
                {signUpState.error}
              </p>
            ) : null}
            <Button
              type="submit"
              size="lg"
              className="bg-white text-[#102114] hover:bg-white/90"
              disabled={signUpPending}
            >
              {signUpPending ? "Creating team..." : "Create team"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
