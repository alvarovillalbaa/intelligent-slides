import { nanoid } from "nanoid"

import type {
  BrandProfile,
  DeckSource,
  SlideBlock,
  ThemeTokens,
} from "@/lib/types"
import { clamp } from "@/lib/utils"

export const themeLibrary: ThemeTokens[] = [
  {
    id: "editorial-sunrise",
    name: "Editorial Sunrise",
    mood: "Optimistic, polished, premium",
    displayFont: "\"Clash Display\", \"Geist\", sans-serif",
    bodyFont: "\"Nunito Sans\", \"Geist\", sans-serif",
    background: "#f8efe7",
    foreground: "#161513",
    accent: "#ff6f4d",
    accentSoft: "#ffe1d6",
    card: "#fff8f2",
    cardForeground: "#231f1c",
    border: "#e8c7b6",
    gradient: "linear-gradient(135deg, #fff8ef 0%, #f2ded0 45%, #e6f0ff 100%)",
  },
  {
    id: "cobalt-grid",
    name: "Cobalt Grid",
    mood: "Product launch, technical, precise",
    displayFont: "\"Sora\", \"Geist\", sans-serif",
    bodyFont: "\"Nunito Sans\", \"Geist\", sans-serif",
    background: "#09111f",
    foreground: "#f4f7fb",
    accent: "#7cd3ff",
    accentSoft: "#113558",
    card: "#0f1c31",
    cardForeground: "#edf7ff",
    border: "#1c3654",
    gradient: "linear-gradient(135deg, #07111d 0%, #0f1c31 35%, #1b4268 100%)",
  },
  {
    id: "forest-signal",
    name: "Forest Signal",
    mood: "Trustworthy, modern, data-forward",
    displayFont: "\"Instrument Serif\", \"Geist\", serif",
    bodyFont: "\"Nunito Sans\", \"Geist\", sans-serif",
    background: "#f2f6ef",
    foreground: "#102114",
    accent: "#3c8f5b",
    accentSoft: "#dceddf",
    card: "#f9fdf8",
    cardForeground: "#17301d",
    border: "#bfd5c5",
    gradient: "linear-gradient(135deg, #f7fbf3 0%, #dceddf 50%, #dfeaf7 100%)",
  },
]

const blockAccentPalette = ["#ff6f4d", "#7cd3ff", "#3c8f5b", "#a15cff", "#ffbf69"]

export function remixTheme(baseTheme: ThemeTokens, brand?: BrandProfile): ThemeTokens {
  const accentFromBrand = brand?.palette.find(Boolean)
  const accent = accentFromBrand ?? blockAccentPalette[Math.floor(Math.random() * blockAccentPalette.length)]
  const hue = clamp(accent.length * 7, 10, 300)
  return {
    ...baseTheme,
    id: `${baseTheme.id}-remix-${nanoid(4)}`,
    name: `${baseTheme.name} Remix`,
    accent,
    accentSoft: `${accent}22`,
    gradient: `linear-gradient(135deg, ${baseTheme.background} 0%, ${accent}28 42%, ${baseTheme.card} 100%)`,
    border: `color-mix(in srgb, ${accent} 28%, white)`,
    mood: `${baseTheme.mood}; remixed around ${brand?.companyName ?? "fresh"} tones`,
    foreground: hue > 180 ? baseTheme.foreground : baseTheme.foreground,
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function renderBlock(block: SlideBlock) {
  switch (block.kind) {
    case "paragraph":
      return `<p class="deck-paragraph">${escapeHtml(block.text)}</p>`
    case "bullets":
      return `<ul class="deck-bullets">${block.items
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join("")}</ul>`
    case "stats":
      return `<div class="deck-stats">${block.items
        .map(
          (item) =>
            `<article class="deck-stat"><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(
              item.value,
            )}</strong><small>${escapeHtml(item.detail)}</small></article>`,
        )
        .join("")}</div>`
    case "quote":
      return `<blockquote class="deck-quote"><p>"${escapeHtml(block.quote)}"</p><footer>${escapeHtml(
        block.byline,
      )}</footer></blockquote>`
    case "timeline":
      return `<div class="deck-timeline">${block.items
        .map(
          (item) =>
            `<article class="deck-timeline-item"><strong>${escapeHtml(
              item.label,
            )}</strong><p>${escapeHtml(item.detail)}</p></article>`,
        )
        .join("")}</div>`
    case "code":
      return `<pre class="deck-code"><code>${escapeHtml(block.code)}</code></pre>`
    case "callout":
      return `<div class="deck-callout"><span>${escapeHtml(block.label)}</span><strong>${escapeHtml(
        block.value,
      )}</strong></div>`
    default:
      return ""
  }
}

export function buildStandaloneDeckHtml(source: DeckSource, deckSlug: string) {
  const slides = source.slides
    .map(
      (slide, index) => `
      <section class="deck-slide" data-slide="${escapeHtml(slide.id)}">
        <div class="deck-slide-meta">
          <span>${escapeHtml(slide.kicker)}</span>
          <span>${index + 1}/${source.slides.length}</span>
        </div>
        <div class="deck-slide-copy">
          <h2>${escapeHtml(slide.title)}</h2>
          <p class="deck-summary">${escapeHtml(slide.summary)}</p>
          <div class="deck-blocks">
            ${slide.blocks.map(renderBlock).join("")}
          </div>
        </div>
      </section>`,
    )
    .join("")

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(source.seoTitle)}</title>
    <meta name="description" content="${escapeHtml(source.seoDescription)}" />
    <style>
      :root {
        --background: ${source.theme.background};
        --foreground: ${source.theme.foreground};
        --accent: ${source.theme.accent};
        --accent-soft: ${source.theme.accentSoft};
        --card: ${source.theme.card};
        --card-foreground: ${source.theme.cardForeground};
        --border: ${source.theme.border};
        --gradient: ${source.theme.gradient};
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: ${source.theme.bodyFont};
        background: var(--gradient);
        color: var(--foreground);
      }
      main {
        display: grid;
        min-height: 100vh;
        padding: 32px;
        gap: 24px;
      }
      .deck-shell {
        max-width: 1200px;
        margin: 0 auto;
        width: 100%;
        display: grid;
        gap: 18px;
      }
      .deck-hero, .deck-slide {
        border: 1px solid var(--border);
        border-radius: 32px;
        background: color-mix(in srgb, var(--card) 84%, transparent);
        backdrop-filter: blur(20px);
        padding: 32px;
      }
      .deck-hero h1, .deck-slide h2 {
        margin: 0 0 12px;
        font-family: ${source.theme.displayFont};
        line-height: 0.95;
        letter-spacing: -0.04em;
      }
      .deck-hero h1 { font-size: clamp(42px, 7vw, 88px); }
      .deck-slide h2 { font-size: clamp(32px, 4vw, 56px); }
      .deck-kicker, .deck-slide-meta {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        opacity: 0.72;
      }
      .deck-summary, .deck-paragraph { font-size: 18px; line-height: 1.6; }
      .deck-bullets, .deck-blocks { display: grid; gap: 14px; }
      .deck-bullets { padding-left: 20px; }
      .deck-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 14px;
      }
      .deck-stat, .deck-callout, .deck-timeline-item {
        border: 1px solid var(--border);
        border-radius: 20px;
        padding: 16px;
        background: color-mix(in srgb, var(--background) 74%, white);
      }
      .deck-stat strong, .deck-callout strong {
        display: block;
        font-size: 30px;
        margin: 8px 0 4px;
        font-family: ${source.theme.displayFont};
      }
      .deck-quote {
        margin: 0;
        padding: 20px 24px;
        border-left: 4px solid var(--accent);
        background: var(--accent-soft);
        border-radius: 24px;
      }
      .deck-code {
        margin: 0;
        padding: 18px;
        border-radius: 24px;
        overflow: auto;
        background: #09111f;
        color: #edf7ff;
      }
      .deck-timeline {
        display: grid;
        gap: 12px;
      }
      .deck-footer {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
        border: 1px solid var(--border);
        border-radius: 20px;
        padding: 16px 20px;
        background: color-mix(in srgb, var(--card) 88%, transparent);
      }
      .deck-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        padding: 12px 18px;
        background: var(--foreground);
        color: var(--background);
        text-decoration: none;
        font-weight: 700;
      }
    </style>
  </head>
  <body>
    <main>
      <div class="deck-shell" data-deck="${escapeHtml(deckSlug)}">
        <section class="deck-hero">
          <div class="deck-kicker">
            <span>${escapeHtml(source.brand.companyName)}</span>
            <span>${escapeHtml(source.audience)}</span>
          </div>
          <h1>${escapeHtml(source.title)}</h1>
          <p class="deck-summary">${escapeHtml(source.summary)}</p>
        </section>
        ${slides}
        <section class="deck-footer">
          <div>
            <strong>${escapeHtml(source.cta.label)}</strong>
            <div>${escapeHtml(source.cta.helperText)}</div>
          </div>
          <a class="deck-button" href="${escapeHtml(source.cta.href)}">${escapeHtml(source.cta.label)}</a>
        </section>
      </div>
    </main>
  </body>
</html>`
}
