import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

import { PublicAccessGate } from "@/components/slides/deck-player"
import { PublishedDeckFrame } from "@/components/slides/published-deck-frame"
import { repository } from "@/lib/repository"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamSlug: string; deckSlug: string }>
}): Promise<Metadata> {
  const { teamSlug, deckSlug } = await params
  const view = await repository.getPublicDeck(teamSlug, deckSlug)

  if (!view) {
    return {}
  }

  return {
    title: view.version.source.seoTitle,
    description: view.version.source.seoDescription,
    openGraph: {
      title: view.version.source.seoTitle,
      description: view.version.source.seoDescription,
      images: [`/d/${teamSlug}/${deckSlug}/opengraph-image`],
    },
  }
}

export default async function PublicDeckPage({
  params,
}: {
  params: Promise<{ teamSlug: string; deckSlug: string }>
}) {
  const { teamSlug, deckSlug } = await params
  const view = await repository.getPublicDeck(teamSlug, deckSlug)

  if (!view) {
    notFound()
  }

  const cookieStore = await cookies()
  const hasAccess = cookieStore.get(`slides_public_${view.deck.publicId}`)?.value === "1"

  if (view.deck.passwordProtected && !hasAccess) {
    return <PublicAccessGate deck={view.deck} />
  }

  return (
    <PublishedDeckFrame
      src={`/published/${view.deck.publicId}/${view.version.id}`}
      title={view.version.source.title}
    />
  )
}
