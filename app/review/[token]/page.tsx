import { notFound } from "next/navigation"

import { ReviewCommentForm } from "@/components/slides/review-comment-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { repository } from "@/lib/repository"
import { formatRelativeDate } from "@/lib/utils"

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const view = await repository.getReviewView(token)

  if (!view) {
    notFound()
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
              Review comments attach to a specific published version so editors can compare, reply, and checkpoint updates cleanly.
            </p>
          </div>
          <Card className="border border-foreground/8 bg-white/90">
            <CardHeader>
              <CardTitle>Leave feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewCommentForm token={token} />
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.86fr_1.14fr]">
          <Card className="border border-foreground/8 bg-white/92">
            <CardHeader>
              <CardTitle>Open comments</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {view.review.comments.map((comment) => (
                <article key={comment.id} className="rounded-[24px] border border-foreground/8 bg-muted/25 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{comment.authorName}</p>
                    <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      {formatRelativeDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{comment.body}</p>
                  {comment.suggestedPrompt ? (
                    <p className="mt-3 rounded-[18px] border border-foreground/8 bg-white px-3 py-3 text-sm text-foreground">
                      Suggestion: {comment.suggestedPrompt}
                    </p>
                  ) : null}
                </article>
              ))}
            </CardContent>
          </Card>

          <Card className="border border-foreground/8 bg-white/92">
            <CardHeader>
              <CardTitle>Version under review</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {view.version.source.slides.map((slide, index) => (
                <article key={slide.id} className="rounded-[24px] border border-foreground/8 bg-muted/20 p-5">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Slide {index + 1} / {slide.kicker}
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight">{slide.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{slide.summary}</p>
                </article>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
