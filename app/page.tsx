import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const featureGroups = [
  {
    label: "Generation",
    title: "Upload notes, URLs, and files into one narrative engine.",
    body: "Streaming preview, prompt-based rewrites, and a structured deck source that stays editable after generation.",
  },
  {
    label: "Publishing",
    title: "Ship hosted slide URLs, embeds, variants, and password gates.",
    body: "Every publish becomes a standalone HTML artifact with SEO metadata, social previews, and CTA-ready closing states.",
  },
  {
    label: "Collaboration",
    title: "Treat deck review more like GitHub than chat threads.",
    body: "Checkpoint history, review links, change suggestions, comments by version, and analytics tied to public distribution.",
  },
]

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,111,77,0.22),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(124,211,255,0.2),_transparent_28%),linear-gradient(180deg,_#fdf8f3_0%,_#f5efe8_44%,_#f5f8ff_100%)] text-foreground">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:72px_72px] opacity-30" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between gap-4 rounded-full border border-foreground/8 bg-white/70 px-5 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-full bg-[#102114] text-sm font-semibold text-white">
              SL
            </div>
            <div>
              <p className="text-sm font-semibold">Slides</p>
              <p className="text-xs text-muted-foreground">Deck operating system for modern teams</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button render={<Link href="/d/northstar-labs/slides-operating-system" />} variant="ghost">
              View sample deck
            </Button>
            <Button render={<Link href="/auth" />} size="lg">
              Open app
            </Button>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.08fr_0.92fr] lg:py-24">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.26em] text-muted-foreground">
              Beautiful UI. Simple UX. Powerful deck infrastructure.
            </p>
            <h1 className="mt-6 text-5xl font-semibold tracking-[-0.07em] text-[#161513] sm:text-7xl lg:text-[92px]">
              Turn raw content into a code-based deck that can actually ship.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
              Slides combines generation, editing, brand systems, review, publishing, analytics, CTA blocks, lead capture, and experiments in one product surface built for teams.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button render={<Link href="/auth" />} size="lg">
                Create your team
              </Button>
              <Button render={<Link href="/d/northstar-labs/slides-operating-system" />} size="lg" variant="outline">
                Browse a live deck
              </Button>
            </div>
          </div>

          <Card className="border border-foreground/8 bg-[#0f1724] text-white shadow-[0_40px_140px_rgba(15,23,42,0.2)]">
            <CardContent className="grid gap-5 p-6 sm:p-8">
              <div className="rounded-[28px] border border-white/10 bg-white/6 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-white/50">Input</p>
                <p className="mt-3 text-2xl font-semibold">Paste notes, drop files, or point to a URL.</p>
                <p className="mt-2 text-sm leading-7 text-white/68">
                  Fire source material into one intake surface, then stream the first preview before the full deck is complete.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[26px] border border-white/10 bg-white/6 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/48">Editor</p>
                  <p className="mt-3 text-lg font-semibold">Prompt + direct edit</p>
                  <p className="mt-2 text-sm text-white/68">
                    Rewrite by instruction or modify slides directly without losing structure.
                  </p>
                </div>
                <div className="rounded-[26px] border border-white/10 bg-white/6 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/48">Publish</p>
                  <p className="mt-3 text-lg font-semibold">Hosted slug + embed</p>
                  <p className="mt-2 text-sm text-white/68">
                    Publish every version to a shareable deck URL or iframe-ready surface.
                  </p>
                </div>
              </div>
              <div className="rounded-[28px] border border-[#7cd3ff]/20 bg-[#7cd3ff]/10 p-5 text-white">
                <p className="text-xs uppercase tracking-[0.18em] text-white/48">Growth loop</p>
                <p className="mt-3 text-2xl font-semibold">Decks that collect feedback, leads, and analytics by default.</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5 pb-16 md:grid-cols-3">
          {featureGroups.map((feature) => (
            <Card key={feature.label} className="border border-foreground/8 bg-white/74 shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
              <CardContent className="p-6">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{feature.label}</p>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">{feature.title}</h2>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">{feature.body}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </main>
  )
}
