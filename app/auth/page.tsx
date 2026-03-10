import { redirect } from "next/navigation"

import { AuthForms } from "@/components/slides/auth-forms"
import { getCurrentSessionUser } from "@/lib/server-auth"

export default async function AuthPage() {
  const sessionUser = await getCurrentSessionUser()

  if (sessionUser) {
    redirect("/app")
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,111,77,0.18),_transparent_30%),linear-gradient(180deg,_#fdf8f3_0%,_#f4f7ff_100%)] px-6 py-10 sm:px-8 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center">
        <div className="grid gap-8">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">Slides auth</p>
            <h1 className="mt-4 text-5xl font-semibold tracking-[-0.05em] text-foreground sm:text-6xl">
              Create a team and start shipping decks.
            </h1>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              Convex-backed sessions, self-hostable application state, and a ready-made demo workspace for the first run.
            </p>
          </div>
          <AuthForms />
        </div>
      </div>
    </main>
  )
}
