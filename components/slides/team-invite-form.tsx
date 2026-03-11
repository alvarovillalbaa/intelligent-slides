"use client"

import { useActionState } from "react"

import { inviteTeamMemberAction } from "@/app/actions/decks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface InviteState {
  inviteUrl?: string
  error?: string
}

const initialState: InviteState = {}

export function TeamInviteForm({
  workspaceId,
}: {
  workspaceId: string
}) {
  const [state, formAction, pending] = useActionState<InviteState, FormData>(async (_, formData) => {
    try {
      return await inviteTeamMemberAction(formData)
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unable to create invite.",
      }
    }
  }, initialState)

  return (
    <form action={formAction} className="grid gap-3 rounded-[24px] border border-dashed border-foreground/12 bg-muted/20 p-4">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <p className="text-sm font-medium text-foreground">Invite teammate</p>
      <Input name="invitedName" placeholder="Taylor Brooks" />
      <Input name="email" type="email" placeholder="taylor@company.com" />
      <select
        name="role"
        defaultValue="viewer"
        className="h-11 rounded-full border border-foreground/10 bg-white px-4 text-sm outline-none"
      >
        <option value="admin">Admin</option>
        <option value="editor">Editor</option>
        <option value="viewer">Viewer</option>
      </select>
      {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}
      {state.inviteUrl ? (
        <p className="rounded-[18px] border border-foreground/8 bg-white px-3 py-3 text-sm text-foreground">
          Invite link: <a href={state.inviteUrl} className="underline">{state.inviteUrl}</a>
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating invite..." : "Create invite"}
      </Button>
    </form>
  )
}
