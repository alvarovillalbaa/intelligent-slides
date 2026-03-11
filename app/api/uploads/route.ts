import { NextResponse } from "next/server"

import { getCurrentSessionUser } from "@/lib/server-auth"
import { repository } from "@/lib/repository"
import { writeStoredBuffer } from "@/lib/storage"

export async function POST(request: Request) {
  const sessionUser = await getCurrentSessionUser()
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }
  const formData = await request.formData()
  const file = formData.get("file")
  const deckId = String(formData.get("deckId") ?? "").trim()

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Upload file is required." }, { status: 400 })
  }

  if (deckId) {
    const deck = await repository.getDeckEditor(sessionUser.id, deckId)
    if (!deck) {
      return NextResponse.json({ error: "Deck not found." }, { status: 404 })
    }
  }

  const arrayBuffer = await file.arrayBuffer()
  const stored = await writeStoredBuffer({
    namespace: ["uploads", sessionUser.teamSlug, deckId || "library"],
    fileName: file.name,
    content: Buffer.from(arrayBuffer),
    contentType: file.type,
  })

  return NextResponse.json({
    ok: true,
    file: {
      name: file.name,
      url: stored.url,
      storageKey: stored.storageKey,
      contentType: stored.contentType,
      sizeBytes: stored.sizeBytes,
    },
  })
}
