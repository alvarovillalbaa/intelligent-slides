import { NextResponse } from "next/server"
import { z } from "zod"

import { generateDeckSource } from "@/lib/ai/generate-deck"
import type { DeckSource, GenerationInput } from "@/lib/types"

const requestSchema = z.object({
  generationInput: z.object({
    inputKind: z.enum(["paste", "url", "files"]),
    rawText: z.string(),
    sourceUrl: z.string().optional(),
    prompt: z.string(),
    files: z.array(
      z.object({
        name: z.string(),
        content: z.string(),
        type: z.string(),
      }),
    ),
    themeMode: z.enum(["brand", "remix"]),
  }),
  existingSource: z.any().optional(),
})

function sendLine(controller: ReadableStreamDefaultController<Uint8Array>, payload: unknown) {
  controller.enqueue(new TextEncoder().encode(`${JSON.stringify(payload)}\n`))
}

function createPartial(source: DeckSource, slideCount: number) {
  return {
    ...source,
    slides: source.slides.slice(0, slideCount),
  }
}

export async function POST(request: Request) {
  const body = requestSchema.safeParse(await request.json())

  if (!body.success) {
    return NextResponse.json(
      { error: "Invalid generation payload." },
      { status: 400 },
    )
  }

  const generationInput: GenerationInput = body.data.existingSource
    ? {
        ...body.data.generationInput,
        rawText: `${body.data.generationInput.rawText}\n\nCurrent deck:\n${JSON.stringify(body.data.existingSource)}`,
      }
    : body.data.generationInput

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        sendLine(controller, { type: "status", message: "Normalizing input..." })
        const result = await generateDeckSource(generationInput)
        sendLine(controller, { type: "status", message: "Drafting slide narrative..." })

        for (let index = 1; index <= result.object.slides.length; index += 1) {
          sendLine(controller, {
            type: "partial",
            source: createPartial(result.object, index),
          })
          await new Promise((resolve) => setTimeout(resolve, 90))
        }

        sendLine(controller, {
          type: "final",
          source: result.object,
          provider: result.provider,
          modelName: result.modelName,
        })
        controller.close()
      } catch (error) {
        sendLine(controller, {
          type: "error",
          message: error instanceof Error ? error.message : "Unable to generate deck.",
        })
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson",
      "cache-control": "no-store",
    },
  })
}
