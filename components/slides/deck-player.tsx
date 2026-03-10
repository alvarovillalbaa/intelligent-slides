"use client"

import { useEffect, useState, useTransition } from "react"

import { unlockDeckAction } from "@/app/actions/decks"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { DeckRecord, DeckVersion, PublicDeckView } from "@/lib/types"

function slideBlockToText(version: DeckVersion, slideIndex: number) {
  return version.source.slides[slideIndex]?.blocks.map((block) => {
    if (block.kind === "paragraph") {
      return <p key={`${slideIndex}-${block.kind}`}>{block.text}</p>
    }
    if (block.kind === "bullets") {
      return (
        <ul key={`${slideIndex}-${block.kind}`} className="grid gap-2 pl-5">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )
    }
    if (block.kind === "stats") {
      return (
        <div key={`${slideIndex}-${block.kind}`} className="grid gap-3 sm:grid-cols-3">
          {block.items.map((item) => (
            <div key={item.label} className="rounded-[24px] border border-white/12 bg-white/8 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-white/48">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
              <p className="mt-2 text-sm text-white/68">{item.detail}</p>
            </div>
          ))}
        </div>
      )
    }
    if (block.kind === "timeline") {
      return (
        <div key={`${slideIndex}-${block.kind}`} className="grid gap-3">
          {block.items.map((item) => (
            <div key={item.label} className="rounded-[22px] border border-white/12 bg-white/8 p-4">
              <p className="text-sm font-semibold text-white">{item.label}</p>
              <p className="mt-1 text-sm text-white/68">{item.detail}</p>
            </div>
          ))}
        </div>
      )
    }
    if (block.kind === "quote") {
      return (
        <blockquote
          key={`${slideIndex}-${block.kind}`}
          className="rounded-[28px] border-l-4 border-white/70 bg-white/10 px-6 py-5 text-white/84"
        >
          <p className="text-lg">&ldquo;{block.quote}&rdquo;</p>
          <footer className="mt-3 text-sm text-white/62">{block.byline}</footer>
        </blockquote>
      )
    }
    if (block.kind === "callout") {
      return (
        <div key={`${slideIndex}-${block.kind}`} className="rounded-[24px] border border-white/12 bg-white/8 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-white/48">{block.label}</p>
          <p className="mt-2 text-xl font-semibold text-white">{block.value}</p>
        </div>
      )
    }
    return (
      <pre key={`${slideIndex}-${block.kind}`} className="overflow-auto rounded-[24px] bg-black/35 p-4 text-sm text-white/82">
        <code>{block.code}</code>
      </pre>
    )
  })
}

export function PublicAccessGate({ deck }: { deck: DeckRecord }) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <div className="grid min-h-screen place-items-center px-6 py-20">
      <Card className="w-full max-w-lg border border-foreground/8 bg-white/92">
        <CardContent className="grid gap-4 p-8">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Protected deck</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">{deck.title}</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              This deck requires a password before it can be viewed or embedded.
            </p>
          </div>
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter deck password"
          />
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <Button
            type="button"
            onClick={() =>
              startTransition(async () => {
                const result = await unlockDeckAction({ publicId: deck.publicId, password })
                if (!result.ok) {
                  setError(result.error ?? "Incorrect password.")
                  return
                }
                window.location.reload()
              })
            }
            disabled={pending}
          >
            {pending ? "Unlocking..." : "Unlock deck"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export function DeckPlayer({
  view,
  embedded = false,
}: {
  view: PublicDeckView
  embedded?: boolean
}) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [leadState, setLeadState] = useState<"idle" | "submitting" | "submitted">("idle")
  const [leadName, setLeadName] = useState("")
  const [leadEmail, setLeadEmail] = useState("")
  const version = view.version
  const slide = version.source.slides[currentSlide]

  useEffect(() => {
    const visitorId =
      window.localStorage.getItem("slides_visitor_id") ?? crypto.randomUUID()
    window.localStorage.setItem("slides_visitor_id", visitorId)

    void fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        deckId: view.deck.id,
        publicId: view.deck.publicId,
        versionId: version.id,
        type: "view",
        visitorId,
      }),
    })
  }, [version.id, view.deck.id, view.deck.publicId])

  useEffect(() => {
    const visitorId = window.localStorage.getItem("slides_visitor_id")
    if (!visitorId || !slide) {
      return
    }

    void fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        deckId: view.deck.id,
        publicId: view.deck.publicId,
        versionId: version.id,
        slideId: slide.id,
        type: "slide_view",
        visitorId,
      }),
    })
  }, [currentSlide, slide, version.id, view.deck.id, view.deck.publicId])

  async function submitLead() {
    setLeadState("submitting")
    await fetch("/api/leads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        deckId: view.deck.id,
        publicId: view.deck.publicId,
        versionId: version.id,
        payload: {
          name: leadName,
          email: leadEmail,
        },
      }),
    })
    setLeadState("submitted")
  }

  return (
    <div
      className="min-h-screen px-4 py-5 sm:px-8"
      style={{
        background: version.source.theme.gradient,
        color: version.source.theme.foreground,
      }}
    >
      <div className={`mx-auto grid w-full gap-5 ${embedded ? "max-w-5xl" : "max-w-6xl"}`}>
        {!embedded ? (
          <header className="flex flex-wrap items-center justify-between gap-4 rounded-[32px] border border-black/8 bg-white/45 px-5 py-4 backdrop-blur-xl">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-foreground/55">{view.team.name}</p>
              <h1 className="mt-1 text-lg font-semibold">{view.deck.title}</h1>
            </div>
            <div className="flex items-center gap-3 text-sm text-foreground/70">
              <span>{currentSlide + 1}</span>
              <span>/</span>
              <span>{version.source.slides.length}</span>
            </div>
          </header>
        ) : null}

        {view.deck.experiment ? (
          <div className="rounded-[24px] border border-black/8 bg-white/48 px-4 py-3 text-sm text-foreground/70 backdrop-blur-xl">
            Experiment configured: {view.deck.experiment.name}. The editor exposes version candidates and reviewable publish history.
          </div>
        ) : null}

        <section
          className="rounded-[38px] border px-6 py-8 shadow-[0_30px_100px_rgba(15,23,42,0.18)] backdrop-blur-xl sm:px-10 sm:py-10"
          style={{
            background: version.source.theme.card,
            color: version.source.theme.cardForeground,
            borderColor: version.source.theme.border,
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs uppercase tracking-[0.18em] text-foreground/55">
            <span>{slide.kicker}</span>
            <span>{version.source.audience}</span>
          </div>
          <div className="mt-6 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h2
                className="text-4xl font-semibold tracking-[-0.05em] sm:text-6xl"
                style={{ fontFamily: version.source.theme.displayFont }}
              >
                {slide.title}
              </h2>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-foreground/72">{slide.summary}</p>
              <div className="mt-8 grid gap-4 text-base leading-7 text-foreground/78">
                {slideBlockToText(version, currentSlide)}
              </div>
            </div>

            <div className="grid gap-4">
              <div
                className="rounded-[28px] border p-5"
                style={{ borderColor: version.source.theme.border, background: version.source.theme.accentSoft }}
              >
                <p className="text-xs uppercase tracking-[0.18em] text-foreground/56">On-brand system</p>
                <p className="mt-3 text-sm leading-7 text-foreground/76">{version.source.narrative}</p>
              </div>
              <div
                className="rounded-[28px] border p-5"
                style={{ borderColor: version.source.theme.border, background: "rgba(255,255,255,0.35)" }}
              >
                <p className="text-xs uppercase tracking-[0.18em] text-foreground/56">Poll</p>
                <p className="mt-3 text-lg font-semibold">{version.source.poll.question}</p>
                <div className="mt-4 grid gap-2">
                  {version.source.poll.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className="rounded-full border border-black/8 px-4 py-2 text-left text-sm transition-colors hover:bg-black/5"
                      onClick={() =>
                        fetch("/api/events", {
                          method: "POST",
                          headers: { "content-type": "application/json" },
                          body: JSON.stringify({
                            deckId: view.deck.id,
                            publicId: view.deck.publicId,
                            versionId: version.id,
                            type: "poll_vote",
                            value: option,
                            visitorId: window.localStorage.getItem("slides_visitor_id"),
                          }),
                        })
                      }
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[32px] border border-black/8 bg-white/50 p-5 backdrop-blur-xl">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {version.source.slides.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCurrentSlide(index)}
                  className={`rounded-[24px] px-4 py-4 text-left transition-all ${
                    currentSlide === index ? "bg-foreground text-background" : "bg-white/65"
                  }`}
                >
                  <p className="text-xs uppercase tracking-[0.18em] opacity-70">Slide {index + 1}</p>
                  <p className="mt-2 text-sm font-medium">{item.title}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-black/8 bg-white/50 p-5 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.18em] text-foreground/58">CTA + lead capture</p>
            <h3 className="mt-3 text-2xl font-semibold">{version.source.leadCapture.headline}</h3>
            <p className="mt-2 text-sm leading-7 text-foreground/72">
              {version.source.leadCapture.description}
            </p>
            <div className="mt-5 grid gap-3">
              <Input value={leadName} onChange={(event) => setLeadName(event.target.value)} placeholder="Name" />
              <Input value={leadEmail} onChange={(event) => setLeadEmail(event.target.value)} placeholder="Email" />
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={() => {
                    void fetch("/api/events", {
                      method: "POST",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({
                        deckId: view.deck.id,
                        publicId: view.deck.publicId,
                        versionId: version.id,
                        type: "cta_click",
                        visitorId: window.localStorage.getItem("slides_visitor_id"),
                      }),
                    })
                    window.open(version.source.cta.href, "_blank", "noopener,noreferrer")
                  }}
                >
                  {version.source.cta.label}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={submitLead}
                  disabled={leadState === "submitting" || leadState === "submitted"}
                >
                  {leadState === "submitted" ? "Lead captured" : leadState === "submitting" ? "Submitting..." : "Submit lead"}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
