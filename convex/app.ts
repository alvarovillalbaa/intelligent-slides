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
      },
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
    deckId: v.string(),
  },
  handler: async (ctx, args) => {
    const deck = await getDeck(ctx, args.deckId)

    if (!deck) {
      return null
    }

    const team = await getTeam(ctx, String(deck.teamId))
    const workspace = await getWorkspace(ctx, String(deck.workspaceId))

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

    if (!deck) {
      return null
    }

    return {
      team: {
        id: String(team._id),
        slug: team.slug,
        name: team.name,
        brand: team.brand,
        members: team.members,
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

    if (!deck) {
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

export const recordDeckEvent = mutation({
  args: {
    event: v.any(),
  },
  handler: async (ctx, args) => {
    const eventId = await ctx.db.insert("events", args.event)
    const deck = await getDeck(ctx, args.event.deckId)

    if (deck) {
      const analytics = (deck.analytics ?? {}) as {
        views?: number
        uniqueVisitors?: number
        ctaClicks?: number
        completionRate?: number
        avgTimeSeconds?: number
        leads?: number
        slideViews?: Record<string, number>
      }
      const slideViews = {
        ...(analytics.slideViews ?? {}),
      }

      if (args.event.type === "slide_view" && args.event.slideId) {
        slideViews[args.event.slideId] = (slideViews[args.event.slideId] ?? 0) + 1
      }

      await ctx.db.patch(deck._id as never, {
        analytics: {
          ...analytics,
          views: (analytics.views ?? 0) + (args.event.type === "view" ? 1 : 0),
          uniqueVisitors: Math.max(
            analytics.uniqueVisitors ?? 0,
            args.event.type === "view" ? 1 : analytics.uniqueVisitors ?? 0,
          ),
          ctaClicks: (analytics.ctaClicks ?? 0) + (args.event.type === "cta_click" ? 1 : 0),
          completionRate: Math.min(
            96,
            (analytics.completionRate ?? 42) +
              (args.event.type === "slide_view" ? 2 : 0),
          ),
          avgTimeSeconds: Math.min(
            480,
            (analytics.avgTimeSeconds ?? 120) + (args.event.type === "slide_view" ? 5 : 0),
          ),
          leads: analytics.leads ?? 0,
          slideViews,
        },
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
    const deck = await getDeck(ctx, args.lead.deckId)

    if (deck) {
      const analytics = (deck.analytics ?? {}) as {
        views?: number
        uniqueVisitors?: number
        ctaClicks?: number
        completionRate?: number
        avgTimeSeconds?: number
        leads?: number
        slideViews?: Record<string, number>
      }
      await ctx.db.patch(deck._id as never, {
        analytics: {
          ...analytics,
          views: analytics.views ?? 0,
          uniqueVisitors: analytics.uniqueVisitors ?? 0,
          completionRate: analytics.completionRate ?? 0,
          avgTimeSeconds: analytics.avgTimeSeconds ?? 0,
          ctaClicks: analytics.ctaClicks ?? 0,
          leads: (analytics.leads ?? 0) + 1,
          slideViews: analytics.slideViews ?? {},
        },
      })
    }

    return {
      ...args.lead,
      id: String(leadId),
    }
  },
})
