"use client"

import { useState, useTransition } from "react"

import { addReviewCommentAction } from "@/app/actions/decks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export function ReviewCommentForm({
  token,
  slides,
  parentCommentId,
  submitLabel,
}: {
  token: string
  slides: Array<{ id: string; title: string }>
  parentCommentId?: string
  submitLabel?: string
}) {
  const [pending, startTransition] = useTransition()
  const [commentType, setCommentType] = useState<"comment" | "suggestion">("comment")

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          await addReviewCommentAction({
            token,
            authorName: String(formData.get("authorName") ?? "Reviewer"),
            body: String(formData.get("body") ?? ""),
            slideId: String(formData.get("slideId") ?? "") || undefined,
            status: commentType,
            parentCommentId,
            suggestedPrompt:
              commentType === "suggestion"
                ? String(formData.get("suggestedPrompt") ?? "") || undefined
                : undefined,
          })
        })
      }
      className="grid gap-3"
    >
      {parentCommentId ? <input type="hidden" name="parentCommentId" value={parentCommentId} /> : null}
      <Input name="authorName" placeholder="Reviewer name" />
      <select
        value={commentType}
        onChange={(event) => setCommentType(event.target.value as "comment" | "suggestion")}
        className="h-11 rounded-full border border-foreground/10 bg-white px-4 text-sm outline-none"
      >
        <option value="comment">Comment</option>
        <option value="suggestion">Suggestion</option>
      </select>
      <select name="slideId" className="h-11 rounded-full border border-foreground/10 bg-white px-4 text-sm outline-none">
        <option value="">General review</option>
        {slides.map((slide, index) => (
          <option key={slide.id} value={slide.id}>
            Slide {index + 1}: {slide.title}
          </option>
        ))}
      </select>
      <Textarea name="body" placeholder="Leave a review note or change request..." className="min-h-28" />
      {commentType === "suggestion" ? (
        <Textarea
          name="suggestedPrompt"
          placeholder="Optional suggested prompt the editor can use to implement this change."
          className="min-h-24"
        />
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Posting..." : submitLabel ?? (commentType === "suggestion" ? "Post suggestion" : "Post comment")}
      </Button>
    </form>
  )
}
