import type { DeckRecord, DeckVersion } from "@/lib/types"

function hashSeed(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 1000
  }
  return hash
}

export function assignExperimentVersion(deck: DeckRecord, visitorId: string) {
  const experiment = deck.experiment
  if (!experiment || experiment.status !== "running" || experiment.variants.length === 0) {
    return null
  }

  const totalWeight = experiment.variants.reduce((sum, variant) => sum + Math.max(1, variant.weight), 0)
  const bucket = hashSeed(`${experiment.id}:${visitorId}`) % totalWeight
  let cursor = 0

  for (const variant of experiment.variants) {
    cursor += Math.max(1, variant.weight)
    if (bucket < cursor) {
      const version = deck.versions.find((item) => item.id === variant.versionId)
      if (!version) {
        return null
      }

      return {
        label: variant.label,
        version,
      } satisfies {
        label: string
        version: DeckVersion
      }
    }
  }

  return null
}
