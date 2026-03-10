import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

import { DeckPlayer, PublicAccessGate } from "@/components/slides/deck-player"
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

  return <DeckPlayer view={view} />
}
