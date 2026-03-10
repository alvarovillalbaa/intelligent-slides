import { ConvexHttpClient } from "convex/browser"
import { nanoid } from "nanoid"

import { api } from "@/convex/_generated/api"
import { buildStandaloneDeckHtml, remixTheme } from "@/lib/deck-runtime"
import { demoStore } from "@/lib/demo-store"
import { hasConvexAdminEnv } from "@/lib/env"
import type {
  AnalyticsEvent,
  DashboardData,
  DeckRecord,
  GenerationInput,
  LeadRecord,
  PublicDeckView,
  ReviewRequest,
  ReviewView,
  SessionRecord,
  UserRecord,
} from "@/lib/types"
import { slugify } from "@/lib/utils"

type ConvexFunctionRef = unknown
type ConvexArgs = Record<string, unknown>
type UntypedConvexClient = ConvexHttpClient & {
  setAdminAuth(token: string): void
  query(fn: ConvexFunctionRef, args?: ConvexArgs): Promise<unknown>
  mutation(fn: ConvexFunctionRef, args?: ConvexArgs): Promise<unknown>
}

const convexApi = api as unknown as {
  auth: Record<string, ConvexFunctionRef>
  app: Record<string, ConvexFunctionRef>
}

function createConvexClient(): UntypedConvexClient {
  const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!) as UntypedConvexClient
  client.setAdminAuth(process.env.CONVEX_ADMIN_KEY!)
  return client
}

function getPublishedVersion(deck: DeckRecord) {
  return deck.versions.find((version) => version.id === deck.publishedVersionId) ?? deck.versions[0]
}

function normalizeDashboard(raw: unknown): DashboardData | null {
  const data = raw as {
    sessionUser?: DashboardData["sessionUser"]
    team?: DashboardData["team"]
    workspace?: DashboardData["workspace"]
    decks?: DashboardData["decks"]
  }

  if (!data?.sessionUser || !data.team || !data.workspace || !data.decks) {
    return null
  }

  return {
    sessionUser: data.sessionUser,
    team: {
      ...data.team,
      workspaces: [
        {
          ...data.workspace,
          decks: data.decks,
        },
      ],
    },
    workspace: {
      ...data.workspace,
      decks: data.decks,
    },
    decks: data.decks,
  }
}

function normalizePublicView(raw: unknown): PublicDeckView | null {
  const data = raw as {
    team?: PublicDeckView["team"]
    deck?: DeckRecord
  }

  if (!data?.team || !data.deck) {
    return null
  }

  const deck = data.deck
  const version = getPublishedVersion(deck)
  if (!version) {
    return null
  }

  return {
    team: {
      ...data.team,
      workspaces: [],
    },
    deck,
    version,
  }
}

async function getDeckFromConvex(deckId: string) {
  const client = createConvexClient()
  const data = (await client.query(convexApi.app.getDeckEditor, { deckId })) as {
    deck?: DeckRecord
  } | null
  return data?.deck ? (data.deck as DeckRecord) : null
}

export const repository = {
  async getUserByEmail(email: string) {
    if (!hasConvexAdminEnv()) {
      return demoStore.getUserByEmail(email)
    }

    const client = createConvexClient()
    const user = await client.query(convexApi.auth.getUserByEmail, { email })
    return (user as UserRecord | null) ?? null
  },

  async createUser(input: {
    name: string
    email: string
    passwordHash: string
    teamName: string
  }) {
    if (!hasConvexAdminEnv()) {
      return demoStore.createUser(input)
    }

    const client = createConvexClient()
    return (await client.mutation(convexApi.auth.createUserWithTeam, {
      ...input,
      teamSlug: slugify(input.teamName),
      workspaceSlug: "hq",
    })) as UserRecord
  },

  async createSession(input: Omit<SessionRecord, "id">) {
    if (!hasConvexAdminEnv()) {
      return demoStore.createSession({
        id: nanoid(12),
        ...input,
      })
    }

    const client = createConvexClient()
    return (await client.mutation(convexApi.auth.createSession, input)) as SessionRecord
  },

  async deleteSession(tokenHash: string) {
    if (!hasConvexAdminEnv()) {
      return demoStore.deleteSession(tokenHash)
    }

    const client = createConvexClient()
    return client.mutation(convexApi.auth.deleteSession, { tokenHash })
  },

  async getSessionUser(tokenHash: string) {
    if (!hasConvexAdminEnv()) {
      return demoStore.getSessionUser(tokenHash)
    }

    const client = createConvexClient()
    const session = (await client.query(convexApi.auth.getSessionByTokenHash, {
      tokenHash,
    })) as {
      userId: string
      expiresAt: number
    } | null
    if (!session || session.expiresAt < Date.now()) {
      return null
    }

    const dashboard = normalizeDashboard(
      await client.query(convexApi.app.getDashboard, { userId: session.userId }),
    )
    return dashboard?.sessionUser ?? null
  },

  async getDashboard(userId: string) {
    if (!hasConvexAdminEnv()) {
      return demoStore.getDashboard(userId)
    }

    const client = createConvexClient()
    return normalizeDashboard(await client.query(convexApi.app.getDashboard, { userId }))
  },

  async getWorkspaceBySlug(userId: string, workspaceSlug: string) {
    if (!hasConvexAdminEnv()) {
      return demoStore.getWorkspaceBySlug(userId, workspaceSlug)
    }

    const dashboard = await this.getDashboard(userId)
    if (!dashboard || dashboard.workspace.slug !== workspaceSlug) {
      return null
    }

    return dashboard
  },

  async getDeckEditor(userId: string, deckId: string) {
    if (!hasConvexAdminEnv()) {
      return demoStore.getDeckEditor(userId, deckId)
    }

    const client = createConvexClient()
    const sessionDashboard = await this.getDashboard(userId)
    const data = (await client.query(convexApi.app.getDeckEditor, { deckId })) as {
      deck?: DeckRecord
      team?: DashboardData["team"]
      workspace?: DashboardData["workspace"]
    } | null

    if (!data?.deck || !sessionDashboard) {
      return null
    }

    return {
      sessionUser: sessionDashboard.sessionUser,
      team: {
        ...data.team,
        workspaces: [data.workspace],
      },
      workspace: data.workspace,
      deck: data.deck as DeckRecord,
    }
  },

  async createDeckFromGeneration(userId: string, workspaceId: string, input: GenerationInput, source: DeckRecord["source"]) {
    if (!hasConvexAdminEnv()) {
      return demoStore.createDeckFromGeneration(userId, workspaceId, input, source)
    }

    const dashboard = await this.getDashboard(userId)
    if (!dashboard) {
      throw new Error("Unable to load dashboard")
    }

    const createdAt = Date.now()
    const deck: DeckRecord = {
      id: "",
      teamId: dashboard.team.id,
      workspaceId,
      publicId: nanoid(10),
      slug: slugify(source.title),
      title: source.title,
      description: source.summary,
      status: "preview",
      createdAt,
      updatedAt: createdAt,
      createdBy: userId,
      source,
      checkpoints: [
        {
          id: nanoid(10),
          title: "Initial generation",
          summary: source.summary,
          prompt: input.prompt,
          createdAt,
          source,
        },
      ],
      versions: [
        {
          id: nanoid(12),
          label: "Version A",
          createdAt,
          status: "published",
          source,
          artifactHtml: buildStandaloneDeckHtml(source, slugify(source.title)),
        },
      ],
      publishedVersionId: undefined,
      reviewRequests: [],
      analytics: {
        views: 0,
        uniqueVisitors: 0,
        completionRate: 0,
        avgTimeSeconds: 0,
        ctaClicks: 0,
        leads: 0,
        slideViews: {},
      },
      assets: input.files.map((file) => ({
        id: nanoid(8),
        kind: "document",
        title: file.name,
        description: "Uploaded generation context.",
        url: file.name,
      })),
      themeMode: input.themeMode,
      passwordProtected: false,
    }

    return (await createConvexClient().mutation(convexApi.app.createDeck, {
      deck: {
        ...deck,
        versions: deck.versions,
      },
    })) as DeckRecord
  },

  async saveCheckpoint(userId: string, deckId: string, source: DeckRecord["source"], prompt: string, title: string) {
    if (!hasConvexAdminEnv()) {
      return demoStore.saveCheckpoint(userId, deckId, source, prompt, title)
    }

    const deck = await getDeckFromConvex(deckId)
    if (!deck) {
      throw new Error("Deck not found")
    }

    const checkpoints = [
      {
        id: nanoid(10),
        title,
        summary: source.summary,
        prompt,
        createdAt: Date.now(),
        source,
      },
      ...(deck.checkpoints ?? []),
    ]

    await createConvexClient().mutation(convexApi.app.patchDeck, {
      deckId,
      patch: {
        source,
        title: source.title,
        description: source.summary,
        updatedAt: Date.now(),
        checkpoints,
      },
    })

    return this.getDeckEditor(userId, deckId)
  },

  async publishVersion(userId: string, deckId: string, source: DeckRecord["source"], label: string, passwordHash?: string) {
    if (!hasConvexAdminEnv()) {
      return demoStore.publishVersion(userId, deckId, source, label, passwordHash)
    }

    const deck = await getDeckFromConvex(deckId)
    if (!deck) {
      throw new Error("Deck not found")
    }

    const version = {
      id: nanoid(12),
      label,
      createdAt: Date.now(),
      status: "published" as const,
      source,
      artifactHtml: buildStandaloneDeckHtml(source, slugify(source.title)),
      passwordHash,
    }

    await createConvexClient().mutation(convexApi.app.patchDeck, {
      deckId,
      patch: {
        source,
        title: source.title,
        description: source.summary,
        updatedAt: Date.now(),
        status: "published",
        versions: [version, ...(deck.versions ?? [])],
        publishedVersionId: version.id,
        passwordProtected: Boolean(passwordHash),
        passwordHash,
      },
    })

    return version
  },

  async randomizeTheme(userId: string, deckId: string) {
    if (!hasConvexAdminEnv()) {
      return demoStore.randomizeTheme(userId, deckId)
    }

    const deck = await getDeckFromConvex(deckId)
    if (!deck) {
      throw new Error("Deck not found")
    }

    const source = {
      ...deck.source,
      theme: remixTheme(deck.source.theme, deck.source.brand),
    }

    await createConvexClient().mutation(convexApi.app.patchDeck, {
      deckId,
      patch: {
        source,
        updatedAt: Date.now(),
        themeMode: "remix",
      },
    })

    return source
  },

  async restoreCheckpoint(userId: string, deckId: string, checkpointId: string) {
    if (!hasConvexAdminEnv()) {
      return demoStore.restoreCheckpoint(userId, deckId, checkpointId)
    }

    const deck = await getDeckFromConvex(deckId)
    const checkpoint = deck?.checkpoints.find((item) => item.id === checkpointId)
    if (!deck || !checkpoint) {
      throw new Error("Checkpoint not found")
    }

    await createConvexClient().mutation(convexApi.app.patchDeck, {
      deckId,
      patch: {
        source: checkpoint.source,
        updatedAt: Date.now(),
      },
    })

    return this.getDeckEditor(userId, deckId)
  },

  async createReviewRequest(userId: string, deckId: string, versionId: string, title: string) {
    if (!hasConvexAdminEnv()) {
      return demoStore.createReviewRequest(userId, deckId, versionId, title)
    }

    const deck = await getDeckFromConvex(deckId)
    if (!deck) {
      throw new Error("Deck not found")
    }

    const review: ReviewRequest = {
      id: nanoid(10),
      token: nanoid(18),
      title,
      createdAt: Date.now(),
      status: "open",
      versionId,
      comments: [],
    }

    await createConvexClient().mutation(convexApi.app.patchDeck, {
      deckId,
      patch: {
        reviewRequests: [review, ...(deck.reviewRequests ?? [])],
        updatedAt: Date.now(),
      },
    })

    return review
  },

  async addReviewComment(token: string, input: { authorName: string; body: string; slideId?: string }) {
    if (!hasConvexAdminEnv()) {
      return demoStore.addReviewComment(token, input)
    }

    const reviewView = await this.getReviewView(token)
    if (!reviewView) {
      throw new Error("Review not found")
    }

    const comments = [
      {
        id: nanoid(10),
        authorName: input.authorName,
        body: input.body,
        createdAt: Date.now(),
        slideId: input.slideId,
        status: "comment" as const,
      },
      ...reviewView.review.comments,
    ]

    const reviewRequests = reviewView.deck.reviewRequests.map((review) =>
      review.token === token
        ? {
            ...review,
            comments,
            status: "changes_requested",
          }
        : review,
    )

    await createConvexClient().mutation(convexApi.app.patchDeck, {
      deckId: reviewView.deck.id,
      patch: {
        reviewRequests,
        updatedAt: Date.now(),
      },
    })

    return comments[0]
  },

  async getPublicDeck(teamSlug: string, deckSlug: string) {
    if (!hasConvexAdminEnv()) {
      return demoStore.getPublicDeck(teamSlug, deckSlug)
    }

    return normalizePublicView(
      await createConvexClient().query(convexApi.app.getPublicDeck, {
        teamSlug,
        deckSlug,
      }),
    )
  },

  async getPublicDeckById(publicId: string) {
    if (!hasConvexAdminEnv()) {
      return demoStore.getPublicDeckById(publicId)
    }

    return normalizePublicView(
      await createConvexClient().query(convexApi.app.getPublicDeckById, { publicId }),
    )
  },

  async getReviewView(token: string): Promise<ReviewView | null> {
    if (!hasConvexAdminEnv()) {
      return demoStore.getReviewView(token)
    }

    const raw = (await createConvexClient().query(convexApi.app.getReviewByToken, {
      token,
    })) as {
      team?: ReviewView["team"]
      deck?: ReviewView["deck"]
      review?: ReviewView["review"]
      version?: ReviewView["version"]
    } | null
    if (!raw?.team || !raw?.deck || !raw?.review || !raw?.version) {
      return null
    }

    return {
      team: {
        ...raw.team,
        workspaces: [],
      },
      deck: raw.deck,
      review: raw.review,
      version: raw.version,
    }
  },

  async recordEvent(event: AnalyticsEvent) {
    if (!hasConvexAdminEnv()) {
      return demoStore.recordEvent(event)
    }

    return createConvexClient().mutation(convexApi.app.recordDeckEvent, { event })
  },

  async captureLead(lead: LeadRecord) {
    if (!hasConvexAdminEnv()) {
      return demoStore.captureLead(lead)
    }

    return createConvexClient().mutation(convexApi.app.captureLead, { lead })
  },
}
