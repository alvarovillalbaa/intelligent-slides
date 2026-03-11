import { promises as fs } from "fs"
import path from "path"

import { nanoid } from "nanoid"

import { slugify } from "@/lib/utils"

const storageRoot = path.join(process.cwd(), ".slides-storage")

function toPosixSegments(value: string) {
  return value.split("/").filter(Boolean).map((segment) => slugify(segment) || "file")
}

function joinStorageKey(...segments: string[]) {
  return segments
    .flatMap((segment, index) => {
      if (index === segments.length - 1 && path.extname(segment)) {
        const ext = path.extname(segment)
        const name = slugify(path.basename(segment, ext)) || "file"
        return `${name}${ext.toLowerCase()}`
      }

      return toPosixSegments(segment)
    })
    .join("/")
}

async function ensureParentDir(storageKey: string) {
  await fs.mkdir(path.join(storageRoot, path.dirname(storageKey)), { recursive: true })
}

function getAbsolutePath(storageKey: string) {
  return path.join(storageRoot, storageKey)
}

function getExtension(fileName: string, fallback = ".bin") {
  const ext = path.extname(fileName)
  return ext ? ext.toLowerCase() : fallback
}

export function getStoredFileUrl(storageKey: string) {
  return `/files/${storageKey}`
}

export function getPublishedArtifactUrl(publicId: string, versionId: string) {
  return `/published/${publicId}/${versionId}`
}

export async function writeStoredBuffer(input: {
  namespace: string[]
  fileName: string
  content: Buffer
  contentType?: string
}) {
  const ext = getExtension(input.fileName)
  const baseName = slugify(path.basename(input.fileName, ext)) || "asset"
  const storageKey = joinStorageKey(...input.namespace, `${baseName}-${nanoid(6)}${ext}`)

  await ensureParentDir(storageKey)
  await fs.writeFile(getAbsolutePath(storageKey), input.content)

  return {
    storageKey,
    url: getStoredFileUrl(storageKey),
    contentType: input.contentType ?? "application/octet-stream",
    sizeBytes: input.content.byteLength,
  }
}

export async function writeStoredText(input: {
  namespace: string[]
  fileName: string
  content: string
  contentType?: string
}) {
  return writeStoredBuffer({
    namespace: input.namespace,
    fileName: input.fileName,
    content: Buffer.from(input.content, "utf8"),
    contentType: input.contentType,
  })
}

export async function writePublishedArtifact(input: {
  publicId: string
  versionId: string
  html: string
  metadata: Record<string, unknown>
}) {
  const artifactStorageKey = joinStorageKey("published", input.publicId, input.versionId, "index.html")
  const manifestStorageKey = joinStorageKey("published", input.publicId, input.versionId, "manifest.json")

  await ensureParentDir(artifactStorageKey)
  await fs.writeFile(getAbsolutePath(artifactStorageKey), input.html, "utf8")
  await fs.writeFile(getAbsolutePath(manifestStorageKey), JSON.stringify(input.metadata, null, 2), "utf8")

  return {
    artifactStorageKey,
    manifestStorageKey,
    artifactUrl: getPublishedArtifactUrl(input.publicId, input.versionId),
  }
}

export async function readStoredFile(storageKey: string) {
  try {
    const content = await fs.readFile(getAbsolutePath(storageKey))
    return content
  } catch {
    return null
  }
}

export async function readPublishedArtifact(publicId: string, versionId: string) {
  const artifactStorageKey = joinStorageKey("published", publicId, versionId, "index.html")
  return readStoredFile(artifactStorageKey)
}
