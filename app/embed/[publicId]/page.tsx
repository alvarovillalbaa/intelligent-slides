import { notFound } from "next/navigation"

import { DeckPlayer } from "@/components/slides/deck-player"
import { repository } from "@/lib/repository"

export default async function EmbedPage({
  params,
}: {
  params: Promise<{ publicId: string }>
}) {
  const { publicId } = await params
  const view = await repository.getPublicDeckById(publicId)

  if (!view) {
    notFound()
  }

  return <DeckPlayer view={view} embedded />
}
