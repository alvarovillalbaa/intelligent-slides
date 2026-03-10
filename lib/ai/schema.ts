import { z } from "zod"

export const themeTokensSchema = z.object({
  id: z.string(),
  name: z.string(),
  mood: z.string(),
  displayFont: z.string(),
  bodyFont: z.string(),
  background: z.string(),
  foreground: z.string(),
  accent: z.string(),
  accentSoft: z.string(),
  card: z.string(),
  cardForeground: z.string(),
  border: z.string(),
  gradient: z.string(),
})

export const slideBlockSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("paragraph"),
    text: z.string(),
  }),
  z.object({
    kind: z.literal("bullets"),
    items: z.array(z.string()).min(2).max(6),
  }),
  z.object({
    kind: z.literal("stats"),
    items: z
      .array(
        z.object({
          label: z.string(),
          value: z.string(),
          detail: z.string(),
        }),
      )
      .min(2)
      .max(4),
  }),
  z.object({
    kind: z.literal("quote"),
    quote: z.string(),
    byline: z.string(),
  }),
  z.object({
    kind: z.literal("timeline"),
    items: z
      .array(
        z.object({
          label: z.string(),
          detail: z.string(),
        }),
      )
      .min(2)
      .max(5),
  }),
  z.object({
    kind: z.literal("code"),
    language: z.string(),
    code: z.string(),
  }),
  z.object({
    kind: z.literal("callout"),
    label: z.string(),
    value: z.string(),
  }),
])

export const deckSourceSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  audience: z.string(),
  narrative: z.string(),
  summary: z.string(),
  seoTitle: z.string(),
  seoDescription: z.string(),
  brand: z.object({
    companyName: z.string(),
    sourceUrl: z.string().optional(),
    tagline: z.string(),
    voice: z.string(),
    descriptors: z.array(z.string()).default([]),
    palette: z.array(z.string()).default([]),
    logos: z.array(z.string()).default([]),
  }),
  theme: themeTokensSchema,
  cta: z.object({
    label: z.string(),
    href: z.string(),
    helperText: z.string(),
  }),
  leadCapture: z.object({
    enabled: z.boolean(),
    headline: z.string(),
    description: z.string(),
    fields: z.array(
      z.object({
        key: z.string(),
        label: z.string(),
        type: z.enum(["text", "email", "textarea"]),
        required: z.boolean(),
        placeholder: z.string(),
      }),
    ),
  }),
  poll: z.object({
    question: z.string(),
    options: z.array(z.string()).min(2).max(4),
  }),
  slides: z
    .array(
      z.object({
        id: z.string(),
        kicker: z.string(),
        title: z.string(),
        summary: z.string(),
        layout: z.enum(["hero", "split", "stats", "quote", "timeline", "cta"]),
        blocks: z.array(slideBlockSchema).min(1).max(4),
        notes: z.string(),
      }),
    )
    .min(4)
    .max(8),
})

export type DeckSourceSchema = z.infer<typeof deckSourceSchema>
