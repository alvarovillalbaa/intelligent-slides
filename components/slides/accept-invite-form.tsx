"use client"

import { useActionState } from "react"

import { acceptInviteAction, type AuthFormState } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

const initialState: AuthFormState = {}

export function AcceptInviteForm({
  token,
  email,
  teamName,
  workspaceName,
  invitedName,
}: {
  token: string
  email: string
  teamName: string
  workspaceName: string
  invitedName: string
}) {
  const [state, formAction, pending] = useActionState(acceptInviteAction, initialState)

  return (
    <Card className="border border-[#102114]/10 bg-white/92 shadow-[0_30px_120px_rgba(15,23,42,0.08)]">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">Join {teamName}</CardTitle>
        <CardDescription>
          You were invited to the <span className="font-medium text-foreground">{workspaceName}</span> workspace as{" "}
          <span className="font-medium text-foreground">{email}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="token" value={token} />
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground" htmlFor="invite-name">
              Name
            </label>
            <Input id="invite-name" name="name" defaultValue={invitedName} placeholder="Taylor Brooks" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground" htmlFor="invite-password">
              Password
            </label>
            <Input id="invite-password" name="password" type="password" placeholder="Create a password" />
          </div>
          {state.error ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {state.error}
            </p>
          ) : null}
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "Joining..." : "Accept invite and enter Slides"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
