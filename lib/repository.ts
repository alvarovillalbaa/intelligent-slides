import { ConvexHttpClient } from "convex/browser"
import { nanoid } from "nanoid"

import { api } from "@/convex/_generated/api"
import { buildInitialDeckAssets, buildStoredInputAssets, type StoredInputAsset } from "@/lib/deck-assets"
import { buildStandaloneDeckHtml, remixTheme } from "@/lib/deck-runtime"
import { demoStore } from "@/lib/demo-store"
import { hasConvexAdminEnv } from "@/lib/env"
import { writePublishedArtifact, writeStoredText } from "@/lib/storage"
import type {
  AnalyticsEvent,
  AssetRecord,
  DashboardData,
  DeckExperiment,
  DeckRecord,
  GenerationInput,
  LeadRecord,
  PublicDeckView,
  ReviewRequest,
  ReviewView,
  SessionRecord,
  TeamInviteRecord,
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

function createEmptyAnalytics(): DeckRecord["analytics"] {
  return {
    views: 0,
    uniqueVisitors: 0,
    completionRate: 0,
    avgTimeSeconds: 0,
    ctaClicks: 0,
    leads: 0,
    slideViews: {},
    pollVotes: {},
    variantMetrics: {},
  }
}

function getPublishedVersion(deck: DeckRecord) {
  if (!deck.publishedVersionId) {
    return null
  }

  return deck.versions.find((version) => version.id === deck.publishedVersionId) ?? null
}

function normalizeDashboard(raw: unknown): DashboardData | null {
  const data = raw as {
    sessionUser?: DashboardData["sessionUser"]
    team?: DashboardData["team"]
    workspace?: DashboardData["workspace"]
    workspaces?: DashboardData["team"]["workspaces"]
    decks?: DashboardData["decks"]
  }

  if (!data?.sessionUser || !data.team || !data.workspace || !data.decks) {
    return null
  }

  return {
    sessionUser: data.sessionUser,
    team: {
      ...data.team,
      invites: data.team.invites ?? [],
      workspaces:
        data.workspaces?.map((workspace) => ({
          ...workspace,
          decks: workspace.decks ?? [],
        })) ?? [
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

async function persistInputFiles(teamSlug: string, deckPublicId: string, files: Array<{
  name: string
  content: string
  type: string
}>): Promise<StoredInputAsset[]> {
  return Promise.all(
    files.map(async (file) => {
      const stored = await writeStoredText({
        namespace: ["uploads", teamSlug, deckPublicId, "sources"],
        fileName: file.name,
        content: file.content,
        contentType: file.type || "text/plain",
      })

      return {
        fileName: file.name,
        url: stored.url,
        storageKey: stored.storageKey,
        contentType: stored.contentType,
        sizeBytes: stored.sizeBytes,
      }
    }),
  )
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

async function getDeckFromConvex(userId: string, deckId: string) {
  const client = createConvexClient()
  const data = (await client.query(convexApi.app.getDeckEditor, {
    userId,
    deckId,
  })) as {
    deck?: DeckRecord
  } | null
  return data?.deck ? (data.deck as DeckRecord) : null
}

function assertWorkspaceAccess(dashboard: DashboardData, workspaceId: string) {
  const workspace = dashboard.team.workspaces.find((item) => item.id === workspaceId)
  if (!workspace) {
    throw new Error("Workspace not found.")
  }
  return workspace
}

function assertDeckAccess(dashboard: DashboardData, deck: DeckRecord | null) {
  if (!deck || deck.teamId !== dashboard.team.id) {
    throw new Error("Deck not found.")
  }
  return deck
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
    if (!dashboard) {
      return null
    }

    const workspaceSummary = dashboard.team.workspaces.find((workspace) => workspace.slug === workspaceSlug)
    if (!workspaceSummary) {
      return null
    }

    const workspace = (await createConvexClient().query(convexApi.app.getWorkspaceById, {
      workspaceId: workspaceSummary.id,
    })) as DashboardData["workspace"] | null

    if (!workspace) {
      return null
    }

    return {
      ...dashboard,
      workspace,
      decks: workspace.decks,
    }
  },

  async getDeckEditor(userId: string, deckId: string) {
    if (!hasConvexAdminEnv()) {
      return demoStore.getDeckEditor(userId, deckId)
    }

    const client = createConvexClient()
    const sessionDashboard = await this.getDashboard(userId)
    const data = (await client.query(convexApi.app.getDeckEditor, { userId, deckId })) as {
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
        workspaces: data.team?.workspaces ?? [data.workspace],
      },
      workspace: data.workspace,
      deck: data.deck as DeckRecord,
    }
  },

  async createWorkspace(userId: string, input: { name: string; description: string }) {
    const dashboard = await this.getDashboard(userId)
    if (!dashboard) {
      throw new Error("Unable to load dashboard")
    }

    const baseSlug = slugify(input.name)
    const existingSlugs = new Set(dashboard.team.workspaces.map((workspace) => workspace.slug))
    let slug = baseSlug
    let suffix = 2
    while (existingSlugs.has(slug)) {
      slug = `${baseSlug.slice(0, 58)}-${suffix}`
      suffix += 1
    }

    if (!hasConvexAdminEnv()) {
      return demoStore.createWorkspace(userId, {
        ...input,
        slug,
      })
    }

    const createdAt = Date.now()
    const workspace = {
      teamId: dashboard.team.id,
      slug,
      name: input.name.trim(),
      description: input.description.trim() || "A new workspace for a focused deck stream.",
      createdAt,
    }

    return (await createConvexClient().mutation(convexApi.app.createWorkspace, {
      workspace,
    })) as DashboardData["workspace"]
  },

  async createInvite(userId: string, input: {
    email: string
    invitedName: string
    role: TeamInviteRecord["role"]
    workspaceId: string
  }) {
    if (!hasConvexAdminEnv()) {
      return demoStore.createInvite(userId, input)
    }

    const dashboard = await this.getDashboard(userId)
    if (!dashboard) {
      throw new Error("Unable to load dashboard")
    }

    const existingUser = await this.getUserByEmail(input.email)
    if (existingUser) {
      throw new Error("That email already has an account.")
    }

    if (!dashboard.team.workspaces.some((workspace) => workspace.id === input.workspaceId)) {
      throw new Error("Workspace not found.")
    }

    const invite = {
      teamId: dashboard.team.id,
      workspaceId: input.workspaceId,
      email: input.email.trim().toLowerCase(),
      invitedName: input.invitedName.trim() || input.email.split("@")[0]!,
      role: input.role,
      token: nanoid(24),
      status: "pending" as const,
      createdAt: Date.now(),
      invitedByUserId: userId,
    }

    return (await createConvexClient().mutation(convexApi.auth.createInvite, {
      invite,
    })) as TeamInviteRecord
  },

  async getInviteByToken(token: string) {
    if (!hasConvexAdminEnv()) {
      return demoStore.getInviteByToken(token)
    }

    const invite = (await createConvexClient().query(convexApi.auth.getInviteByToken, {
      token,
    })) as TeamInviteRecord | null

    if (!invite) {
      return null
    }

    const team = await createConvexClient().query(convexApi.app.getTeamById, {
      teamId: invite.teamId,
    })
    const workspace = await createConvexClient().query(convexApi.app.getWorkspaceById, {
      workspaceId: invite.workspaceId,
    })

    return {
      invite,
      team: team as DashboardData["team"] | null,
      workspace: workspace as DashboardData["workspace"] | null,
    }
  },

  async acceptInvite(input: {
    token: string
    name: string
    passwordHash: string
  }) {
    if (!hasConvexAdminEnv()) {
      return demoStore.acceptInvite(input)
    }

    const inviteView = await this.getInviteByToken(input.token)
    if (!inviteView?.invite || !inviteView.team || !inviteView.workspace) {
      throw new Error("Invite not found.")
    }

    if (inviteView.invite.status !== "pending") {
      throw new Error("This invite is no longer active.")
    }

    if (await this.getUserByEmail(inviteView.invite.email)) {
      throw new Error("That email already has an account.")
    }

    const user = (await createConvexClient().mutation(convexApi.auth.acceptInvite, {
      token: input.token,
      name: input.name.trim(),
      passwordHash: input.passwordHash,
    })) as UserRecord | null

    if (!user) {
      throw new Error("Unable to accept invite.")
    }

    return user
  },

  async updateTeamMemberRole(userId: string, targetUserId: string, role: TeamInviteRecord["role"]) {
    if (!hasConvexAdminEnv()) {
      return demoStore.updateTeamMemberRole(userId, targetUserId, role)
    }

    const dashboard = await this.getDashboard(userId)
    if (!dashboard) {
      throw new Error("Unable to load dashboard")
    }

    if (!dashboard.team.members.some((member) => member.userId === targetUserId)) {
      throw new Error("Team member not found.")
    }

    await createConvexClient().mutation(convexApi.auth.updateTeamMemberRole, {
      teamId: dashboard.team.id,
      targetUserId,
      role,
    })

    return role
  },

  async createDeckFromGeneration(userId: string, workspaceId: string, input: GenerationInput, source: DeckRecord["source"]) {
    if (!hasConvexAdminEnv()) {
      return demoStore.createDeckFromGeneration(userId, workspaceId, input, source)
    }

    const dashboard = await this.getDashboard(userId)
    if (!dashboard) {
      throw new Error("Unable to load dashboard")
    }
    assertWorkspaceAccess(dashboard, workspaceId)

    const createdAt = Date.now()
    const publicId = nanoid(10)
    const initialVersionId = nanoid(12)
    const artifactHtml = buildStandaloneDeckHtml(source, slugify(source.title), {
      teamName: dashboard.team.name,
      publicId,
      versionId: initialVersionId,
    })
    const publishedArtifact = await writePublishedArtifact({
      publicId,
      versionId: initialVersionId,
      html: artifactHtml,
      metadata: {
        deckTitle: source.title,
        createdAt,
      },
    })
    const persistedInputAssets = buildStoredInputAssets(
      await persistInputFiles(dashboard.team.slug, publicId, input.files),
    )
    const deck: DeckRecord = {
      id: "",
      teamId: dashboard.team.id,
      workspaceId,
      publicId,
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
          id: initialVersionId,
          label: "Version A",
          createdAt,
          status: "preview",
          source,
          artifactHtml,
          artifactStorageKey: publishedArtifact.artifactStorageKey,
          artifactUrl: publishedArtifact.artifactUrl,
        },
      ],
      publishedVersionId: undefined,
      reviewRequests: [],
      analytics: createEmptyAnalytics(),
      assets: [...persistedInputAssets, ...buildInitialDeckAssets({ ...input, files: [] }, source)],
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

    const dashboard = await this.getDashboard(userId)
    if (!dashboard) {
      throw new Error("Unable to load dashboard")
    }
    const deck = assertDeckAccess(dashboard, await getDeckFromConvex(userId, deckId))

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
        slug: slugify(source.title),
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

    const dashboard = await this.getDashboard(userId)
    if (!dashboard) {
      throw new Error("Unable to load dashboard")
    }
    const deck = assertDeckAccess(dashboard, await getDeckFromConvex(userId, deckId))

    const versionId = nanoid(12)
    const artifactHtml = buildStandaloneDeckHtml(source, slugify(source.title), {
      teamName: dashboard.team.name,
      publicId: deck.publicId,
      versionId,
    })
    const publishedArtifact = await writePublishedArtifact({
      publicId: deck.publicId,
      versionId,
      html: artifactHtml,
      metadata: {
        deckTitle: source.title,
        publishedAt: Date.now(),
        label,
      },
    })
    const version = {
      id: versionId,
      label,
      createdAt: Date.now(),
      status: "published" as const,
      source,
      artifactHtml,
      artifactStorageKey: publishedArtifact.artifactStorageKey,
      artifactUrl: publishedArtifact.artifactUrl,
      passwordHash,
    }

    await createConvexClient().mutation(convexApi.app.patchDeck, {
      deckId,
      patch: {
        source,
        title: source.title,
        description: source.summary,
        slug: slugify(source.title),
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

    const dashboard = await this.getDashboard(userId)
    if (!dashboard) {
      throw new Error("Unable to load dashboard")
    }
    const deck = assertDeckAccess(dashboard, await getDeckFromConvex(userId, deckId))

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

    const dashboard = await this.getDashboard(userId)
    if (!dashboard) {
      throw new Error("Unable to load dashboard")
    }
    const deck = assertDeckAccess(dashboard, await getDeckFromConvex(userId, deckId))
    const checkpoint = deck?.checkpoints.find((item) => item.id === checkpointId)
    if (!deck || !checkpoint) {
      throw new Error("Checkpoint not found")
    }

    await createConvexClient().mutation(convexApi.app.patchDeck, {
      deckId,
      patch: {
        source: checkpoint.source,
        title: checkpoint.source.title,
        description: checkpoint.source.summary,
        slug: slugify(checkpoint.source.title),
        updatedAt: Date.now(),
      },
    })

    return this.getDeckEditor(userId, deckId)
  },

  async createReviewRequest(userId: string, deckId: string, versionId: string, title: string) {
    if (!hasConvexAdminEnv()) {
      return demoStore.createReviewRequest(userId, deckId, versionId, title)
    }

    const dashboard = await this.getDashboard(userId)
    if (!dashboard) {
      throw new Error("Unable to load dashboard")
    }
    const deck = assertDeckAccess(dashboard, await getDeckFromConvex(userId, deckId))

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

  async addAsset(userId: string, deckId: string, asset: Omit<AssetRecord, "id">) {
    if (!hasConvexAdminEnv()) {
      return demoStore.addAsset(userId, deckId, asset)
    }

    const dashboard = await this.getDashboard(userId)
    if (!dashboard) {
      throw new Error("Unable to load dashboard")
    }
    const deck = assertDeckAccess(dashboard, await getDeckFromConvex(userId, deckId))

    const createdAsset: AssetRecord = {
      id: nanoid(8),
      ...asset,
    }

    await createConvexClient().mutation(convexApi.app.patchDeck, {
      deckId,
      patch: {
        assets: [createdAsset, ...(deck.assets ?? [])],
        updatedAt: Date.now(),
      },
    })

    return this.getDeckEditor(userId, deckId)
  },

  async saveExperiment(userId: string, deckId: string, experiment: Omit<DeckExperiment, "id"> | null) {
    if (!hasConvexAdminEnv()) {
      return demoStore.saveExperiment(userId, deckId, experiment)
    }

    const dashboard = await this.getDashboard(userId)
    if (!dashboard) {
      throw new Error("Unable to load dashboard")
    }
    const deck = assertDeckAccess(dashboard, await getDeckFromConvex(userId, deckId))

    await createConvexClient().mutation(convexApi.app.patchDeck, {
      deckId,
      patch: {
        experiment: experiment
          ? {
              id: deck.experiment?.id ?? nanoid(10),
              ...experiment,
            }
          : undefined,
        updatedAt: Date.now(),
      },
    })

    return this.getDeckEditor(userId, deckId)
  },

  async addReviewComment(token: string, input: {
    authorName: string
    body: string
    slideId?: string
    status?: "comment" | "suggestion"
    suggestedPrompt?: string
    parentCommentId?: string
  }) {
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
        status: input.status ?? "comment",
        suggestedPrompt: input.suggestedPrompt,
        parentCommentId: input.parentCommentId,
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

  async updateReviewStatus(token: string, status: ReviewRequest["status"]) {
    if (!hasConvexAdminEnv()) {
      return demoStore.updateReviewStatus(token, status)
    }

    const reviewView = await this.getReviewView(token)
    if (!reviewView) {
      throw new Error("Review not found")
    }

    const reviewRequests = reviewView.deck.reviewRequests.map((review) =>
      review.token === token
        ? {
            ...review,
            status,
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

    return status
  },

  async updateReviewComment(
    token: string,
    commentId: string,
    patch: Partial<Pick<ReviewRequest["comments"][number], "status" | "appliedAt">>,
  ) {
    if (!hasConvexAdminEnv()) {
      return demoStore.updateReviewComment(token, commentId, patch)
    }

    const reviewView = await this.getReviewView(token)
    if (!reviewView) {
      throw new Error("Review not found")
    }

    const reviewRequests = reviewView.deck.reviewRequests.map((review) =>
      review.token === token
        ? {
            ...review,
            comments: review.comments.map((comment) =>
              comment.id === commentId
                ? {
                    ...comment,
                    ...patch,
                  }
                : comment,
            ),
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

    return patch
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
