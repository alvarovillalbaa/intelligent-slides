import { generateText } from "ai"
import mammoth from "mammoth"
import { PDFParse } from "pdf-parse"

import { resolveLanguageModel } from "@/lib/ai/provider-registry"

const MAX_RAW_TEXT_LENGTH = 12_000
const MAX_LIST_ITEMS = 8
const MAX_TABLES = 3
const OCR_PROMPT = [
  "Extract this image into structured deck-ready context.",
  "Return plain text with these sections in order:",
  "1. Summary",
  "2. Visible text",
  "3. Key UI/components",
  "4. Numbers or metrics",
  "5. Suggested slide angles",
  "Be literal, concise, and do not invent missing text.",
].join("\n")

function normalizeWhitespace(value: string) {
  return value.replace(/\r/g, "").replace(/\t/g, " ").replace(/\u0000/g, "").trim()
}

function clip(value: string, maxLength = MAX_RAW_TEXT_LENGTH) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value
}

function createMetadataSummary(file: File) {
  return [
    `Uploaded asset: ${file.name}`,
    `Type: ${file.type || "unknown"}`,
    `Size: ${file.size} bytes`,
  ].join("\n")
}

function extractLineItems(text: string) {
  const lines = normalizeWhitespace(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  const headings = lines
    .filter((line) =>
      line.length <= 90 &&
      !/^[\-\*\u2022]/.test(line) &&
      !/^\d+[\).\s]/.test(line) &&
      (/^[A-Z0-9][A-Za-z0-9 ,:&/()-]+$/.test(line) || line.endsWith(":")),
    )
    .slice(0, MAX_LIST_ITEMS)

  const bullets = lines
    .filter((line) => /^[\-\*\u2022]/.test(line) || /^\d+[\).\s]/.test(line))
    .map((line) => line.replace(/^[\-\*\u2022]\s*|^\d+[\).\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, MAX_LIST_ITEMS)

  const stats = Array.from(
    new Set(
      [...text.matchAll(/\b(?:\$|€|£)?\d[\d,.]*(?:%|x|k|m|b|ms|s|sec|min|hrs?|days?)?\b/gi)].map(
        (match) => match[0]!,
      ),
    ),
  ).slice(0, MAX_LIST_ITEMS)

  const links = Array.from(
    new Set(
      [...text.matchAll(/https?:\/\/[^\s)]+/gi)].map((match) => match[0]!),
    ),
  ).slice(0, MAX_LIST_ITEMS)

  const paragraphs = normalizeWhitespace(text)
    .split(/\n{2,}/)
    .map((entry) => entry.replace(/\n+/g, " ").trim())
    .filter((entry) => entry.length > 40)
    .slice(0, 4)

  return {
    headings,
    bullets,
    stats,
    links,
    paragraphs,
  }
}

function formatTextContext(file: File, text: string, extras?: string[]) {
  const normalized = normalizeWhitespace(text)
  const signals = extractLineItems(normalized)
  const sections = [
    createMetadataSummary(file),
    extras?.filter(Boolean).join("\n"),
    signals.headings.length ? `Detected headings:\n${signals.headings.map((line) => `- ${line}`).join("\n")}` : "",
    signals.bullets.length ? `Detected bullet points:\n${signals.bullets.map((line) => `- ${line}`).join("\n")}` : "",
    signals.stats.length ? `Detected numbers:\n${signals.stats.map((line) => `- ${line}`).join("\n")}` : "",
    signals.links.length ? `Detected links:\n${signals.links.map((line) => `- ${line}`).join("\n")}` : "",
    signals.paragraphs.length ? `Narrative excerpts:\n${signals.paragraphs.map((line) => `- ${line}`).join("\n")}` : "",
    `Extracted text:\n${clip(normalized) || "No text detected."}`,
  ]
    .filter(Boolean)
    .join("\n\n")

  return {
    name: file.name,
    type: file.type,
    content: sections,
  }
}

function formatTables(tables: string[][][]) {
  return tables
    .slice(0, MAX_TABLES)
    .map((table, index) => {
      const rows = table
        .slice(0, 5)
        .map((row) => row.join(" | "))
        .join("\n")
      return `Table ${index + 1}:\n${rows}`
    })
    .join("\n\n")
}

async function extractPdfContext(file: File, buffer: Buffer) {
  const parser = new PDFParse({ data: buffer })

  try {
    const info = await parser.getInfo()
    const text = await parser.getText({
      first: 8,
      pageJoiner: "--- Page page_number of total_number ---",
    })
    const tables = await parser.getTable({ first: 5 })
    const outline = (info.outline ?? [])
      .flatMap((entry) => [entry.title, ...entry.items.map((item: { title?: string }) => item.title ?? "")])
      .filter(Boolean)
      .slice(0, MAX_LIST_ITEMS)

    return formatTextContext(file, text.text, [
      `Document title: ${info.info?.Title || "Unknown"}`,
      `Author: ${info.info?.Author || "Unknown"}`,
      `Pages: ${text.total}`,
      outline.length ? `Outline:\n${outline.map((item) => `- ${item}`).join("\n")}` : "",
      tables.mergedTables.length ? `Detected tables:\n${formatTables(tables.mergedTables)}` : "",
    ])
  } finally {
    await parser.destroy()
  }
}

async function extractDocxContext(file: File, buffer: Buffer) {
  const parsed = await mammoth.extractRawText({ buffer })
  return formatTextContext(file, parsed.value, [
    parsed.messages.length
      ? `Conversion notes:\n${parsed.messages
          .slice(0, MAX_LIST_ITEMS)
          .map((message) => `- ${message.message}`)
          .join("\n")}`
      : "",
  ])
}

async function extractImageContext(file: File, buffer: Buffer) {
  const resolved = resolveLanguageModel()
  if (!resolved) {
    return null
  }

  try {
    const result = await generateText({
      model: resolved.model,
      maxRetries: 1,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: OCR_PROMPT },
            { type: "image", image: buffer, mediaType: file.type || "image/png" },
          ],
        },
      ],
    })

    const normalized = normalizeWhitespace(result.text)
    if (!normalized) {
      return null
    }

    return formatTextContext(file, normalized, [
      `Image OCR/model extraction: ${resolved.provider}/${resolved.modelName}`,
    ])
  } catch {
    return null
  }
}

function isTextualFile(file: File, lowerName: string) {
  return (
    file.type.startsWith("text/") ||
    file.type.includes("json") ||
    file.type.includes("xml") ||
    lowerName.endsWith(".md") ||
    lowerName.endsWith(".csv") ||
    lowerName.endsWith(".txt")
  )
}

export async function extractFileContext(file: File) {
  const lowerName = file.name.toLowerCase()
  const buffer = Buffer.from(await file.arrayBuffer())

  if (isTextualFile(file, lowerName)) {
    return formatTextContext(file, await file.text())
  }

  try {
    if (file.type === "application/pdf" || lowerName.endsWith(".pdf")) {
      return await extractPdfContext(file, buffer)
    }

    if (
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      lowerName.endsWith(".docx")
    ) {
      return await extractDocxContext(file, buffer)
    }

    if (file.type.startsWith("image/")) {
      const extracted = await extractImageContext(file, buffer)
      if (extracted) {
        return extracted
      }
    }
  } catch {
    return {
      name: file.name,
      type: file.type,
      content: `${createMetadataSummary(file)}\n\nExtraction failed. Use the file as contextual reference and infer likely visual or textual content from its type and filename.`,
    }
  }

  return {
    name: file.name,
    type: file.type,
    content: `${createMetadataSummary(file)}\n\nBinary or rich-media asset uploaded. Treat this as a visual/source asset for the deck. OCR or media transcription is not available for this file type in the current runtime.`,
  }
}
