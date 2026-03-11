import { nanoid } from "nanoid"

import { buildStandaloneDeckHtml, remixTheme, themeLibrary } from "@/lib/deck-runtime"
import { hashSecret } from "@/lib/auth"
import type {
  DeckAnalytics,
  DeckCheckpoint,
  DeckExperiment,
  DeckRecord,
  DeckSource,
  DeckVersion,
  RepositoryState,
  ReviewRequest,
  TeamRecord,
  UserRecord,
  WorkspaceRecord,
} from "@/lib/types"
import { slugify } from "@/lib/utils"

function createDeckSource(teamName: string): DeckSource {
  const brand = {
    companyName: teamName,
    sourceUrl: "https://example.com",
    tagline: "Slides that feel designed, not generated.",
    voice: "Confident, clear, operator-minded.",
    descriptors: ["editorial", "on-brand", "high-trust"],
    palette: ["#ff6f4d", "#102114", "#7cd3ff"],
    logos: ["wordmark"],
  }

  return {
    title: "Launch a slide system that ships itself",
    subtitle: "Turn raw material into presentation-grade narratives in minutes.",
    audience: "Growth + Product leadership",
    narrative: "From intake to publish, keep the deck live and editable.",
    summary:
      "Slides takes pasted notes, URLs, and files, then turns them into a polished deck with brand alignment, live preview, and versioned publishing.",
    seoTitle: `${teamName} deck operating system`,
    seoDescription:
      "Generate, edit, review, publish, and measure code-based slide decks from one product surface.",
    brand,
    theme: themeLibrary[0],
    cta: {
      label: "Book a walkthrough",
      href: "https://example.com/demo",
      helperText: "The deck is the funnel. Keep CTA and lead capture inside the narrative.",
    },
    leadCapture: {
      enabled: true,
      headline: "Capture qualified interest before the final slide fades",
      description: "Use lightweight fields and route leads straight into the workspace.",
      fields: [
        {
          key: "name",
          label: "Name",
          type: "text",
          required: true,
          placeholder: "Morgan Lee",
        },
        {
          key: "email",
          label: "Work email",
          type: "email",
          required: true,
          placeholder: "morgan@company.com",
        },
        {
          key: "goal",
          label: "What deck are you trying to ship?",
          type: "textarea",
          required: false,
          placeholder: "Board update, launch deck, investor narrative...",
        },
      ],
    },
    poll: {
      question: "Which part of the workflow matters most?",
      options: ["Generation speed", "Review flow", "Publishing & analytics"],
    },
    slides: [
      {
        id: nanoid(8),
        kicker: "The problem",
        title: "Most slide workflows break the moment teams need speed and control.",
        summary:
          "Founders want fast generation. Marketing wants brand control. Revenue wants CTA analytics. Existing tools force tradeoffs.",
        layout: "hero",
        blocks: [
          {
            kind: "paragraph",
            text: "The winning motion is not just AI generation. It is AI generation paired with versioning, review semantics, and public distribution.",
          },
          {
            kind: "bullets",
            items: [
              "Input sources are fragmented across docs, links, and files.",
              "Review feedback gets lost in chat instead of mapping to slides.",
              "Published decks rarely feed analytics and lead capture back to the team.",
            ],
          },
        ],
        notes: "Open with the coordination cost, not the AI novelty.",
      },
      {
        id: nanoid(8),
        kicker: "The product",
        title: "Slides turns content into a live deck system, not a one-off export.",
        summary:
          "The editor keeps structured deck source, generates standalone HTML versions, and makes every publish measurable.",
        layout: "split",
        blocks: [
          {
            kind: "stats",
            items: [
              {
                label: "Inputs",
                value: "3",
                detail: "Paste, URL, or files into the same intake surface.",
              },
              {
                label: "Editing loops",
                value: "2",
                detail: "Prompt-based rewrites plus direct slide editing.",
              },
              {
                label: "Publish targets",
                value: "2",
                detail: "Hosted URL by slug and embeddable iframe.",
              },
            ],
          },
          {
            kind: "callout",
            label: "Why teams care",
            value: "Every draft can become a measurable landing surface.",
          },
        ],
        notes: "Bridge from generation to a system-of-record story.",
      },
      {
        id: nanoid(8),
        kicker: "How it works",
        title: "A single workflow covers authoring, brand control, review, and publish.",
        summary: "No handoff to another tool after generation.",
        layout: "timeline",
        blocks: [
          {
            kind: "timeline",
            items: [
              {
                label: "1. Normalize inputs",
                detail: "Convert text, URL content, and uploaded files into one source document.",
              },
              {
                label: "2. Generate deck source",
                detail: "Use a structured deck schema that stays editable after generation.",
              },
              {
                label: "3. Publish artifacts",
                detail: "Ship immutable standalone HTML versions tied to checkpoints and experiments.",
              },
            ],
          },
        ],
        notes: "This slide sets up the product architecture story.",
      },
      {
        id: nanoid(8),
        kicker: "Proof",
        title: "The published deck becomes a measurable growth asset.",
        summary: "CTAs, lead forms, and experiments all live in the deck surface.",
        layout: "stats",
        blocks: [
          {
            kind: "quote",
            quote: "We stopped rebuilding the same launch deck in three different tools every week.",
            byline: "Product marketing lead",
          },
          {
            kind: "stats",
            items: [
              {
                label: "Completion",
                value: "72%",
                detail: "Sample completion rate across high-intent viewers.",
              },
              {
                label: "Lead capture",
                value: "18%",
                detail: "CTA-to-form conversion from public deck traffic.",
              },
              {
                label: "Iteration time",
                value: "-63%",
                detail: "Time saved compared with manual slide rebuilds.",
              },
            ],
          },
        ],
        notes: "Make the deck feel like a funnel asset, not just collateral.",
      },
    ],
  }
}

function createAnalytics(): DeckAnalytics {
  return {
    views: 384,
    uniqueVisitors: 201,
    completionRate: 72,
    avgTimeSeconds: 198,
    ctaClicks: 31,
    leads: 12,
    slideViews: {},
    pollVotes: {
      "Story arc": 18,
      "Design system": 11,
      "CTA placement": 7,
    },
    variantMetrics: {},
  }
}

function createReview(versionId: string): ReviewRequest {
  return {
    id: nanoid(10),
    token: nanoid(18),
    title: "Board review",
    createdAt: Date.now() - 1000 * 60 * 60 * 10,
    status: "changes_requested",
    versionId,
    comments: [
      {
        id: nanoid(8),
        authorName: "Avery",
        body: "Slide two should frame this as operating leverage, not only speed.",
        createdAt: Date.now() - 1000 * 60 * 40,
        slideId: "",
        status: "comment",
      },
      {
        id: nanoid(8),
        authorName: "Jordan",
        body: "Add one investor-facing checkpoint with a more conservative tone.",
        createdAt: Date.now() - 1000 * 60 * 20,
        status: "suggestion",
        suggestedPrompt: "Rewrite this deck for investor diligence with tighter financial language.",
      },
    ],
  }
}

function createExperiment(versions: DeckVersion[]): DeckExperiment | undefined {
  if (versions.length < 2) {
    return undefined
  }

  return {
    id: nanoid(10),
    name: "CTA framing test",
    status: "running",
    question: "Which closing narrative drives more demo requests?",
    variants: versions.slice(0, 2).map((version, index) => ({
      id: nanoid(6),
      label: index === 0 ? "Operator-focused" : "Growth-focused",
      versionId: version.id,
      weight: 50,
    })),
  }
}

export function createSeedState(): RepositoryState {
  const now = Date.now()
  const teamId = nanoid(12)
  const workspaceId = nanoid(12)
  const userId = nanoid(12)
  const teamName = "Northstar Labs"
  const baseSource = createDeckSource(teamName)
  const remixSource = {
    ...baseSource,
    theme: remixTheme(themeLibrary[1], baseSource.brand),
    title: "Turn every narrative into a distribution-ready deck",
  }

  const publishedVersion: DeckVersion = {
    id: nanoid(12),
    label: "Version A",
    createdAt: now - 1000 * 60 * 60 * 24,
    status: "published",
    source: baseSource,
    artifactHtml: buildStandaloneDeckHtml(baseSource, slugify(baseSource.title)),
  }

  const alternateVersion: DeckVersion = {
    id: nanoid(12),
    label: "Version B",
    createdAt: now - 1000 * 60 * 60 * 12,
    status: "published",
    source: remixSource,
    artifactHtml: buildStandaloneDeckHtml(remixSource, slugify(remixSource.title)),
  }

  const checkpoints: DeckCheckpoint[] = [
    {
      id: nanoid(10),
      title: "Initial generation",
      summary: "First pass from mixed launch notes.",
      prompt: "Turn this launch memo into a presentation narrative.",
      createdAt: now - 1000 * 60 * 60 * 30,
      source: baseSource,
    },
    {
      id: nanoid(10),
      title: "Board polish",
      summary: "Tighter headline and stronger metrics framing.",
      prompt: "Make the deck more executive and investor-ready.",
      createdAt: now - 1000 * 60 * 60 * 16,
      source: remixSource,
    },
  ]

  const deck: DeckRecord = {
    id: nanoid(12),
    teamId,
    workspaceId,
    publicId: nanoid(10),
    slug: slugify("slides-operating-system"),
    title: "Slides operating system",
    description: "A sample deck showing the full create-edit-publish loop.",
    status: "published",
    createdAt: now - 1000 * 60 * 60 * 36,
    updatedAt: now - 1000 * 60 * 25,
    createdBy: userId,
    source: remixSource,
    checkpoints,
    versions: [publishedVersion, alternateVersion],
    publishedVersionId: alternateVersion.id,
    reviewRequests: [createReview(alternateVersion.id)],
    analytics: createAnalytics(),
    assets: [
      {
        id: nanoid(8),
        kind: "image",
        title: "Product UI mock",
        description: "Hero asset used in launch narrative.",
        url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
      },
      {
        id: nanoid(8),
        kind: "document",
        title: "Launch memo",
        description: "Source memo used for intake.",
        url: "memo.md",
      },
    ],
    themeMode: "remix",
    passwordProtected: false,
    experiment: createExperiment([publishedVersion, alternateVersion]),
  }

  const workspace: WorkspaceRecord = {
    id: workspaceId,
    teamId,
    slug: "core-growth",
    name: "Core Growth",
    description: "Narratives for launches, GTM, and board-facing stories.",
    decks: [deck],
  }

  const team: TeamRecord = {
    id: teamId,
    slug: slugify(teamName),
    name: teamName,
    brand: baseSource.brand,
    workspaces: [workspace],
    members: [
      {
        userId,
        name: "Morgan Lee",
        email: "morgan@northstarlabs.com",
        role: "admin",
      },
    ],
    invites: [],
  }

  const user: UserRecord = {
    id: userId,
    name: "Morgan Lee",
    email: "morgan@northstarlabs.com",
    passwordHash: hashSecret("demo1234"),
    teamId,
    workspaceId,
    role: "admin",
    createdAt: now - 1000 * 60 * 60 * 48,
  }

  return {
    users: [user],
    sessions: [],
    teams: [team],
    workspaces: [workspace],
    decks: [deck],
    events: [],
    leads: [],
    invites: [],
  }
}
