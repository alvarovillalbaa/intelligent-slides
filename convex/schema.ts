import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    passwordHash: v.string(),
    teamId: v.string(),
    workspaceId: v.string(),
    role: v.string(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),
  sessions: defineTable({
    userId: v.string(),
    tokenHash: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
  }).index("by_token_hash", ["tokenHash"]),
  teams: defineTable({
    slug: v.string(),
    name: v.string(),
    brand: v.any(),
    members: v.any(),
    createdAt: v.number(),
  }).index("by_slug", ["slug"]),
  workspaces: defineTable({
    teamId: v.string(),
    slug: v.string(),
    name: v.string(),
    description: v.string(),
    createdAt: v.number(),
  })
    .index("by_team_id", ["teamId"])
    .index("by_team_slug", ["teamId", "slug"]),
  decks: defineTable({
    teamId: v.string(),
    workspaceId: v.string(),
    publicId: v.string(),
    slug: v.string(),
    title: v.string(),
    description: v.string(),
    status: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.string(),
    source: v.any(),
    checkpoints: v.any(),
    versions: v.any(),
    publishedVersionId: v.optional(v.string()),
    reviewRequests: v.any(),
    analytics: v.any(),
    assets: v.any(),
    themeMode: v.string(),
    passwordProtected: v.boolean(),
    passwordHash: v.optional(v.string()),
    experiment: v.optional(v.any()),
  })
    .index("by_workspace_id", ["workspaceId"])
    .index("by_public_id", ["publicId"])
    .index("by_team_slug", ["teamId", "slug"]),
  events: defineTable({
    deckId: v.string(),
    versionId: v.optional(v.string()),
    publicId: v.string(),
    type: v.string(),
    slideId: v.optional(v.string()),
    value: v.optional(v.string()),
    createdAt: v.number(),
    visitorId: v.string(),
  }).index("by_deck_id", ["deckId"]),
  leads: defineTable({
    deckId: v.string(),
    versionId: v.optional(v.string()),
    publicId: v.string(),
    createdAt: v.number(),
    payload: v.any(),
  }).index("by_deck_id", ["deckId"]),
})
