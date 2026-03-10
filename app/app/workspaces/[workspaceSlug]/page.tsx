import Link from "next/link"
import { notFound } from "next/navigation"

import { CreateDeckFlow } from "@/components/slides/create-deck-flow"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { repository } from "@/lib/repository"
import { requireSessionUser } from "@/lib/server-auth"
import { formatRelativeDate } from "@/lib/utils"

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
            <CardDescription>Organize decks, run review loops, and publish variants from here.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground">
            <p>{dashboard.team.members.length} team members connected</p>
            <p>{dashboard.decks.length} decks inside this workspace</p>
            <p>{dashboard.decks.filter((deck) => deck.status === "published").length} decks currently published</p>
          </CardContent>
        </Card>
      </section>

      <CreateDeckFlow workspaceId={dashboard.workspace.id} workspaceSlug={dashboard.workspace.slug} />

      <section className="grid gap-4 lg:grid-cols-2">
        {dashboard.decks.map((deck) => (
          <Card key={deck.id} className="border border-foreground/8 bg-white/92">
            <CardHeader>
              <CardTitle>{deck.title}</CardTitle>
              <CardDescription>{deck.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[22px] border border-foreground/8 bg-muted/20 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Updated</p>
                  <p className="mt-2 text-sm font-medium">{formatRelativeDate(deck.updatedAt)}</p>
                </div>
                <div className="rounded-[22px] border border-foreground/8 bg-muted/20 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Versions</p>
                  <p className="mt-2 text-sm font-medium">{deck.versions.length}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <ButtonLink href={`/app/workspaces/${dashboard.workspace.slug}/decks/${deck.id}`}>Open editor</ButtonLink>
                <ButtonLink variant="outline" href={`/d/${dashboard.team.slug}/${deck.slug}`}>
                  View public deck
                </ButtonLink>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  )
}

function ButtonLink({
  href,
  children,
  variant = "default",
}: {
  href: string
  children: React.ReactNode
  variant?: "default" | "outline"
}) {
  return (
    <Button render={<Link href={href} />} variant={variant}>
      {children}
    </Button>
  )
}
