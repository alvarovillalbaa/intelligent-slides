import Link from "next/link"
import { notFound } from "next/navigation"

import { createWorkspaceAction, updateTeamMemberRoleAction } from "@/app/actions/decks"
import { CreateDeckFlow } from "@/components/slides/create-deck-flow"
import { TeamInviteForm } from "@/components/slides/team-invite-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { repository } from "@/lib/repository"
import { requireSessionUser } from "@/lib/server-auth"
import type { DeckRecord } from "@/lib/types"
import { formatRelativeDate } from "@/lib/utils"

const deckSections = [
  {
    key: "published",
    title: "Published surfaces",
    description: "Decks currently routed live with share links, embeds, and analytics.",
    filter: (deck: DeckRecord) => deck.status === "published",
  },
  {
    key: "review",
    title: "Needs review follow-up",
    description: "Drafts with open change requests or unresolved review threads.",
    filter: (deck: DeckRecord) =>
      deck.reviewRequests.some((review) => review.status === "open" || review.status === "changes_requested"),
  },
  {
    key: "archive",
    title: "Stable library",
    description: "Everything else in this workspace, including drafts ready for the next publish cycle.",
    filter: (deck: DeckRecord) =>
      deck.status !== "published" &&
      !deck.reviewRequests.some((review) => review.status === "open" || review.status === "changes_requested"),
  },
]

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>
}) {
  const { workspaceSlug } = await params
  const sessionUser = await requireSessionUser()
  const dashboard = await repository.getWorkspaceBySlug(sessionUser.id, workspaceSlug)

  if (!dashboard) {
    notFound()
  }

  const canManageWorkspaces = sessionUser.role === "admin"
  const otherWorkspaces = dashboard.team.workspaces.filter((workspace) => workspace.id !== dashboard.workspace.id)

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Workspace</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-foreground">
            {dashboard.workspace.name}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
            {dashboard.workspace.description}
          </p>
        </div>
        <Card className="border border-foreground/8 bg-white/90">
          <CardHeader>
            <CardTitle>Workspace controls</CardTitle>
            <CardDescription>Organize decks, route reviews, and keep the team’s deck system intentionally segmented.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground">
            <p>{dashboard.team.members.length} team members connected</p>
            <p>{dashboard.team.workspaces.length} workspaces inside {dashboard.team.name}</p>
            <p>{dashboard.decks.filter((deck) => deck.status === "published").length} decks currently published</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border border-foreground/8 bg-white/92">
          <CardHeader>
            <CardTitle>Workspace map</CardTitle>
            <CardDescription>Move between focused deck streams instead of piling everything into one backlog.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="rounded-[24px] border border-foreground/8 bg-[#102114] p-5 text-white">
              <p className="text-xs uppercase tracking-[0.18em] text-white/48">Current workspace</p>
              <div className="mt-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold">{dashboard.workspace.name}</p>
                  <p className="mt-1 text-sm text-white/66">{dashboard.workspace.description}</p>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.16em]">
                  {dashboard.decks.length} decks
                </span>
              </div>
            </div>

            {otherWorkspaces.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {otherWorkspaces.map((workspace) => (
                  <Link
                    key={workspace.id}
                    href={`/app/workspaces/${workspace.slug}`}
                    className="rounded-[24px] border border-foreground/8 bg-muted/20 p-4 transition-colors hover:bg-muted/35"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-foreground">{workspace.name}</p>
                      <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        {workspace.decks.length} decks
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{workspace.description}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="rounded-[24px] border border-dashed border-foreground/12 bg-muted/20 px-4 py-4 text-sm text-muted-foreground">
                This team only has one workspace right now. Create a dedicated stream for launches, client decks, internal comms, or experiments.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border border-foreground/8 bg-white/92">
          <CardHeader>
            <CardTitle>Team roles</CardTitle>
            <CardDescription>Editors can change decks. Viewers can inspect and review. Admins also organize workspaces.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {dashboard.team.members.map((member) => (
              <div key={member.userId} className="rounded-[24px] border border-foreground/8 bg-muted/20 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{member.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{member.email}</p>
                  </div>
                  {canManageWorkspaces && member.userId !== sessionUser.id ? (
                    <form action={updateTeamMemberRoleAction} className="flex items-center gap-2">
                      <input type="hidden" name="targetUserId" value={member.userId} />
                      <select
                        name="role"
                        defaultValue={member.role}
                        className="h-10 rounded-full border border-foreground/10 bg-white px-3 text-xs uppercase tracking-[0.16em] text-muted-foreground outline-none"
                      >
                        <option value="admin">admin</option>
                        <option value="editor">editor</option>
                        <option value="viewer">viewer</option>
                      </select>
                      <Button type="submit" variant="outline">Save</Button>
                    </form>
                  ) : (
                    <span className="rounded-full border border-foreground/8 bg-white px-3 py-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      {member.role}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {canManageWorkspaces ? (
              <>
                <TeamInviteForm workspaceId={dashboard.workspace.id} />
                {dashboard.team.invites.length ? (
                  <div className="grid gap-3 rounded-[24px] border border-foreground/8 bg-muted/20 p-4">
                    <p className="text-sm font-medium text-foreground">Outstanding invites</p>
                    {dashboard.team.invites.map((invite) => (
                      <div key={invite.id} className="rounded-[20px] border border-foreground/8 bg-white px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">{invite.email}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                              {invite.role} · {invite.status}
                            </p>
                          </div>
                          <a href={`/join/${invite.token}`} className="text-sm text-primary underline">
                            Open invite
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
                <form action={createWorkspaceAction} className="grid gap-3 rounded-[24px] border border-dashed border-foreground/12 bg-muted/20 p-4">
                  <p className="text-sm font-medium text-foreground">Create workspace</p>
                  <input
                    name="name"
                    placeholder="Launch campaigns"
                    className="h-11 rounded-full border border-foreground/10 bg-white px-4 text-sm outline-none"
                  />
                  <textarea
                    name="description"
                    placeholder="Decks, variants, and review loops for product launches."
                    className="min-h-24 rounded-[20px] border border-foreground/10 bg-white px-4 py-3 text-sm outline-none"
                  />
                  <Button type="submit">Create workspace</Button>
                </form>
              </>
            ) : (
              <p className="rounded-[24px] border border-foreground/8 bg-muted/20 px-4 py-4 text-sm text-muted-foreground">
                Workspace creation is restricted to admins.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <CreateDeckFlow workspaceId={dashboard.workspace.id} workspaceSlug={dashboard.workspace.slug} />

      <section className="grid gap-4">
        {deckSections.map((section) => {
          const decks = dashboard.decks.filter(section.filter)
          if (!decks.length) {
            return null
          }

          return (
            <div key={section.key} className="grid gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">{section.title}</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">{section.description}</h2>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {decks.map((deck) => (
                  <DeckCard key={deck.id} deck={deck} teamSlug={dashboard.team.slug} workspaceSlug={dashboard.workspace.slug} />
                ))}
              </div>
            </div>
          )
        })}
      </section>
    </div>
  )
}

function DeckCard({
  deck,
  teamSlug,
  workspaceSlug,
}: {
  deck: DeckRecord
  teamSlug: string
  workspaceSlug: string
}) {
  const unresolvedComments = deck.reviewRequests.reduce(
    (sum, review) => sum + review.comments.filter((comment) => comment.status !== "resolved").length,
    0,
  )

  return (
    <Card className="border border-foreground/8 bg-white/92">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{deck.title}</CardTitle>
            <CardDescription>{deck.description}</CardDescription>
          </div>
          <span className="rounded-full border border-foreground/8 bg-muted/30 px-3 py-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
            {deck.status}
          </span>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <MetricCard label="Updated" value={formatRelativeDate(deck.updatedAt)} />
          <MetricCard label="Versions" value={String(deck.versions.length)} />
          <MetricCard label="Views" value={String(deck.analytics.views)} />
          <MetricCard label="Open review" value={String(unresolvedComments)} />
        </div>
        <div className="flex flex-wrap gap-3">
          <Button render={<Link href={`/app/workspaces/${workspaceSlug}/decks/${deck.id}`} />}>Open editor</Button>
          <Button render={<Link href={`/d/${teamSlug}/${deck.slug}`} />} variant="outline">
            View public deck
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-foreground/8 bg-muted/20 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}
