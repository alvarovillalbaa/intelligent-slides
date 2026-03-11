import { nanoid } from "nanoid"
import { NextResponse } from "next/server"
import { z } from "zod"

import { repository } from "@/lib/repository"

const leadSchema = z.object({
  deckId: z.string().optional(),
  publicId: z.string(),
  versionId: z.string().optional(),
  payload: z.record(z.string(), z.string()),
})

export async function POST(request: Request) {
  const body = leadSchema.safeParse(await request.json())
  if (!body.success) {
    return NextResponse.json({ error: "Invalid lead payload." }, { status: 400 })
  }

  await repository.captureLead({
    id: nanoid(10),
    createdAt: Date.now(),
    ...body.data,
  })

  await repository.recordEvent({
    id: nanoid(10),
    createdAt: Date.now(),
    deckId: body.data.deckId,
    publicId: body.data.publicId,
    versionId: body.data.versionId,
    type: "lead_submit",
    visitorId: nanoid(12),
  })

  return NextResponse.json({ ok: true })
}
