"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

import { hashDeckPassword, requireSessionUser, verifyDeckPassword } from "@/lib/server-auth"
import { repository } from "@/lib/repository"
import type { DeckSource, GenerationInput } from "@/lib/types"
import { getBaseUrl } from "@/lib/env"

export async function createDeckFromGeneratedSourceAction(input: {
  workspaceId: string
  generationInput: GenerationInput
  source: DeckSource
}) {
  const sessionUser = await requireSessionUser()
  const deck = await repository.createDeckFromGeneration(
    sessionUser.id,
    input.workspaceId,
    input.generationInput,
    input.source,
  )

  revalidatePath("/app")
  revalidatePath(`/app/workspaces/${sessionUser.workspaceSlug}`)

  return {
    deckId: deck.id,
    workspaceSlug: sessionUser.workspaceSlug,
  }
}

export async function saveDeckCheckpointAction(input: {
  deckId: string
  prompt: string
  title: string
  source: DeckSource
}) {
  const sessionUser = await requireSessionUser()
  await repository.saveCheckpoint(sessionUser.id, input.deckId, input.source, input.prompt, input.title)
  revalidatePath(`/app/workspaces/${sessionUser.workspaceSlug}/decks/${input.deckId}`)
  revalidatePath(`/app/workspaces/${sessionUser.workspaceSlug}`)
}

export async function publishDeckVersionAction(input: {
  deckId: string
  label: string
  source: DeckSource
  password?: string
}) {
  const sessionUser = await requireSessionUser()
  const version = await repository.publishVersion(
    sessionUser.id,
    input.deckId,
    input.source,
    input.label,
    hashDeckPassword(input.password ?? ""),
  )

  revalidatePath(`/app/workspaces/${sessionUser.workspaceSlug}/decks/${input.deckId}`)
  revalidatePath(`/d/${sessionUser.teamSlug}/${version.source.title}`)

  return version
}

export async function randomizeDeckThemeAction(deckId: string) {
  const sessionUser = await requireSessionUser()
  const source = await repository.randomizeTheme(sessionUser.id, deckId)
  revalidatePath(`/app/workspaces/${sessionUser.workspaceSlug}/decks/${deckId}`)
  return source
}

export async function restoreCheckpointAction(deckId: string, checkpointId: string) {
  const sessionUser = await requireSessionUser()
  await repository.restoreCheckpoint(sessionUser.id, deckId, checkpointId)
  revalidatePath(`/app/workspaces/${sessionUser.workspaceSlug}/decks/${deckId}`)
}

export async function createReviewLinkAction(input: {
  deckId: string
  versionId: string
  title: string
}) {
  const sessionUser = await requireSessionUser()
  const review = await repository.createReviewRequest(
    sessionUser.id,
    input.deckId,
    input.versionId,
    input.title,
  )

  revalidatePath(`/app/workspaces/${sessionUser.workspaceSlug}/decks/${input.deckId}`)

  return {
    ...review,
    reviewUrl: `${getBaseUrl()}/review/${review.token}`,
  }
}

export async function addReviewCommentAction(input: {
  token: string
  authorName: string
  body: string
  slideId?: string
}) {
  await repository.addReviewComment(input.token, input)
  revalidatePath(`/review/${input.token}`)
}

export async function unlockDeckAction(input: { publicId: string; password: string }) {
  const view = await repository.getPublicDeckById(input.publicId)
  if (!view) {
    return { ok: false, error: "Deck not found." }
  }

  if (!verifyDeckPassword(input.password, view.deck.passwordHash)) {
    return { ok: false, error: "Incorrect password." }
  }

  const cookieStore = await cookies()
  cookieStore.set(`slides_public_${view.deck.publicId}`, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  })

  return { ok: true }
}
