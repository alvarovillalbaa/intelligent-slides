"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState, useTransition } from "react"

import {
  createReviewLinkAction,
  publishDeckVersionAction,
  randomizeDeckThemeAction,
  restoreCheckpointAction,
  saveDeckCheckpointAction,
} from "@/app/actions/decks"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { DeckCheckpoint, DeckRecord, DeckSource, ReviewRequest, SessionUser } from "@/lib/types"
import { formatRelativeDate } from "@/lib/utils"

type StreamEvent =
  | { type: "status"; message: string }
  | { type: "partial"; source: DeckSource }
  | { type: "final"; source: DeckSource }
  | { type: "error"; message: string }

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
      if (line.trim()) {
        yield JSON.parse(line) as StreamEvent
      }
    }
  }
  if (buffer.trim()) {
    yield JSON.parse(buffer) as StreamEvent
  }
}

function readBlockPreview(source: DeckSource) {
  return source.slides.map((slide) => ({
    id: slide.id,
    title: slide.title,
    summary: slide.summary,
    body: slide.blocks
      .map((block) => {
        if (block.kind === "paragraph") {
          return block.text
        }
        if (block.kind === "bullets") {
          return block.items.join("\n")
        }
        if (block.kind === "timeline") {
          return block.items.map((item) => `${item.label}: ${item.detail}`).join("\n")
        }
        if (block.kind === "stats") {
          return block.items.map((item) => `${item.label}: ${item.value}`).join("\n")
        }
        if (block.kind === "quote") {
          return `${block.quote}\n${block.byline}`
        }
        if (block.kind === "callout") {
          return `${block.label}: ${block.value}`
        }
        return block.code
      })
      .join("\n\n"),
  }))
}

function rebuildSourceFromDraft(source: DeckSource, draft: ReturnType<typeof readBlockPreview>) {
  return {
    ...source,
    slides: source.slides.map((slide, index) => ({
      ...slide,
      title: draft[index]?.title ?? slide.title,
      summary: draft[index]?.summary ?? slide.summary,
      blocks: [
        {
          kind: "paragraph" as const,
          text: draft[index]?.body ?? slide.summary,
        },
      ],
    })),
  }
}

export function DeckEditorClient({
  sessionUser,
  deck,
}: {
  sessionUser: SessionUser
  deck: DeckRecord
}) {
  const router = useRouter()
  const [draftSource, setDraftSource] = useState<DeckSource>(deck.source)
  const [slideDrafts, setSlideDrafts] = useState(() => readBlockPreview(deck.source))
  const [prompt, setPrompt] = useState("Rewrite this deck with stronger proof and more contrast between problem and solution.")
  const [checkpointTitle, setCheckpointTitle] = useState("Editor checkpoint")
  const [publishLabel, setPublishLabel] = useState(`Version ${String.fromCharCode(65 + deck.versions.length)}`)
  const [publishPassword, setPublishPassword] = useState("")
  const [reviewTitle, setReviewTitle] = useState("Leadership review")
  const [activity, setActivity] = useState("Draft is in sync with the latest checkpoint.")
  const [reviewLink, setReviewLink] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [streaming, setStreaming] = useState(false)

  const currentVersion = useMemo(
    () => deck.versions.find((version) => version.id === deck.publishedVersionId) ?? deck.versions[0],
    [deck.publishedVersionId, deck.versions],
  )

  function updateManualDraft() {
    const rebuilt = rebuildSourceFromDraft(draftSource, slideDrafts)
    setDraftSource(rebuilt)
    setActivity("Manual edits staged locally. Save a checkpoint when ready.")
    return rebuilt
  }

  async function handlePromptRewrite() {
    setStreaming(true)
    setActivity("Streaming rewrite...")
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        generationInput: {
          inputKind: "paste",
          rawText: JSON.stringify(draftSource),
          prompt,
          files: [],
          themeMode: deck.themeMode,
        },
        existingSource: draftSource,
      }),
    })

    if (!response.ok) {
      setStreaming(false)
      setActivity("Rewrite failed.")
      return
    }

    for await (const event of streamResponse(response)) {
      if (event.type === "status") {
        setActivity(event.message)
      }
      if (event.type === "partial") {
        setDraftSource(event.source)
        setSlideDrafts(readBlockPreview(event.source))
      }
      if (event.type === "final") {
        setDraftSource(event.source)
        setSlideDrafts(readBlockPreview(event.source))
        setActivity("Rewrite complete. Review the new draft and save a checkpoint.")
      }
    }

    setStreaming(false)
  }

  function handleSaveCheckpoint() {
    const nextSource = updateManualDraft()
    startTransition(async () => {
      await saveDeckCheckpointAction({
        deckId: deck.id,
        prompt,
        title: checkpointTitle,
        source: nextSource,
      })
      router.refresh()
    })
  }

  function handlePublish() {
    const nextSource = updateManualDraft()
    startTransition(async () => {
      await publishDeckVersionAction({
        deckId: deck.id,
        label: publishLabel,
        source: nextSource,
        password: publishPassword || undefined,
      })
      router.refresh()
    })
  }

  function handleRandomizeTheme() {
    startTransition(async () => {
      const remixed = await randomizeDeckThemeAction(deck.id)
      setDraftSource(remixed)
      setSlideDrafts(readBlockPreview(remixed))
      setActivity("Theme remixed. Save a checkpoint if you want to keep it.")
      router.refresh()
    })
  }

  function handleRestore(checkpoint: DeckCheckpoint) {
    startTransition(async () => {
      await restoreCheckpointAction(deck.id, checkpoint.id)
      setDraftSource(checkpoint.source)
      setSlideDrafts(readBlockPreview(checkpoint.source))
      setActivity(`Restored ${checkpoint.title}.`)
      router.refresh()
    })
  }

  function handleReviewLink(versionId: string) {
    startTransition(async () => {
      const review = await createReviewLinkAction({
        deckId: deck.id,
        versionId,
        title: reviewTitle,
      })
      setReviewLink(review.reviewUrl)
      router.refresh()
    })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.78fr_1.12fr_0.82fr]">
      <Card className="border border-foreground/8 bg-white/88">
        <CardHeader>
          <CardTitle>Prompt + source control</CardTitle>
          <CardDescription>
            Edit by prompt, then lock changes into checkpoints and published versions.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Rewrite prompt</label>
            <Textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} className="min-h-28" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Checkpoint title</label>
            <Input value={checkpointTitle} onChange={(event) => setCheckpointTitle(event.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={handlePromptRewrite} disabled={streaming}>
              {streaming ? "Streaming..." : "Rewrite live"}
            </Button>
            <Button type="button" variant="outline" onClick={handleRandomizeTheme} disabled={pending}>
              Surprise me
            </Button>
            <Button type="button" variant="outline" onClick={handleSaveCheckpoint} disabled={pending}>
              Save checkpoint
            </Button>
          </div>

          <div className="rounded-[24px] border border-foreground/8 bg-muted/35 p-4">
            <p className="text-sm font-medium">Publishing</p>
            <div className="mt-3 grid gap-3">
              <Input value={publishLabel} onChange={(event) => setPublishLabel(event.target.value)} />
              <Input
                type="password"
                placeholder="Optional password"
                value={publishPassword}
                onChange={(event) => setPublishPassword(event.target.value)}
              />
              <Button type="button" onClick={handlePublish} disabled={pending}>
                Publish version
              </Button>
            </div>
          </div>

          <div className="rounded-[24px] border border-foreground/8 bg-[#102114] p-4 text-white">
            <p className="text-sm font-medium text-white">Review links</p>
            <div className="mt-3 grid gap-3">
              <Input
                value={reviewTitle}
                onChange={(event) => setReviewTitle(event.target.value)}
                className="border-white/12 bg-white/8 text-white placeholder:text-white/36"
              />
              <Button
                type="button"
                className="bg-white text-[#102114] hover:bg-white/90"
                onClick={() => currentVersion && handleReviewLink(currentVersion.id)}
                disabled={pending || !currentVersion}
              >
                Generate review link
              </Button>
              {reviewLink ? (
                <a href={reviewLink} target="_blank" rel="noreferrer" className="text-sm text-white/78 underline">
                  {reviewLink}
                </a>
              ) : null}
            </div>
          </div>

          <p className="rounded-[24px] border border-foreground/8 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            {activity}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        <Card className="overflow-hidden border border-[#102114]/10 bg-[#0f1724] text-white">
          <CardHeader className="border-b border-white/10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-white">{draftSource.title}</CardTitle>
                <CardDescription className="text-white/62">{draftSource.summary}</CardDescription>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-white/55">
                {sessionUser.role}
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 p-6">
            <div className="grid gap-4">
              {slideDrafts.map((slide, index) => (
                <article key={slide.id} className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-white/45">
                    <span>{draftSource.slides[index]?.kicker}</span>
                    <span>Slide {index + 1}</span>
                  </div>
                  <Input
                    value={slide.title}
                    onChange={(event) =>
                      setSlideDrafts((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, title: event.target.value } : item,
                        ),
                      )
                    }
                    className="border-white/12 bg-white/6 text-lg text-white placeholder:text-white/40"
                  />
                  <Textarea
                    value={slide.summary}
                    onChange={(event) =>
                      setSlideDrafts((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, summary: event.target.value } : item,
                        ),
                      )
                    }
                    className="mt-3 min-h-20 border-white/12 bg-white/6 text-white placeholder:text-white/40"
                  />
                  <Textarea
                    value={slide.body}
                    onChange={(event) =>
                      setSlideDrafts((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, body: event.target.value } : item,
                        ),
                      )
                    }
                    className="mt-3 min-h-36 border-white/12 bg-white/6 text-white placeholder:text-white/40"
                  />
                </article>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card className="border border-foreground/8 bg-white/88">
          <CardHeader>
            <CardTitle>History</CardTitle>
            <CardDescription>Checkpoint and version history with review-ready labels.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {deck.checkpoints.map((checkpoint) => (
              <button
                key={checkpoint.id}
                type="button"
                onClick={() => handleRestore(checkpoint)}
                className="rounded-[24px] border border-foreground/8 bg-muted/20 px-4 py-4 text-left transition-colors hover:bg-muted/40"
              >
                <p className="text-sm font-medium text-foreground">{checkpoint.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{checkpoint.summary}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  {formatRelativeDate(checkpoint.createdAt)}
                </p>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-foreground/8 bg-white/88">
          <CardHeader>
            <CardTitle>Published variants</CardTitle>
            <CardDescription>A/B test candidates and version routing inputs.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {deck.versions.map((version) => (
              <article
                key={version.id}
                className="rounded-[24px] border border-foreground/8 bg-white px-4 py-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{version.label}</p>
                  <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    {formatRelativeDate(version.createdAt)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{version.source.title}</p>
              </article>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-foreground/8 bg-white/88">
          <CardHeader>
            <CardTitle>Analytics + review</CardTitle>
            <CardDescription>Public view performance and active review threads.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[24px] border border-foreground/8 bg-muted/25 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Views</p>
                <p className="mt-2 text-3xl font-semibold">{deck.analytics.views}</p>
              </div>
              <div className="rounded-[24px] border border-foreground/8 bg-muted/25 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Leads</p>
                <p className="mt-2 text-3xl font-semibold">{deck.analytics.leads}</p>
              </div>
            </div>
            <div className="grid gap-3">
              {deck.reviewRequests.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ReviewCard({ review }: { review: ReviewRequest }) {
  return (
    <article className="rounded-[24px] border border-foreground/8 bg-muted/25 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{review.title}</p>
        <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{review.status.replace("_", " ")}</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {review.comments.length} comments, updated {formatRelativeDate(review.createdAt)}.
      </p>
    </article>
  )
}
