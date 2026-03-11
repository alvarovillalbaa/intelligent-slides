import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

export const getUserByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect()
    return users.find((user) => user.email === args.email) ?? null
  },
})

export const getSessionByTokenHash = query({
  args: {
    tokenHash: v.string(),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db.query("sessions").collect()
    return sessions.find((session) => session.tokenHash === args.tokenHash) ?? null
  },
})

export const getInviteByToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const invites = await ctx.db.query("invites").collect()
    const invite = invites.find((item) => item.token === args.token) ?? null

    return invite
      ? {
          ...invite,
          id: String(invite._id),
        }
      : null
  },
})

export const createUserWithTeam = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    passwordHash: v.string(),
    teamName: v.string(),
    teamSlug: v.string(),
    workspaceSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const createdAt = Date.now()
    const teamId = await ctx.db.insert("teams", {
      slug: args.teamSlug,
      name: args.teamName,
      brand: {
        companyName: args.teamName,
        tagline: "Presentation infrastructure for modern teams.",
        voice: "Clear, premium, product-minded.",
        descriptors: ["editorial", "confident"],
        palette: ["#ff6f4d", "#7cd3ff"],
        logos: ["wordmark"],
      },
      members: [],
      createdAt,
    })

    const workspaceId = await ctx.db.insert("workspaces", {
      teamId: String(teamId),
      slug: args.workspaceSlug,
      name: "HQ",
      description: "Default workspace",
      createdAt,
    })

    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      passwordHash: args.passwordHash,
      teamId: String(teamId),
      workspaceId: String(workspaceId),
      role: "admin",
      createdAt,
    })

    await ctx.db.patch(teamId as never, {
      members: [
        {
          userId: String(userId),
          name: args.name,
          email: args.email,
          role: "admin",
        },
      ],
    })

    return {
      id: String(userId),
      name: args.name,
      email: args.email,
      teamId: String(teamId),
      workspaceId: String(workspaceId),
      role: "admin",
      createdAt,
    }
  },
})

export const createInvite = mutation({
  args: {
    invite: v.any(),
  },
  handler: async (ctx, args) => {
    const inviteId = await ctx.db.insert("invites", args.invite)
    return {
      ...args.invite,
      id: String(inviteId),
    }
  },
})

export const acceptInvite = mutation({
  args: {
    token: v.string(),
    name: v.string(),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    const invites = await ctx.db.query("invites").collect()
    const invite = invites.find((item) => item.token === args.token)

    if (!invite || invite.status !== "pending") {
      throw new Error("Invite not found")
    }

    const users = await ctx.db.query("users").collect()
    if (users.some((user) => user.email === invite.email)) {
      throw new Error("That email already has an account")
    }

    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: invite.email,
      passwordHash: args.passwordHash,
      teamId: invite.teamId,
      workspaceId: invite.workspaceId,
      role: invite.role,
      createdAt: Date.now(),
    })

    const team = await ctx.db.get(invite.teamId as never)
    if (team) {
      await ctx.db.patch(team._id as never, {
        members: [
          ...(Array.isArray(team.members) ? team.members : []),
          {
            userId: String(userId),
            name: args.name,
            email: invite.email,
            role: invite.role,
          },
        ],
      })
    }

    await ctx.db.patch(invite._id as never, {
      status: "accepted",
      acceptedAt: Date.now(),
    })

    return {
      id: String(userId),
      name: args.name,
      email: invite.email,
      teamId: invite.teamId,
      workspaceId: invite.workspaceId,
      role: invite.role,
      createdAt: Date.now(),
    }
  },
})

export const updateTeamMemberRole = mutation({
  args: {
    teamId: v.string(),
    targetUserId: v.string(),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.targetUserId as never)
    const team = await ctx.db.get(args.teamId as never)

    if (!user || !team) {
      throw new Error("Team member not found")
    }

    await ctx.db.patch(user._id as never, {
      role: args.role,
    })

    await ctx.db.patch(team._id as never, {
      members: (Array.isArray(team.members) ? team.members : []).map((member: { userId: string }) =>
        member.userId === args.targetUserId
          ? {
              ...member,
              role: args.role,
            }
          : member,
      ),
    })

    return { ok: true }
  },
})

export const createSession = mutation({
  args: {
    userId: v.string(),
    tokenHash: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const sessionId = await ctx.db.insert("sessions", args)
    return {
      id: String(sessionId),
      ...args,
    }
  },
})

export const deleteSession = mutation({
  args: {
    tokenHash: v.string(),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db.query("sessions").collect()
    const session = sessions.find((item) => item.tokenHash === args.tokenHash)

    if (session) {
      await ctx.db.delete(session._id as never)
    }

    return { ok: true }
  },
})
