import { NextResponse } from "next/server"

import { extractFileContext } from "@/lib/file-context"
import { getCurrentSessionUser } from "@/lib/server-auth"

export async function POST(request: Request) {
  const sessionUser = await getCurrentSessionUser()
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const formData = await request.formData()
  const files = formData.getAll("files").filter((value): value is File => value instanceof File)

  if (!files.length) {
    return NextResponse.json({ error: "No files uploaded." }, { status: 400 })
  }

  const extracted = await Promise.all(files.map((file) => extractFileContext(file)))
  return NextResponse.json({ files: extracted })
}
