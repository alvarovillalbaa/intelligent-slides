import { nanoid } from "nanoid"
import { generateObject, streamObject } from "ai"

import { remixTheme, themeLibrary } from "@/lib/deck-runtime"
import { deckSourceSchema } from "@/lib/ai/schema"
import { resolveLanguageModel, type ProviderKey } from "@/lib/ai/provider-registry"
import type { DeckSource, GenerationInput } from "@/lib/types"

function createFallbackDeck(input: GenerationInput): DeckSource {
  const text = [input.rawText, input.sourceUrl, ...input.files.map((file) => file.content)]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 4000)

  const headline = text.split(/\n+/).find(Boolean) ?? "Untitled narrative"
  const snippets = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 32)
    .slice(0, 8)

  const theme = input.themeMode === "remix" ? remixTheme(themeLibrary[1]) : themeLibrary[0]

  return {
    title: headline.slice(0, 72),
    subtitle: "A generated working draft",
    audience: "Internal stakeholders",
    narrative: input.prompt || "Turn raw notes into a presentation narrative.",
    summary: snippets[0] ?? "This draft deck was generated from the supplied source material.",
    seoTitle: headline.slice(0, 70),
    seoDescription: snippets[1] ?? "Generated from source content inside Slides.",
    brand: {
      companyName: input.sourceUrl
        ? new URL(input.sourceUrl).hostname.replace("www.", "")
        : "Slides",
      sourceUrl: input.sourceUrl,
      tagline: "Generated from your latest source material.",
      voice: "Clear, practical, and concise.",
      descriptors: ["structured", "editorial", "presentation-ready"],
      palette: [theme.accent, theme.foreground],
      logos: [],
    },
    theme,
    cta: {
      label: "Talk to the team",
      href: "https://example.com/demo",
      helperText: "Place the next step inside the deck instead of outside the workflow.",
    },
    leadCapture: {
      enabled: true,
      headline: "Capture follow-up interest",
      description: "Use the deck itself as the handoff point.",
      fields: [
        {
          key: "name",
          label: "Name",
          type: "text",
          required: true,
          placeholder: "Taylor",
        },
        {
          key: "email",
          label: "Email",
          type: "email",
          required: true,
          placeholder: "taylor@company.com",
        },
      ],
    },
    poll: {
      question: "What should be improved first?",
      options: ["Story arc", "Design system", "CTA placement"],
    },
    slides: [
      {
        id: nanoid(8),
        kicker: "Source pulse",
        title: headline.slice(0, 84),
        summary: snippets[0] ?? "This slide condenses the source material into a headline.",
        layout: "hero",
        blocks: [
          {
            kind: "paragraph",
            text: snippets[0] ?? "Use this hero slide to orient the audience around the main argument.",
          },
          {
            kind: "bullets",
            items: snippets.slice(1, 4).map((item) => item.slice(0, 120)).concat(
              snippets.length < 4
                ? ["Add a product proof point.", "Define the audience and CTA."]
                : [],
            ),
          },
        ],
        notes: "Rewrite the hero if you want a stronger executive framing.",
      },
      {
        id: nanoid(8),
        kicker: "What matters",
        title: "Convert raw information into a deck structure that can still evolve.",
        summary: "Keep authoring source editable after generation so teams can prompt, refine, and publish without rebuilds.",
        layout: "split",
        blocks: [
          {
            kind: "stats",
            items: [
              {
                label: "Input modes",
                value: String(Math.max(1, (input.rawText ? 1 : 0) + (input.sourceUrl ? 1 : 0) + (input.files.length ? 1 : 0))),
                detail: "Combined inside one generation request.",
              },
              {
                label: "Captured snippets",
                value: String(snippets.length || 3),
                detail: "Source lines used to draft the first narrative.",
              },
              {
                label: "Prompt mode",
                value: input.themeMode === "remix" ? "Remix" : "Brand",
                detail: "Theme generation mode selected by the editor.",
              },
            ],
          },
        ],
        notes: "This slide explains the authoring loop, not just the AI call.",
      },
      {
        id: nanoid(8),
        kicker: "Narrative arc",
        title: "A good first draft should already know where the deck is going.",
        summary: "Map the message, evidence, and call to action before styling details.",
        layout: "timeline",
        blocks: [
          {
            kind: "timeline",
            items: [
              {
                label: "Frame the problem",
                detail: "Start with the friction or opportunity in the source.",
              },
              {
                label: "Prove the argument",
                detail: "Use supporting snippets, numbers, and customer language.",
              },
              {
                label: "End with an action",
                detail: "Embed CTA and lead capture inside the deck.",
              },
            ],
          },
        ],
        notes: "A three-part arc keeps the first iteration coherent.",
      },
      {
        id: nanoid(8),
        kicker: "Close",
        title: "Ship the deck as a hosted artifact, not a screenshot export.",
        summary: "The deck should support versioning, analytics, embeds, password gating, and review links.",
        layout: "cta",
        blocks: [
          {
            kind: "quote",
            quote: input.prompt || "Use this last slide to anchor the next product or sales motion.",
            byline: "Prompt seed",
          },
          {
            kind: "callout",
            label: "Next action",
            value: "Publish a version, share a review link, or start an A/B test.",
          },
        ],
        notes: "Tighten CTA language after the core narrative is stable.",
      },
    ],
  }
}

function buildPrompt(input: GenerationInput) {
  const fileContext = input.files
    .map((file) => `File: ${file.name}\n${file.content.slice(0, 1600)}`)
    .join("\n\n")

  return `
You are generating a code-based presentation deck.
Create a polished but concise narrative for an audience that can publish as standalone HTML.

User prompt:
${input.prompt || "Create a crisp, well-structured deck."}

Input kind: ${input.inputKind}
Source URL: ${input.sourceUrl ?? "none"}
Theme mode: ${input.themeMode}

Raw content:
${input.rawText || "No pasted content provided."}

File context:
${fileContext || "No files uploaded."}
  `.trim()
}

export async function generateDeckSource(input: GenerationInput, options?: {
  provider?: ProviderKey
  model?: string
}) {
  const resolved = resolveLanguageModel(options?.provider, options?.model)

  if (!resolved) {
    return {
      provider: "fallback" as const,
      modelName: "heuristic",
      object: createFallbackDeck(input),
    }
  }

  const generated = await generateObject({
    model: resolved.model,
    schema: deckSourceSchema,
    temperature: 0.8,
    prompt: buildPrompt(input),
    schemaName: "deck_source",
    schemaDescription:
      "A polished slide deck with brand details, CTA, lead capture, poll, and 4-8 slides.",
  })

  return {
    provider: resolved.provider,
    modelName: resolved.modelName,
    object: generated.object,
  }
}

export async function streamDeckSource(
  input: GenerationInput,
  options?: { provider?: ProviderKey; model?: string },
) {
  const resolved = resolveLanguageModel(options?.provider, options?.model)

  if (!resolved) {
    return {
      provider: "fallback" as const,
      modelName: "heuristic",
      partials: [createFallbackDeck(input)],
      finalObject: createFallbackDeck(input),
    }
  }

  const result = streamObject({
    model: resolved.model,
    schema: deckSourceSchema,
    temperature: 0.8,
    prompt: buildPrompt(input),
    schemaName: "deck_source",
  })

  const partials: DeckSource[] = []
  for await (const partial of result.partialObjectStream) {
    partials.push(partial as DeckSource)
  }

  const finalObject = await result.object

  return {
    provider: resolved.provider,
    modelName: resolved.modelName,
    partials,
    finalObject,
  }
}
