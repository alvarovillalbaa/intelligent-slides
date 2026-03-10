import { notFound } from "next/navigation"

import { DeckEditorClient } from "@/components/slides/deck-editor-client"
import { repository } from "@/lib/repository"
import { requireSessionUser } from "@/lib/server-auth"

export default async function DeckEditorPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; deckId: string }>
}) {
  const { deckId } = await params
  const sessionUser = await requireSessionUser()
  const editorData = await repository.getDeckEditor(sessionUser.id, deckId)

  if (!editorData) {
    notFound()
  }

  return (
    <div className="grid gap-8">
      <div className="max-w-3xl">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Deck editor</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-foreground">
          {editorData.deck.title}
        </h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">
          Prompt-based rewriting, direct slide editing, checkpoint history, review links, password-protected publishing, and analytics all live here.
        </p>
      </div>
      <DeckEditorClient sessionUser={editorData.sessionUser} deck={editorData.deck} />
    </div>
  )
}
