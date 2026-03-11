import { notFound } from "next/navigation"

import { createSignedAccessUrl, verifySignedAccessToken } from "@/lib/access-tokens"
import { PublishedDeckFrame } from "@/components/slides/published-deck-frame"
import { repository } from "@/lib/repository"

export default async function EmbedPage({
  params,
  searchParams,
}: {
  params: Promise<{ publicId: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { publicId } = await params
  const { token } = await searchParams
  const view = await repository.getPublicDeckById(publicId)

  const claims = token ? verifySignedAccessToken(token, "embed") : null
  if (!view || !claims || claims.publicId !== publicId) {
    notFound()
  }

  return (
    <PublishedDeckFrame
      src={createSignedAccessUrl({
        scope: "artifact",
        path: `/published/${view.deck.publicId}/${view.version.id}`,
        publicId: view.deck.publicId,
        versionId: view.version.id,
      })}
      title={view.version.source.title}
    />
  )
}
