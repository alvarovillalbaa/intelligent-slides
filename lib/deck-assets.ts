import { nanoid } from "nanoid"

import type { AssetKind, AssetRecord, DeckSource, GenerationInput } from "@/lib/types"

export interface StoredInputAsset {
  fileName: string
  url: string
  storageKey: string
  contentType: string
  sizeBytes: number
}

function createAsset(kind: AssetKind, title: string, description: string, url: string): AssetRecord {
  return {
    id: nanoid(8),
    kind,
    title,
    description,
    url,
  }
}

export function buildInitialDeckAssets(input: GenerationInput, source: DeckSource) {
  const assets: AssetRecord[] = []
  const seen = new Set<string>()

  function push(kind: AssetKind, title: string, description: string, url?: string) {
    if (!url || seen.has(url)) {
      return
    }

    seen.add(url)
    assets.push(createAsset(kind, title, description, url))
  }

  if (source.brand.sourceUrl) {
    push("document", "Source URL", "Original page used to shape the deck.", source.brand.sourceUrl)
  }

  for (const file of input.files) {
    push("document", file.name, "Uploaded as generation context.", file.name)
  }

  for (const logo of source.brand.brandKit?.logos ?? []) {
    push("image", "Brand logo", "Captured from the source brand kit.", logo)
  }

  for (const imageUrl of source.brand.brandKit?.imagery ?? []) {
    push("image", "Brand image", "Reusable imagery discovered during brand extraction.", imageUrl)
  }

  return assets
}

export function buildStoredInputAssets(items: StoredInputAsset[]) {
  return items.map((item) => ({
    id: nanoid(8),
    kind: "document" as const,
    title: item.fileName,
    description: "Uploaded as generation context.",
    url: item.url,
    storageKey: item.storageKey,
    contentType: item.contentType,
    sizeBytes: item.sizeBytes,
  }))
}
