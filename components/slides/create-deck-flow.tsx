"use client"

import { useRouter } from "next/navigation"
import { useRef, useState, useTransition } from "react"

import { createDeckFromGeneratedSourceAction } from "@/app/actions/decks"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { DeckSource, GenerationInput } from "@/lib/types"
import { formatRelativeDate } from "@/lib/utils"

type StreamEvent =
  | { type: "status"; message: string }
  | { type: "partial"; source: DeckSource }
  | { type: "final"; source: DeckSource; provider: string; modelName: string }
  | { type: "error"; message: string }

async function readFiles(files: FileList | null) {
  if (!files) {
    return []
  }

  const formData = new FormData()
  for (const file of Array.from(files)) {
    formData.append("files", file)
  }

  const response = await fetch("/api/file-context", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    return Promise.all(
      Array.from(files).map(async (file) => ({
        name: file.name,
        type: file.type,
        content: await file.text().catch(() => `Uploaded asset: ${file.name}`),
      })),
    )
  }

  const payload = (await response.json()) as {
    files: Array<{
      name: string
      type: string
      content: string
    }>
  }

  return payload.files
}

async function* streamResponse(response: Response) {
  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  if (!reader) {
    return
  }

  let buffer = ""
  while (true) {
    const { value, done } = await reader.read()
    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""

    for (const line of lines) {
      if (!line.trim()) {
        continue
      }

      yield JSON.parse(line) as StreamEvent
    }
  }

  if (buffer.trim()) {
    yield JSON.parse(buffer) as StreamEvent
  }
}

export function CreateDeckFlow({
  workspaceId,
  workspaceSlug,
}: {
  workspaceId: string
  workspaceSlug: string
}) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [rawText, setRawText] = useState("")
  const [sourceUrl, setSourceUrl] = useState("")
  const [prompt, setPrompt] = useState("Turn this content into a clean, high-conviction launch deck.")
  const [themeMode, setThemeMode] = useState<GenerationInput["themeMode"]>("brand")
  const [attachedFiles, setAttachedFiles] = useState<GenerationInput["files"]>([])
  const [activity, setActivity] = useState("Ready to generate.")
  const [generatedSource, setGeneratedSource] = useState<DeckSource | null>(null)
  const [providerLabel, setProviderLabel] = useState("Demo heuristic")
  const [streaming, setStreaming] = useState(false)
  const [pending, startTransition] = useTransition()

  async function handleGenerate() {
    setStreaming(true)
    setGeneratedSource(null)
    setProviderLabel("Warming up...")

    const payload: GenerationInput = {
      inputKind: sourceUrl ? "url" : attachedFiles.length ? "files" : "paste",
      rawText,
      sourceUrl: sourceUrl || undefined,
      prompt,
      files: attachedFiles,
      themeMode,
    }

    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        generationInput: payload,
      }),
    })

    if (!response.ok) {
      setActivity("Generation failed.")
      setStreaming(false)
      return
    }

    for await (const event of streamResponse(response)) {
      if (event.type === "status") {
        setActivity(event.message)
      }

      if (event.type === "partial") {
        setGeneratedSource(event.source)
      }

      if (event.type === "final") {
        setGeneratedSource(event.source)
        setProviderLabel(`${event.provider} / ${event.modelName}`)
        setActivity("Draft ready. Save it as a deck or keep iterating.")
      }

      if (event.type === "error") {
        setActivity(event.message)
      }
    }

    setStreaming(false)
  }

  function handleSaveDraft() {
    if (!generatedSource) {
      return
    }

    startTransition(async () => {
      const result = await createDeckFromGeneratedSourceAction({
        workspaceId,
        generationInput: {
          inputKind: sourceUrl ? "url" : attachedFiles.length ? "files" : "paste",
          rawText,
          sourceUrl: sourceUrl || undefined,
          prompt,
          files: attachedFiles,
          themeMode,
        },
        source: generatedSource,
      })
      router.push(`/app/workspaces/${workspaceSlug}/decks/${result.deckId}`)
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <Card className="border border-foreground/8 bg-white/90">
        <CardHeader>
          <CardTitle>Generate a deck</CardTitle>
          <CardDescription>
            Paste notes, point to a URL, or add files. The preview streams as the draft is assembled.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="deck-notes">
              Paste source content
            </label>
            <Textarea
              id="deck-notes"
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
              placeholder="Paste your memo, product launch notes, blog outline, or sales narrative here..."
              className="min-h-44"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="deck-url">
              Source URL
            </label>
            <Input
              id="deck-url"
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
              placeholder="https://your-site.com/launch-post"
            />
          </div>

          <div className="grid gap-3 rounded-[28px] border border-dashed border-foreground/12 bg-muted/35 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Files</p>
                <p className="text-sm text-muted-foreground">
                  PDFs, DOCX files, text docs, and images are parsed into deck-ready context before generation.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileRef.current?.click()}
              >
                Add files
              </Button>
            </div>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              multiple
              onChange={async (event) => setAttachedFiles(await readFiles(event.target.files))}
            />
            {attachedFiles.length ? (
              <div className="flex flex-wrap gap-2">
                {attachedFiles.map((file) => (
                  <span
                    key={file.name}
                    className="rounded-full border border-foreground/10 bg-white px-3 py-1 text-xs font-medium"
                  >
                    {file.name}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="deck-prompt">
              Creative direction
            </label>
            <Textarea
              id="deck-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Describe audience, tone, CTA, or any slides you need."
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(["brand", "remix"] as const).map((mode) => (
              <Button
                key={mode}
                type="button"
                variant={themeMode === mode ? "default" : "outline"}
                onClick={() => setThemeMode(mode)}
              >
                {mode === "brand" ? "On-brand theme" : "Randomized remix"}
              </Button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 rounded-[28px] border border-foreground/8 bg-muted/30 px-4 py-3">
            <div>
              <p className="text-sm font-medium">{activity}</p>
              <p className="text-sm text-muted-foreground">
                Provider: {providerLabel}
              </p>
            </div>
            <Button type="button" size="lg" onClick={handleGenerate} disabled={streaming}>
              {streaming ? "Streaming preview..." : "Generate live preview"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border border-[#102114]/10 bg-[#0f1724] text-white">
        <CardHeader className="border-b border-white/10">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-white">Streaming preview</CardTitle>
              <CardDescription className="text-white/60">
                Review the structure before saving it into the workspace.
              </CardDescription>
            </div>
            {generatedSource ? (
              <Button
                type="button"
                size="lg"
                className="bg-white text-[#0f1724] hover:bg-white/90"
                disabled={pending}
                onClick={handleSaveDraft}
              >
                {pending ? "Creating deck..." : "Create draft deck"}
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="grid gap-5 p-6">
          {generatedSource ? (
            <>
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-white/50">
                  {generatedSource.brand.companyName} / {generatedSource.audience}
                </p>
                <h3 className="mt-3 font-[var(--font-sans)] text-3xl font-semibold tracking-tight">
                  {generatedSource.title}
                </h3>
                <p className="mt-3 max-w-2xl text-white/72">{generatedSource.summary}</p>
              </div>
              <div className="grid gap-3">
                {generatedSource.slides.map((slide, index) => (
                  <article
                    key={slide.id}
                    className="rounded-[24px] border border-white/10 bg-white/5 p-5"
                  >
                    <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-white/45">
                      <span>{slide.kicker}</span>
                      <span>Slide {index + 1}</span>
                    </div>
                    <h4 className="mt-3 text-xl font-semibold text-white">{slide.title}</h4>
                    <p className="mt-2 text-sm text-white/66">{slide.summary}</p>
                    <ul className="mt-4 grid gap-2 text-sm text-white/76">
                      {slide.blocks.slice(0, 2).map((block, blockIndex) => (
                        <li key={`${slide.id}-${blockIndex}`} className="rounded-2xl bg-white/5 px-3 py-2">
                          {block.kind === "paragraph" && block.text}
                          {block.kind === "bullets" && block.items.join(" | ")}
                          {block.kind === "stats" && block.items.map((item) => `${item.label}: ${item.value}`).join(" | ")}
                          {block.kind === "timeline" && block.items.map((item) => `${item.label}`).join(" -> ")}
                          {block.kind === "quote" && `"${block.quote}"`}
                          {block.kind === "callout" && `${block.label}: ${block.value}`}
                          {block.kind === "code" && `${block.language} code block`}
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-white/64">
                Draft updated {formatRelativeDate(Date.now())}. Workspace slug: {workspaceSlug}
              </div>
            </>
          ) : (
            <div className="grid min-h-[420px] place-items-center rounded-[28px] border border-dashed border-white/12 bg-white/4 p-8 text-center text-white/58">
              Generate a draft to preview slide structure, CTA, and theme direction.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
