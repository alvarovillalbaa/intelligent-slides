import { redirect } from "next/navigation"

import { CreateDeckFlow } from "@/components/slides/create-deck-flow"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { repository } from "@/lib/repository"
import { requireSessionUser } from "@/lib/server-auth"
import { formatRelativeDate } from "@/lib/utils"

export default async function DashboardPage() {
  const sessionUser = await requireSessionUser()
  const dashboard = await repository.getDashboard(sessionUser.id)

  if (!dashboard) {
    redirect("/auth")
  }

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Dashboard</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-foreground">
            Generate, edit, publish, and measure decks from one workspace.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
            Teams live at the top of the model. Workspaces organize decks. Every publish can become a password-protected, embeddable, and reviewable surface.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard label="Decks" value={String(dashboard.decks.length)} detail="Across this workspace" />
          <MetricCard
            label="Views"
            value={String(dashboard.decks.reduce((sum, deck) => sum + deck.analytics.views, 0))}
            detail="Across published decks"
          />
          <MetricCard
            label="Leads"
            value={String(dashboard.decks.reduce((sum, deck) => sum + deck.analytics.leads, 0))}
            detail="Captured inside decks"
          />
        </div>
      </section>

      <CreateDeckFlow workspaceId={dashboard.workspace.id} workspaceSlug={dashboard.workspace.slug} />

      <section className="grid gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Recent decks</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">Latest narrative surfaces</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {dashboard.decks.map((deck) => (
            <Card key={deck.id} className="border border-foreground/8 bg-white/90">
              <CardHeader>
                <CardTitle>{deck.title}</CardTitle>
                <CardDescription>{deck.description}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-[22px] border border-foreground/8 bg-muted/20 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Views</p>
                    <p className="mt-2 text-2xl font-semibold">{deck.analytics.views}</p>
                  </div>
                  <div className="rounded-[22px] border border-foreground/8 bg-muted/20 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Leads</p>
                    <p className="mt-2 text-2xl font-semibold">{deck.analytics.leads}</p>
                  </div>
                  <div className="rounded-[22px] border border-foreground/8 bg-muted/20 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Updated</p>
                    <p className="mt-2 text-sm font-medium">{formatRelativeDate(deck.updatedAt)}</p>
                  </div>
                </div>
                <a
                  href={`/app/workspaces/${dashboard.workspace.slug}/decks/${deck.id}`}
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Open editor
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <Card className="border border-foreground/8 bg-white/90">
      <CardContent className="p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <p className="mt-3 text-4xl font-semibold tracking-tight">{value}</p>
        <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}
