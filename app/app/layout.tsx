import Link from "next/link"

import { signOutAction } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { requireSessionUser } from "@/lib/server-auth"

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const sessionUser = await requireSessionUser()

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#fdf8f3_0%,_#f5f8ff_100%)]">
      <div className="mx-auto grid min-h-screen max-w-[1600px] gap-6 px-4 py-4 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-6">
        <aside className="rounded-[32px] border border-foreground/8 bg-[#102114] p-5 text-white shadow-[0_24px_80px_rgba(16,33,20,0.18)]">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-full bg-white text-sm font-semibold text-[#102114]">
              SL
            </div>
            <div>
              <p className="text-sm font-semibold">{sessionUser.teamName}</p>
              <p className="text-xs text-white/58">{sessionUser.email}</p>
            </div>
          </div>
          <nav className="mt-8 grid gap-2">
            <Link
              href="/app"
              className="rounded-full px-4 py-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              Dashboard
            </Link>
            <Link
              href={`/app/workspaces/${sessionUser.workspaceSlug}`}
              className="rounded-full px-4 py-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              Workspace
            </Link>
            <Link
              href={`/d/${sessionUser.teamSlug}/slides-operating-system`}
              className="rounded-full px-4 py-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              Public sample
            </Link>
          </nav>

          <div className="mt-8 rounded-[28px] border border-white/10 bg-white/6 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-white/48">Team model</p>
            <p className="mt-3 text-lg font-semibold text-white">{sessionUser.role}</p>
            <p className="mt-2 text-sm leading-7 text-white/66">
              Teams own workspaces, decks, published versions, review links, and public analytics.
            </p>
          </div>

          <form action={signOutAction} className="mt-8">
            <Button type="submit" variant="outline" className="w-full border-white/14 bg-white/8 text-white hover:bg-white/14">
              Sign out
            </Button>
          </form>
        </aside>

        <div className="rounded-[32px] border border-foreground/8 bg-white/74 p-5 shadow-[0_20px_90px_rgba(15,23,42,0.05)] backdrop-blur-xl sm:p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
