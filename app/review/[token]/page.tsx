import { notFound } from "next/navigation"
import type { ReactNode } from "react"

import {
  applyReviewSuggestionAction,
  updateReviewCommentStatusAction,
  updateReviewStatusAction,
} from "@/app/actions/decks"
import { ReviewCommentForm } from "@/components/slides/review-comment-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { repository } from "@/lib/repository"
import { getCurrentSessionUser } from "@/lib/server-auth"
import type { ReviewComment, SlideBlock, SlideDefinition } from "@/lib/types"
import { formatRelativeDate } from "@/lib/utils"

type SlideSnapshot = Pick<SlideDefinition, "id" | "kicker" | "title" | "summary" | "layout" | "blocks">

type SlideDiff = {
  status: "added" | "changed" | "unchanged"
  previous?: SlideSnapshot
  current: SlideSnapshot
  fieldChanges: Array<{
    label: string
    previous?: string
    current?: string
  }>
  blockChanges: Array<{
    index: number
    status: "added" | "removed" | "changed" | "unchanged"
    previous?: SlideBlock
    current?: SlideBlock
  }>
}

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const view = await repository.getReviewView(token)
  const sessionUser = await getCurrentSessionUser()

  if (!view) {
    notFound()
  }

  const canApplySuggestions = Boolean(sessionUser && sessionUser.teamId === view.deck.teamId && sessionUser.role !== "viewer")
  const commentsBySlide = new Map<string, ReviewComment[]>()
  const repliesByComment = new Map<string, ReviewComment[]>()
  const generalComments: ReviewComment[] = []
  const reviewVersionIndex = view.deck.versions.findIndex((version) => version.id === view.version.id)
  const baseVersion = reviewVersionIndex >= 0 ? view.deck.versions[reviewVersionIndex + 1] ?? null : null
  const diffSummary = buildDiffSummary(baseVersion?.source.slides ?? [], view.version.source.slides)

  for (const comment of view.review.comments) {
    if (comment.parentCommentId) {
      repliesByComment.set(comment.parentCommentId, [...(repliesByComment.get(comment.parentCommentId) ?? []), comment])
      continue
    }

    if (comment.slideId) {
      commentsBySlide.set(comment.slideId, [...(commentsBySlide.get(comment.slideId) ?? []), comment])
      continue
    }

    generalComments.push(comment)
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#fdf8f3_0%,_#f5f8ff_100%)] px-6 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto grid max-w-6xl gap-8">
        <section className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Review</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-foreground">
              {view.review.title}
            </h1>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              Review this published version like a pull request: compare the current version against the previous checkpoint, comment on individual slides, and apply prompt suggestions into fresh checkpoints.
            </p>
          </div>
          <Card className="border border-foreground/8 bg-white/90">
            <CardHeader>
              <CardTitle>Review status</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <p className="text-sm text-muted-foreground">
                Current state: <span className="font-medium text-foreground">{view.review.status.replace("_", " ")}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {(["open", "changes_requested", "approved"] as const).map((status) => (
                  <form
                    key={status}
                    action={async () => {
                      "use server"
                      await updateReviewStatusAction({ token, status })
                    }}
                  >
                    <Button type="submit" variant={view.review.status === status ? "default" : "outline"}>
                      {status.replace("_", " ")}
                    </Button>
                  </form>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.86fr_1.14fr]">
          <div className="grid gap-6">
            <Card className="border border-foreground/8 bg-white/92">
              <CardHeader>
                <CardTitle>Leave feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <ReviewCommentForm
                  token={token}
                  slides={view.version.source.slides.map((slide) => ({
                    id: slide.id,
                    title: slide.title,
                  }))}
                />
              </CardContent>
            </Card>

            <VersionDiffOverview
              currentLabel={view.version.label}
              previousLabel={baseVersion?.label}
              diffSummary={diffSummary}
            />

            <Card className="border border-foreground/8 bg-white/92">
              <CardHeader>
                <CardTitle>General thread</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {generalComments.length ? (
                  generalComments.map((comment) => (
                    <CommentCard
                      key={comment.id}
                      comment={comment}
                      token={token}
                      slides={view.version.source.slides.map((slide) => ({ id: slide.id, title: slide.title }))}
                      repliesByComment={repliesByComment}
                      canApplySuggestions={canApplySuggestions}
                    />
                  ))
                ) : (
                  <EmptyCopy>No deck-level comments yet.</EmptyCopy>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border border-foreground/8 bg-white/92">
            <CardHeader>
              <CardTitle>Version under review</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {view.version.source.slides.map((slide, index) => {
                const slideComments = commentsBySlide.get(slide.id) ?? []
                const diff = diffSummary.bySlideId.get(slide.id) ?? diffSummary.byIndex[index]

                return (
                  <article key={slide.id} className="rounded-[24px] border border-foreground/8 bg-muted/20 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          Slide {index + 1} / {slide.kicker}
                        </p>
                        <h2 className="mt-3 text-2xl font-semibold tracking-tight">{slide.title}</h2>
                        <p className="mt-3 text-sm leading-7 text-muted-foreground">{slide.summary}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="rounded-full border border-foreground/8 bg-white px-3 py-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          {slideComments.length} comments
                        </span>
                        {diff ? <DiffStatusBadge status={diff.status} /> : null}
                      </div>
                    </div>

                    <div className="mt-4 rounded-[20px] border border-foreground/8 bg-white/80 p-4 text-sm leading-7 text-muted-foreground">
                      {slide.blocks.map((block, blockIndex) => (
                        <p key={`${slide.id}-${blockIndex}`}>{summarizeBlock(block)}</p>
                      ))}
                    </div>

                    {diff ? <DiffCard diff={diff} /> : null}

                    <div className="mt-4 grid gap-3">
                      {slideComments.length ? (
                        slideComments.map((comment) => (
                          <CommentCard
                            key={comment.id}
                            comment={comment}
                            token={token}
                            slides={view.version.source.slides.map((item) => ({ id: item.id, title: item.title }))}
                            repliesByComment={repliesByComment}
                            canApplySuggestions={canApplySuggestions}
                          />
                        ))
                      ) : (
                        <EmptyCopy>No comments attached to this slide yet.</EmptyCopy>
                      )}
                    </div>
                  </article>
                )
              })}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}

function VersionDiffOverview({
  currentLabel,
  previousLabel,
  diffSummary,
}: {
  currentLabel: string
  previousLabel?: string
  diffSummary: ReturnType<typeof buildDiffSummary>
}) {
  return (
    <Card className="border border-foreground/8 bg-white/92">
      <CardHeader>
        <CardTitle>Version diff</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <p className="text-sm text-muted-foreground">
          Comparing <span className="font-medium text-foreground">{currentLabel}</span>
          {previousLabel ? (
            <>
              {" "}
              against <span className="font-medium text-foreground">{previousLabel}</span>
            </>
          ) : (
            " against the first captured version"
          )}
          .
        </p>
        <div className="grid gap-3 sm:grid-cols-4">
          <OverviewStat label="Added slides" value={diffSummary.addedSlides} tone="emerald" />
          <OverviewStat label="Changed slides" value={diffSummary.changedSlides} tone="amber" />
          <OverviewStat label="Removed slides" value={diffSummary.removedSlides.length} tone="rose" />
          <OverviewStat label="Changed blocks" value={diffSummary.changedBlocks} tone="sky" />
        </div>
        {diffSummary.removedSlides.length ? (
          <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-900">
            <p className="font-medium">Removed from this version</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {diffSummary.removedSlides.map((slide) => (
                <span key={slide.id} className="rounded-full border border-rose-200 bg-white px-3 py-1 text-xs uppercase tracking-[0.14em]">
                  {slide.title}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function OverviewStat({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: "emerald" | "amber" | "rose" | "sky"
}) {
  const styles = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    rose: "border-rose-200 bg-rose-50 text-rose-900",
    sky: "border-sky-200 bg-sky-50 text-sky-900",
  }

  return (
    <div className={`rounded-[20px] border px-4 py-4 ${styles[tone]}`}>
      <p className="text-xs uppercase tracking-[0.16em]">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  )
}

function CommentCard({
  comment,
  token,
  slides,
  repliesByComment,
  canApplySuggestions,
}: {
  comment: ReviewComment
  token: string
  slides: Array<{ id: string; title: string }>
  repliesByComment: Map<string, ReviewComment[]>
  canApplySuggestions: boolean
}) {
  const replies = repliesByComment.get(comment.id) ?? []

  return (
    <article className="rounded-[24px] border border-foreground/8 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{comment.authorName}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">{comment.status}</p>
        </div>
        <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
          {formatRelativeDate(comment.createdAt)}
        </span>
      </div>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">{comment.body}</p>
      {comment.suggestedPrompt ? (
        <p className="mt-3 rounded-[18px] border border-foreground/8 bg-muted/20 px-3 py-3 text-sm text-foreground">
          Suggested prompt: {comment.suggestedPrompt}
        </p>
      ) : null}
      {comment.appliedAt ? (
        <p className="mt-3 text-sm text-emerald-700">Applied {formatRelativeDate(comment.appliedAt)}.</p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {comment.status !== "resolved" ? (
          <form
            action={async () => {
              "use server"
              await updateReviewCommentStatusAction({
                token,
                commentId: comment.id,
                status: "resolved",
              })
            }}
          >
            <Button type="submit" variant="outline">Resolve</Button>
          </form>
        ) : (
          <form
            action={async () => {
              "use server"
              await updateReviewCommentStatusAction({
                token,
                commentId: comment.id,
                status: comment.suggestedPrompt ? "suggestion" : "comment",
              })
            }}
          >
            <Button type="submit" variant="outline">Re-open</Button>
          </form>
        )}
        {canApplySuggestions && comment.suggestedPrompt ? (
          <form
            action={async () => {
              "use server"
              await applyReviewSuggestionAction({
                token,
                commentId: comment.id,
              })
            }}
          >
            <Button type="submit">Apply suggestion</Button>
          </form>
        ) : null}
      </div>
      {replies.length ? (
        <div className="mt-4 grid gap-3 border-l border-foreground/8 pl-4">
          {replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              token={token}
              slides={slides}
              repliesByComment={repliesByComment}
              canApplySuggestions={canApplySuggestions}
            />
          ))}
        </div>
      ) : null}
      <div className="mt-4 rounded-[20px] border border-foreground/8 bg-muted/15 p-3">
        <ReviewCommentForm token={token} slides={slides} parentCommentId={comment.id} submitLabel="Reply" />
      </div>
    </article>
  )
}

function EmptyCopy({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-[24px] border border-dashed border-foreground/12 bg-muted/20 px-4 py-4 text-sm text-muted-foreground">
      {children}
    </p>
  )
}

function DiffStatusBadge({ status }: { status: SlideDiff["status"] }) {
  const styles = {
    added: "border-emerald-200 bg-emerald-50 text-emerald-800",
    changed: "border-amber-200 bg-amber-50 text-amber-800",
    unchanged: "border-foreground/8 bg-white text-muted-foreground",
  }

  return (
    <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.16em] ${styles[status]}`}>
      {status}
    </span>
  )
}

function DiffCard({ diff }: { diff: SlideDiff }) {
  return (
    <div className="mt-4 grid gap-4 rounded-[20px] border border-dashed border-foreground/12 bg-white/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Version diff</p>
        <DiffStatusBadge status={diff.status} />
      </div>

      {diff.fieldChanges.length ? (
        <div className="grid gap-3">
          {diff.fieldChanges.map((change) => (
            <div key={`${change.label}-${change.current ?? ""}`} className="grid gap-2 rounded-[18px] border border-foreground/8 bg-white p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{change.label}</p>
              <div className="grid gap-3 md:grid-cols-2">
                <DiffValue label="Before" value={change.previous} tone="rose" />
                <DiffValue label="After" value={change.current} tone="emerald" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {diff.blockChanges.length ? (
        <div className="grid gap-3">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Block changes</p>
          {diff.blockChanges.map((change) => (
            <div key={`block-${change.index}`} className="rounded-[18px] border border-foreground/8 bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Block {change.index + 1}</p>
                <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{change.status}</span>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <DiffValue
                  label="Before"
                  value={change.previous ? summarizeBlock(change.previous) : "No previous block"}
                  tone={change.previous ? "rose" : "muted"}
                />
                <DiffValue
                  label="After"
                  value={change.current ? summarizeBlock(change.current) : "Removed"}
                  tone={change.current ? "emerald" : "muted"}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyCopy>No content changes detected on this slide.</EmptyCopy>
      )}
    </div>
  )
}

function DiffValue({
  label,
  value,
  tone,
}: {
  label: string
  value?: string
  tone: "emerald" | "rose" | "muted"
}) {
  const styles = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
    rose: "border-rose-200 bg-rose-50 text-rose-900",
    muted: "border-foreground/8 bg-muted/20 text-muted-foreground",
  }

  return (
    <div className={`rounded-[16px] border px-3 py-3 text-sm ${styles[tone]}`}>
      <p className="text-xs uppercase tracking-[0.16em]">{label}</p>
      <p className="mt-2 whitespace-pre-wrap leading-6">{value || "No value"}</p>
    </div>
  )
}

function summarizeBlock(block: SlideBlock) {
  switch (block.kind) {
    case "paragraph":
      return block.text
    case "bullets":
      return block.items.join(" | ")
    case "stats":
      return block.items.map((item) => `${item.label}: ${item.value} (${item.detail})`).join(" | ")
    case "timeline":
      return block.items.map((item) => `${item.label}: ${item.detail}`).join(" | ")
    case "quote":
      return `${block.quote} — ${block.byline}`
    case "callout":
      return `${block.label}: ${block.value}`
    case "code":
      return `${block.language}\n${block.code}`
  }
}

function buildDiffSummary(previousSlides: SlideSnapshot[], currentSlides: SlideSnapshot[]) {
  const previousById = new Map(previousSlides.map((slide) => [slide.id, slide]))
  const matchedPreviousIds = new Set<string>()
  const diffs = currentSlides.map((current, index) => {
    const previousByIdentity = previousById.get(current.id)
    const previous =
      previousByIdentity ??
      (() => {
        const fallback = previousSlides[index]
        if (fallback && !matchedPreviousIds.has(fallback.id)) {
          return fallback
        }
        return undefined
      })()

    if (previous) {
      matchedPreviousIds.add(previous.id)
    }

    const fieldChanges = [
      { label: "Kicker", previous: previous?.kicker, current: current.kicker },
      { label: "Title", previous: previous?.title, current: current.title },
      { label: "Summary", previous: previous?.summary, current: current.summary },
      { label: "Layout", previous: previous?.layout, current: current.layout },
    ].filter((change) => change.previous !== change.current)

    const blockCount = Math.max(previous?.blocks.length ?? 0, current.blocks.length)
    const blockChanges = Array.from({ length: blockCount }, (_, blockIndex) => {
      const before = previous?.blocks[blockIndex]
      const after = current.blocks[blockIndex]
      const beforeText = before ? summarizeBlock(before) : ""
      const afterText = after ? summarizeBlock(after) : ""
      const status: SlideDiff["blockChanges"][number]["status"] = !before
        ? "added"
        : !after
          ? "removed"
          : before.kind !== after.kind || beforeText !== afterText
            ? "changed"
            : "unchanged"

      return {
        index: blockIndex,
        status,
        previous: before,
        current: after,
      }
    }).filter((change) => change.status !== "unchanged")

    return {
      status: !previous ? "added" : fieldChanges.length || blockChanges.length ? "changed" : "unchanged",
      previous,
      current,
      fieldChanges,
      blockChanges,
    } satisfies SlideDiff
  })

  const removedSlides = previousSlides.filter((slide) => !matchedPreviousIds.has(slide.id))

  return {
    addedSlides: diffs.filter((diff) => diff.status === "added").length,
    changedSlides: diffs.filter((diff) => diff.status === "changed").length,
    changedBlocks: diffs.reduce((sum, diff) => sum + diff.blockChanges.length, 0),
    removedSlides,
    bySlideId: new Map(diffs.map((diff) => [diff.current.id, diff])),
    byIndex: diffs,
  }
}
