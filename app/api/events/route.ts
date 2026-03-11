import { nanoid } from "nanoid"
import { NextResponse } from "next/server"
import { z } from "zod"

import { repository } from "@/lib/repository"

const eventSchema = z.object({
  deckId: z.string().optional(),
  publicId: z.string(),
  versionId: z.string().optional(),
  type: z.enum(["view", "slide_view", "cta_click", "lead_submit", "poll_vote", "deck_complete", "session_end"]),
  slideId: z.string().optional(),
  value: z.string().optional(),
  visitorId: z.string().optional(),
  durationMs: z.number().optional(),
})

export async function POST(request: Request) {
  const body = eventSchema.safeParse(await request.json())
  if (!body.success) {
    return NextResponse.json({ error: "Invalid event payload." }, { status: 400 })
  }

  await repository.recordEvent({
    id: nanoid(10),
    createdAt: Date.now(),
    visitorId: body.data.visitorId ?? nanoid(12),
    ...body.data,
  })

  return NextResponse.json({ ok: true })
}
