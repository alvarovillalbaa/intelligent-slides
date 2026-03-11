import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { verifySignedAccessToken } from "@/lib/access-tokens"
import { repository } from "@/lib/repository"
import { readPublishedArtifact } from "@/lib/storage"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ publicId: string; versionId: string }> },
) {
  const { publicId, versionId } = await params
  const view = await repository.getPublicDeckById(publicId)
  const cookieStore = await cookies()
  const token = new URL(request.url).searchParams.get("token")
  const claims = token ? verifySignedAccessToken(token, "artifact") : null
  const hasCookieAccess = view ? cookieStore.get(`slides_public_${view.deck.publicId}`)?.value === "1" : false

  if (!view || !view.deck.versions.some((version) => version.id === versionId)) {
    return NextResponse.json({ error: "Published artifact not found." }, { status: 404 })
  }

  if (
    view.deck.passwordProtected &&
    !hasCookieAccess &&
    (!claims || claims.publicId !== publicId || claims.versionId !== versionId)
  ) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const html = await readPublishedArtifact(publicId, versionId)

  if (!html) {
    return NextResponse.json({ error: "Published artifact not found." }, { status: 404 })
  }

  return new NextResponse(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=31536000, immutable",
    },
  })
}
