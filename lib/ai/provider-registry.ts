import { anthropic } from "@ai-sdk/anthropic"
import { google } from "@ai-sdk/google"
import { openai } from "@ai-sdk/openai"

export type ProviderKey = "openai" | "anthropic" | "google"

const PROVIDER_MODEL_ENV: Record<ProviderKey, string> = {
  openai: "OPENAI_MODEL",
  anthropic: "ANTHROPIC_MODEL",
  google: "GOOGLE_MODEL",
}

const PROVIDER_KEY_ENV: Record<ProviderKey, string> = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  google: "GOOGLE_GENERATIVE_AI_API_KEY",
}

export function listConfiguredProviders() {
  return (Object.keys(PROVIDER_KEY_ENV) as ProviderKey[]).filter(
    (provider) => process.env[PROVIDER_KEY_ENV[provider]],
  )
}

export function resolveLanguageModel(preferredProvider?: ProviderKey, preferredModel?: string) {
  const available = listConfiguredProviders()
  const provider = preferredProvider && available.includes(preferredProvider)
    ? preferredProvider
    : available[0]

  if (!provider) {
    return null
  }

  const modelName = preferredModel ?? process.env[PROVIDER_MODEL_ENV[provider]]
  if (!modelName) {
    return null
  }

  switch (provider) {
    case "openai":
      return {
        provider,
        modelName,
        model: openai(modelName),
      }
    case "anthropic":
      return {
        provider,
        modelName,
        model: anthropic(modelName),
      }
    case "google":
      return {
        provider,
        modelName,
        model: google(modelName),
      }
    default:
      return null
  }
}
