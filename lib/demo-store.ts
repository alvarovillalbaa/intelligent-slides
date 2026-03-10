import { nanoid } from "nanoid"

import { buildStandaloneDeckHtml, remixTheme, themeLibrary } from "@/lib/deck-runtime"
import { createSeedState } from "@/lib/seed"
import type {
  AnalyticsEvent,
  DashboardData,
  DeckCheckpoint,
  DeckRecord,
  DeckVersion,
  GenerationInput,
  LeadRecord,
  PublicDeckView,
  RepositoryState,
  ReviewRequest,
  ReviewView,
  SessionRecord,
  SessionUser,
  TeamRecord,
  UserRecord,
} from "@/lib/types"
import { slugify } from "@/lib/utils"

let state = createSeedState()

function cloneState<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

function findUserById(userId: string) {
  return state.users.find((user) => user.id === userId)
}

function findTeam(teamId: string) {
  return state.teams.find((team) => team.id === teamId)
}

function findWorkspace(workspaceId: string) {
  return state.workspaces.find((workspace) => workspace.id === workspaceId)
}

function findDeck(deckId: string) {
  return state.decks.find((deck) => deck.id === deckId)
}

function toSessionUser(user: UserRecord): SessionUser {
  const team = findTeam(user.teamId)
  const workspace = findWorkspace(user.workspaceId)

  if (!team || !workspace) {
    throw new Error("Corrupted demo state")
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    teamId: team.id,
    teamName: team.name,
    teamSlug: team.slug,
    workspaceId: workspace.id,
    workspaceSlug: workspace.slug,
  }
}

function refreshWorkspaceDecks(team: TeamRecord, deck: DeckRecord) {
  const workspace = state.workspaces.find((item) => item.id === deck.workspaceId)
  if (!workspace) {
    return
  }

  workspace.decks = state.decks.filter((item) => item.workspaceId === workspace.id)
  team.workspaces = state.workspaces.filter((item) => item.teamId === team.id)
}

function createVersionFromSource(source: DeckRecord["source"], label: string): DeckVersion {
  return {
    id: nanoid(12),
    label,
    createdAt: Date.now(),
    status: "published",
    source,
    artifactHtml: buildStandaloneDeckHtml(source, slugify(source.title)),
  }
}

function createCheckpoint(source: DeckRecord["source"], prompt: string, title?: string): DeckCheckpoint {
  return {
    id: nanoid(10),
    title: title ?? "Saved checkpoint",
    summary: source.summary,
    prompt,
    createdAt: Date.now(),
    source,
  }
}

function accumulateAnalytics(deckId: string) {
  const deck = findDeck(deckId)
  if (!deck) {
    return
  }

  const events = state.events.filter((event) => event.deckId === deckId)
  const viewEvents = events.filter((event) => event.type === "view")
  const ctaClicks = events.filter((event) => event.type === "cta_click").length
  const leadCount = state.leads.filter((lead) => lead.deckId === deckId).length
  const slideViews: Record<string, number> = {}

  for (const event of events.filter((item) => item.type === "slide_view" && item.slideId)) {
    slideViews[event.slideId!] = (slideViews[event.slideId!] ?? 0) + 1
  }

  deck.analytics = {
    views: viewEvents.length,
    uniqueVisitors: new Set(viewEvents.map((event) => event.visitorId)).size,
    completionRate: viewEvents.length ? Math.min(96, 42 + Math.round(events.length / 4)) : 0,
    avgTimeSeconds: viewEvents.length ? Math.min(480, 110 + events.length * 4) : 0,
    ctaClicks,
    leads: leadCount,
    slideViews,
  }
}

export const demoStore = {
  reset() {
    state = createSeedState()
  },

  getUserByEmail(email: string) {
    return state.users.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null
  },

  getSessionByTokenHash(tokenHash: string) {
    return state.sessions.find((session) => session.tokenHash === tokenHash) ?? null
  },

  createUser(input: {
    name: string
    email: string
    passwordHash: string
    teamName: string
  }) {
    const now = Date.now()
    const teamId = nanoid(12)
    const workspaceId = nanoid(12)
    const user: UserRecord = {
      id: nanoid(12),
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
      teamId,
      workspaceId,
      role: "admin",
      createdAt: now,
    }

    const team: TeamRecord = {
      id: teamId,
      slug: slugify(input.teamName),
      name: input.teamName,
      brand: {
        companyName: input.teamName,
        tagline: "Presentation infrastructure for modern teams.",
        voice: "Clear, premium, product-minded.",
        descriptors: ["editorial", "confident"],
        palette: [themeLibrary[0].accent, themeLibrary[1].accent],
        logos: ["wordmark"],
      },
      workspaces: [],
      members: [
        {
          userId: user.id,
          name: user.name,
          email: user.email,
          role: "admin",
        },
      ],
    }

    const workspace = {
      id: workspaceId,
      teamId,
      slug: "hq",
      name: "HQ",
      description: "Default workspace",
      decks: [],
    }

    state.users.push(user)
    state.teams.push(team)
    state.workspaces.push(workspace)
    team.workspaces = [workspace]

    return cloneState(user)
  },

  createSession(session: SessionRecord) {
    state.sessions.push(session)
    return cloneState(session)
  },

  deleteSession(tokenHash: string) {
    state.sessions = state.sessions.filter((session) => session.tokenHash !== tokenHash)
  },

  getSessionUser(tokenHash: string) {
    const session = this.getSessionByTokenHash(tokenHash)
    if (!session || session.expiresAt < Date.now()) {
      return null
    }

    const user = findUserById(session.userId)
    return user ? toSessionUser(user) : null
  },

  getDashboard(userId: string): DashboardData | null {
    const user = findUserById(userId)
    if (!user) {
      return null
    }

    const team = findTeam(user.teamId)
    const workspace = findWorkspace(user.workspaceId)

    if (!team || !workspace) {
      return null
    }

    return cloneState({
      sessionUser: toSessionUser(user),
      team,
      workspace,
      decks: state.decks.filter((deck) => deck.workspaceId === workspace.id),
    })
  },

  getWorkspaceBySlug(userId: string, workspaceSlug: string) {
    const user = findUserById(userId)
    if (!user) {
      return null
    }

    const workspace = state.workspaces.find(
      (item) => item.teamId === user.teamId && item.slug === workspaceSlug,
    )

    if (!workspace) {
      return null
    }

    const team = findTeam(user.teamId)
    if (!team) {
      return null
    }

    return cloneState({
      sessionUser: toSessionUser(user),
      team,
      workspace,
      decks: state.decks.filter((deck) => deck.workspaceId === workspace.id),
    })
  },

  getDeckEditor(userId: string, deckId: string) {
    const user = findUserById(userId)
    const deck = findDeck(deckId)
    const team = user ? findTeam(user.teamId) : null
    const workspace = deck ? findWorkspace(deck.workspaceId) : null

    if (!user || !deck || !team || !workspace) {
      return null
    }

    return cloneState({
      sessionUser: toSessionUser(user),
      team,
      workspace,
      deck,
    })
  },

  createDeckFromGeneration(userId: string, workspaceId: string, input: GenerationInput, source: DeckRecord["source"]) {
    const user = findUserById(userId)
    const workspace = findWorkspace(workspaceId)
    const team = user ? findTeam(user.teamId) : null

    if (!user || !workspace || !team) {
      throw new Error("Unable to create deck")
    }

    const now = Date.now()
    const initialCheckpoint = createCheckpoint(source, input.prompt || "Initial generation", "Initial generation")
    const version = createVersionFromSource(source, "Version A")

    const deck: DeckRecord = {
      id: nanoid(12),
      teamId: team.id,
      workspaceId,
      publicId: nanoid(10),
      slug: slugify(source.title),
      title: source.title,
      description: source.summary,
      status: "preview",
      createdAt: now,
      updatedAt: now,
      createdBy: user.id,
      source,
      checkpoints: [initialCheckpoint],
      versions: [version],
      publishedVersionId: version.id,
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
        description: "Uploaded as generation context.",
        url: file.name,
      })),
      themeMode: input.themeMode,
      passwordProtected: false,
    }

    state.decks.unshift(deck)
    refreshWorkspaceDecks(team, deck)
    return cloneState(deck)
  },

  saveCheckpoint(userId: string, deckId: string, source: DeckRecord["source"], prompt: string, title: string) {
    const user = findUserById(userId)
    const deck = findDeck(deckId)
    if (!user || !deck) {
      throw new Error("Deck not found")
    }

    deck.source = source
    deck.title = source.title
    deck.description = source.summary
    deck.updatedAt = Date.now()
    deck.checkpoints.unshift(createCheckpoint(source, prompt, title))
    return cloneState(deck)
  },

  publishVersion(userId: string, deckId: string, source: DeckRecord["source"], label: string, passwordHash?: string) {
    const user = findUserById(userId)
    const deck = findDeck(deckId)
    if (!user || !deck) {
      throw new Error("Deck not found")
    }

    const version = createVersionFromSource(source, label)
    if (passwordHash) {
      version.passwordHash = passwordHash
    }
    deck.source = source
    deck.title = source.title
    deck.description = source.summary
    deck.updatedAt = Date.now()
    deck.status = "published"
    deck.passwordProtected = Boolean(passwordHash)
    deck.passwordHash = passwordHash
    deck.versions.unshift(version)
    deck.publishedVersionId = version.id
    return cloneState(version)
  },

  randomizeTheme(userId: string, deckId: string) {
    const user = findUserById(userId)
    const deck = findDeck(deckId)
    if (!user || !deck) {
      throw new Error("Deck not found")
    }

    deck.source = {
      ...deck.source,
      theme: remixTheme(deck.source.theme, deck.source.brand),
    }
    deck.themeMode = "remix"
    deck.updatedAt = Date.now()
    return cloneState(deck.source)
  },

  restoreCheckpoint(userId: string, deckId: string, checkpointId: string) {
    const user = findUserById(userId)
    const deck = findDeck(deckId)
    const checkpoint = deck?.checkpoints.find((item) => item.id === checkpointId)
    if (!user || !deck || !checkpoint) {
      throw new Error("Checkpoint not found")
    }

    deck.source = checkpoint.source
    deck.updatedAt = Date.now()
    return cloneState(deck)
  },

  createReviewRequest(userId: string, deckId: string, versionId: string, title: string) {
    const user = findUserById(userId)
    const deck = findDeck(deckId)
    if (!user || !deck) {
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

    deck.reviewRequests.unshift(review)
    return cloneState(review)
  },

  addReviewComment(token: string, input: { authorName: string; body: string; slideId?: string }) {
    const deck = state.decks.find((item) => item.reviewRequests.some((review) => review.token === token))
    const review = deck?.reviewRequests.find((item) => item.token === token)

    if (!deck || !review) {
      throw new Error("Review link not found")
    }

    review.comments.unshift({
      id: nanoid(10),
      authorName: input.authorName,
      body: input.body,
      createdAt: Date.now(),
      slideId: input.slideId,
      status: "comment",
    })

    review.status = "changes_requested"
    return cloneState(review)
  },

  getPublicDeck(teamSlug: string, deckSlug: string): PublicDeckView | null {
    const team = state.teams.find((item) => item.slug === teamSlug)
    if (!team) {
      return null
    }

    const deck = state.decks.find((item) => item.teamId === team.id && item.slug === deckSlug)
    if (!deck) {
      return null
    }

    const version =
      deck.versions.find((item) => item.id === deck.publishedVersionId) ?? deck.versions[0]

    if (!version) {
      return null
    }

    return cloneState({
      team,
      deck,
      version,
    })
  },

  getPublicDeckById(publicId: string): PublicDeckView | null {
    const deck = state.decks.find((item) => item.publicId === publicId)
    if (!deck) {
      return null
    }

    const team = findTeam(deck.teamId)
    const version =
      deck.versions.find((item) => item.id === deck.publishedVersionId) ?? deck.versions[0]

    if (!team || !version) {
      return null
    }

    return cloneState({
      team,
      deck,
      version,
    })
  },

  getReviewView(token: string): ReviewView | null {
    const deck = state.decks.find((item) => item.reviewRequests.some((review) => review.token === token))
    if (!deck) {
      return null
    }

    const review = deck.reviewRequests.find((item) => item.token === token)
    const team = findTeam(deck.teamId)
    const version = deck.versions.find((item) => item.id === review?.versionId)

    if (!review || !team || !version) {
      return null
    }

    return cloneState({
      team,
      deck,
      review,
      version,
    })
  },

  verifyDeckPassword(publicId: string, passwordHash?: string, password?: string) {
    const deck = state.decks.find((item) => item.publicId === publicId)
    if (!deck) {
      return false
    }

    if (!deck.passwordProtected || !deck.passwordHash) {
      return true
    }

    return deck.passwordHash === passwordHash && Boolean(password)
  },

  recordEvent(event: AnalyticsEvent) {
    state.events.push(event)
    accumulateAnalytics(event.deckId)
    return cloneState(event)
  },

  captureLead(lead: LeadRecord) {
    state.leads.push(lead)
    accumulateAnalytics(lead.deckId)
    return cloneState(lead)
  },

  snapshot(): RepositoryState {
    return cloneState(state)
  },
}
