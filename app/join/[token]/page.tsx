import { notFound } from "next/navigation"

import { AcceptInviteForm } from "@/components/slides/accept-invite-form"
import { repository } from "@/lib/repository"

export default async function JoinInvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const inviteView = await repository.getInviteByToken(token)

  if (!inviteView?.invite || !inviteView.team || !inviteView.workspace) {
    notFound()
  }

  if (inviteView.invite.status !== "pending") {
    return (
      <main className="grid min-h-screen place-items-center bg-[linear-gradient(180deg,_#fdf8f3_0%,_#f5f8ff_100%)] px-6 py-16">
        <div className="max-w-lg rounded-[32px] border border-foreground/8 bg-white/90 p-8 text-center shadow-[0_30px_120px_rgba(15,23,42,0.08)]">
          <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Invite</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">This invite is no longer active.</h1>
        </div>
      </main>
    )
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[linear-gradient(180deg,_#fdf8f3_0%,_#f5f8ff_100%)] px-6 py-16">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[32px] border border-foreground/8 bg-[#102114] p-8 text-white shadow-[0_30px_120px_rgba(16,33,20,0.18)]">
          <p className="text-sm uppercase tracking-[0.2em] text-white/54">Team invite</p>
          <h1 className="mt-4 text-5xl font-semibold tracking-[-0.05em]">
            Join {inviteView.team.name} and start shipping decks.
          </h1>
          <p className="mt-5 text-lg leading-8 text-white/72">
            You&apos;re joining as <span className="font-medium text-white">{inviteView.invite.role}</span> in the{" "}
            <span className="font-medium text-white">{inviteView.workspace.name}</span> workspace.
          </p>
        </section>

        <AcceptInviteForm
          token={inviteView.invite.token}
          email={inviteView.invite.email}
          teamName={inviteView.team.name}
          workspaceName={inviteView.workspace.name}
          invitedName={inviteView.invite.invitedName}
        />
      </div>
    </main>
  )
}
