"use client"

import { useTransition } from "react"

import { addReviewCommentAction } from "@/app/actions/decks"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export function ReviewCommentForm({ token }: { token: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          await addReviewCommentAction({
            token,
            authorName: String(formData.get("authorName") ?? "Reviewer"),
            body: String(formData.get("body") ?? ""),
          })
        })
      }
      className="grid gap-3"
    >
      <input
        name="authorName"
        placeholder="Reviewer name"
        className="h-11 rounded-full border border-foreground/10 bg-white px-4 text-sm outline-none"
      />
      <Textarea name="body" placeholder="Leave a review note or change request..." className="min-h-28" />
      <Button type="submit" disabled={pending}>
        {pending ? "Posting..." : "Post review comment"}
      </Button>
    </form>
  )
}
