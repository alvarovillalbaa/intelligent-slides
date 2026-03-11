import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

type ConvexEntity = {
  _id: string
  [key: string]: unknown
}

type ConvexGetContext = {
  db: {
    get(id: string): Promise<ConvexEntity | null>
  }
}

async function getTeam(ctx: ConvexGetContext, teamId: string) {
  return await ctx.db.get(teamId as never)
}

async function getWorkspace(ctx: ConvexGetContext, workspaceId: string) {
  return await ctx.db.get(workspaceId as never)
}

async function getDeck(ctx: ConvexGetContext, deckId: string) {
  return await ctx.db.get(deckId as never)
}

function buildAnalytics(events: Array<Record<string, unknown>>, leads: Array<Record<string, unknown>>) {
  const viewVisitorIds = new Set<string>()
  const completionVisitorIds = new Set<string>()
  const sessionDurations: number[] = []
  const slideViews: Record<string, number> = {}
  const pollVotes: Record<string, number> = {}
  const variantVisitorIds = new Map<string, Set<string>>()
  const variantCompletionIds = new Map<string, Set<string>>()
  const variantDurations = new Map<string, number[]>()
  const variantMetrics = new Map<
    string,
    {
      views: number
      ctaClicks: number
      leads: number
      pollVotes: number
      completions: number
    }
  >()

  for (const event of events) {
    const type = String(event.type ?? "")
    const visitorId = String(event.visitorId ?? "")
    const versionId = typeof event.versionId === "string" ? event.versionId : null
    if (type === "view" && visitorId) {
      viewVisitorIds.add(visitorId)
    }
    if (type === "deck_complete" && visitorId) {
      completionVisitorIds.add(visitorId)
    }
    if (type === "session_end" && typeof event.durationMs === "number") {
      sessionDurations.push(event.durationMs)
    }
    if (type === "slide_view" && typeof event.slideId === "string") {
      slideViews[event.slideId] = (slideViews[event.slideId] ?? 0) + 1
    }
    if (type === "poll_vote" && typeof event.value === "string") {
      pollVotes[event.value] = (pollVotes[event.value] ?? 0) + 1
    }

    if (!versionId) {
      continue
    }

    const nextMetrics = variantMetrics.get(versionId) ?? {
      views: 0,
      ctaClicks: 0,
      leads: 0,
      pollVotes: 0,
      completions: 0,
    }

    if (type === "view") {
      nextMetrics.views += 1
      if (visitorId) {
        if (!variantVisitorIds.has(versionId)) {
          variantVisitorIds.set(versionId, new Set())
        }
        variantVisitorIds.get(versionId)!.add(visitorId)
      }
    }
    if (type === "cta_click") {
      nextMetrics.ctaClicks += 1
    }
    if (type === "poll_vote") {
      nextMetrics.pollVotes += 1
    }
    if (type === "deck_complete") {
      nextMetrics.completions += 1
      if (visitorId) {
        if (!variantCompletionIds.has(versionId)) {
          variantCompletionIds.set(versionId, new Set())
        }
        variantCompletionIds.get(versionId)!.add(visitorId)
      }
    }
    if (type === "session_end" && typeof event.durationMs === "number") {
      if (!variantDurations.has(versionId)) {
        variantDurations.set(versionId, [])
      }
      variantDurations.get(versionId)!.push(event.durationMs)
    }

    variantMetrics.set(versionId, nextMetrics)
  }

  for (const lead of leads) {
    const versionId = typeof lead.versionId === "string" ? lead.versionId : null
    if (!versionId) {
      continue
    }
    const nextMetrics = variantMetrics.get(versionId) ?? {
      views: 0,
      ctaClicks: 0,
      pollVotes: 0,
      completions: 0,
      leads: 0,
    }
    nextMetrics.leads += 1
    variantMetrics.set(versionId, nextMetrics)
  }

  return {
    views: events.filter((event) => event.type === "view").length,
    uniqueVisitors: viewVisitorIds.size,
    completionRate: viewVisitorIds.size ? Math.round((completionVisitorIds.size / viewVisitorIds.size) * 100) : 0,
    avgTimeSeconds: sessionDurations.length
      ? Math.round(sessionDurations.reduce((sum, value) => sum + value, 0) / sessionDurations.length / 1000)
      : 0,
    ctaClicks: events.filter((event) => event.type === "cta_click").length,
    leads: leads.length,
    slideViews,
    pollVotes,
    variantMetrics: Object.fromEntries(
      Array.from(variantMetrics.entries()).map(([versionId, metrics]) => [
        versionId,
        {
          ...metrics,
          uniqueVisitors: variantVisitorIds.get(versionId)?.size ?? 0,
          completions: variantCompletionIds.get(versionId)?.size ?? metrics.completions,
          avgTimeSeconds: (() => {
            const durations = variantDurations.get(versionId) ?? []
            return durations.length
              ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length / 1000)
              : 0
          })(),
        },
      ]),
    ),
  }
}

async function getTeamWorkspaces(ctx: ConvexGetContext & {
  db: ConvexGetContext["db"] & {
    query(table: "workspaces" | "decks"): {
      collect(): Promise<ConvexEntity[]>
    }
  }
}, teamId: string) {
  const [workspaces, decks] = await Promise.all([
    ctx.db.query("workspaces").collect(),
    ctx.db.query("decks").collect(),
  ])

  return workspaces
    .filter((workspace) => String(workspace.teamId) === teamId)
    .map((workspace) => ({
      ...workspace,
      id: String(workspace._id),
      decks: decks
        .filter((deck) => String(deck.workspaceId) === String(workspace._id))
        .map((deck) => ({
          ...deck,
          id: String(deck._id),
        })),
    }))
}

async function getTeamInvites(ctx: ConvexGetContext & {
  db: ConvexGetContext["db"] & {
    query(table: "invites"): {
      collect(): Promise<ConvexEntity[]>
    }
  }
}, teamId: string) {
  const invites = await ctx.db.query("invites").collect()
  return invites
    .filter((invite) => String(invite.teamId) === teamId)
    .map((invite) => ({
      ...invite,
      id: String(invite._id),
    }))
}

export const getDashboard = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId as never)

    if (!user) {
      return null
    }

    const team = await getTeam(ctx, String(user.teamId))
    const workspace = await getWorkspace(ctx, String(user.workspaceId))
    const workspaces = await getTeamWorkspaces(ctx, String(user.teamId))
    const invites = await getTeamInvites(ctx, String(user.teamId))

    const decks = (await ctx.db.query("decks").collect()).filter(
      (deck) => String(deck.workspaceId) === String(user.workspaceId),
    )

    return {
      sessionUser: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        teamId: String(user.teamId),
        teamName: team?.name,
        teamSlug: team?.slug,
        workspaceId: String(user.workspaceId),
        workspaceSlug: workspace?.slug,
      },
      team: team && {
        id: String(team._id),
        slug: team.slug,
        name: team.name,
        brand: team.brand,
        members: team.members,
        invites,
      },
      workspaces,
      workspace: workspace && {
        id: String(workspace._id),
        teamId: String(workspace.teamId),
        slug: workspace.slug,
        name: workspace.name,
        description: workspace.description,
      },
      decks: decks.map((deck) => ({
        ...deck,
        id: String(deck._id),
      })),
    }
  },
})

export const getDeckEditor = query({
  args: {
    userId: v.string(),
    deckId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId as never)
    const deck = await getDeck(ctx, args.deckId)

    if (!user || !deck || String(deck.teamId) !== String(user.teamId)) {
      return null
    }

    const team = await getTeam(ctx, String(deck.teamId))
    const workspace = await getWorkspace(ctx, String(deck.workspaceId))
    const workspaces = await getTeamWorkspaces(ctx, String(deck.teamId))
    const invites = await getTeamInvites(ctx, String(deck.teamId))

    return {
      deck: {
        ...deck,
        id: String(deck._id),
      },
      team: team && {
        id: String(team._id),
        slug: team.slug,
        name: team.name,
        brand: team.brand,
        members: team.members,
        invites,
        workspaces,
      },
      workspace: workspace && {
        id: String(workspace._id),
        teamId: String(workspace.teamId),
        slug: workspace.slug,
        name: workspace.name,
        description: workspace.description,
      },
    }
  },
})

export const getPublicDeck = query({
  args: {
    teamSlug: v.string(),
    deckSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const team = (await ctx.db.query("teams").collect()).find((item) => item.slug === args.teamSlug)

    if (!team) {
      return null
    }

    const deck = (await ctx.db.query("decks").collect()).find(
      (item) => String(item.teamId) === String(team._id) && item.slug === args.deckSlug,
    )

    if (!deck || deck.status !== "published" || !deck.publishedVersionId) {
      return null
    }

    return {
      team: {
        id: String(team._id),
        slug: team.slug,
        name: team.name,
        brand: team.brand,
        members: team.members,
        invites: [],
      },
      deck: {
        ...deck,
        id: String(deck._id),
      },
    }
  },
})

export const getPublicDeckById = query({
  args: {
    publicId: v.string(),
  },
  handler: async (ctx, args) => {
    const deck = (await ctx.db.query("decks").collect()).find(
      (item) => item.publicId === args.publicId,
    )

    if (!deck || deck.status !== "published" || !deck.publishedVersionId) {
      return null
    }

    const team = await getTeam(ctx, String(deck.teamId))
    if (!team) {
      return null
    }

    return {
      team: {
        id: String(team._id),
        slug: team.slug,
        name: team.name,
        brand: team.brand,
        members: team.members,
        invites: [],
      },
      deck: {
        ...deck,
        id: String(deck._id),
      },
    }
  },
})

export const createDeck = mutation({
  args: {
    deck: v.any(),
  },
  handler: async (ctx, args) => {
    const deckId = await ctx.db.insert("decks", args.deck)
    return {
      ...args.deck,
      id: String(deckId),
    }
  },
})

export const createWorkspace = mutation({
  args: {
    workspace: v.any(),
  },
  handler: async (ctx, args) => {
    const workspaceId = await ctx.db.insert("workspaces", args.workspace)
    return {
      ...args.workspace,
      id: String(workspaceId),
      decks: [],
    }
  },
})

export const patchDeck = mutation({
  args: {
    deckId: v.string(),
    patch: v.any(),
  },
  handler: async (ctx, args) => {
    const deck = await getDeck(ctx, args.deckId)

    if (!deck) {
      throw new Error("Deck not found")
    }

    await ctx.db.patch(deck._id as never, args.patch)
    return {
      ...deck,
      ...args.patch,
      id: String(deck._id),
    }
  },
})

export const getReviewByToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const decks = await ctx.db.query("decks").collect()
    const deck = decks.find((item) =>
      (item.reviewRequests ?? []).some((review: { token: string }) => review.token === args.token),
    )

    if (!deck) {
      return null
    }

    const review = (deck.reviewRequests ?? []).find((item: { token: string }) => item.token === args.token)
    const version = (deck.versions ?? []).find((item: { id: string }) => item.id === review?.versionId)
    const team = await getTeam(ctx, String(deck.teamId))

    if (!review || !version || !team) {
      return null
    }

    return {
      team: {
        id: String(team._id),
        slug: team.slug,
        name: team.name,
        brand: team.brand,
        members: team.members,
        invites: [],
      },
      deck: {
        ...deck,
        id: String(deck._id),
      },
      review,
      version,
    }
  },
})

export const getTeamById = query({
  args: {
    teamId: v.string(),
  },
  handler: async (ctx, args) => {
    const team = await getTeam(ctx, args.teamId)
    if (!team) {
      return null
    }

    return {
      id: String(team._id),
      slug: team.slug,
      name: team.name,
      brand: team.brand,
      members: team.members,
      invites: await getTeamInvites(ctx, args.teamId),
      workspaces: await getTeamWorkspaces(ctx, args.teamId),
    }
  },
})

export const getWorkspaceById = query({
  args: {
    workspaceId: v.string(),
  },
  handler: async (ctx, args) => {
    const workspace = await getWorkspace(ctx, args.workspaceId)
    if (!workspace) {
      return null
    }

    const decks = (await ctx.db.query("decks").collect())
      .filter((deck) => String(deck.workspaceId) === String(workspace._id))
      .map((deck) => ({
        ...deck,
        id: String(deck._id),
      }))

    return {
      id: String(workspace._id),
      teamId: String(workspace.teamId),
      slug: workspace.slug,
      name: workspace.name,
      description: workspace.description,
      decks,
    }
  },
})

export const recordDeckEvent = mutation({
  args: {
    event: v.any(),
  },
  handler: async (ctx, args) => {
    const eventId = await ctx.db.insert("events", args.event)
    const deck = args.event.deckId
      ? await getDeck(ctx, String(args.event.deckId))
      : (await ctx.db.query("decks").collect()).find((item) => item.publicId === args.event.publicId)

    if (deck) {
      const allEvents = (await ctx.db.query("events").collect()).filter(
        (item) => item.publicId === deck.publicId,
      )
      const leads = (await ctx.db.query("leads").collect()).filter(
        (item) => item.publicId === deck.publicId,
      )
      await ctx.db.patch(deck._id as never, {
        analytics: buildAnalytics(
          allEvents.map((item) => ({ ...item, id: String(item._id) })),
          leads.map((item) => ({ ...item, id: String(item._id) })),
        ),
      })
    }

    return {
      ...args.event,
      id: String(eventId),
    }
  },
})

export const captureLead = mutation({
  args: {
    lead: v.any(),
  },
  handler: async (ctx, args) => {
    const leadId = await ctx.db.insert("leads", args.lead)
    const deck = args.lead.deckId
      ? await getDeck(ctx, String(args.lead.deckId))
      : (await ctx.db.query("decks").collect()).find((item) => item.publicId === args.lead.publicId)

    if (deck) {
      const allEvents = (await ctx.db.query("events").collect()).filter(
        (item) => item.publicId === deck.publicId,
      )
      const leads = (await ctx.db.query("leads").collect()).filter(
        (item) => item.publicId === deck.publicId,
      )
      await ctx.db.patch(deck._id as never, {
        analytics: buildAnalytics(
          allEvents.map((item) => ({ ...item, id: String(item._id) })),
          leads.map((item) => ({ ...item, id: String(item._id) })),
        ),
      })
    }

    return {
      ...args.lead,
      id: String(leadId),
    }
  },
})
