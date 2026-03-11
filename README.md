# Slides

Slides is a Next.js + TypeScript + Convex application for turning pasted content, URLs, and uploaded files into editable, publishable, code-based slide decks.

Published decks are emitted as standalone HTML artifacts. The app layers team/workspace access control, review flows, lead capture, password protection, signed private embeds, analytics, and experiment routing around those artifacts.

## What is implemented

- Team-based authentication with company/team creation
- Shared team workspaces with role-based deck editing
- Deck generation from paste, URL, and file context
- Streaming AI rewrites and direct structured editing
- Checkpoints, published versions, and review links
- Password-protected public deck routes
- Signed private embed URLs
- Standalone HTML deck artifacts with CTA, poll, lead capture, and event reporting
- Deck analytics with per-version metrics
- Asset upload and library management

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Fill in `NEXT_PUBLIC_APP_URL`.
3. Configure Convex with `NEXT_PUBLIC_CONVEX_URL` and `CONVEX_ADMIN_KEY`.
4. Add at least one AI provider and model if you want live generation.
5. Optionally add `FIRECRAWL_API_KEY` for URL scraping + brand extraction.
6. Run:

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

## Environment

- `NEXT_PUBLIC_APP_URL`: base URL used in public/share links
- `NEXT_PUBLIC_CONVEX_URL`: Convex deployment URL
- `CONVEX_ADMIN_KEY`: Convex admin key used by the repository layer
- `SLIDES_SIGNING_SECRET`: HMAC secret for signed embed/artifact URLs
- `FIRECRAWL_API_KEY`: optional URL scraping + brand extraction
- `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GOOGLE_GENERATIVE_AI_API_KEY`: optional AI providers
- `OPENAI_MODEL` / `ANTHROPIC_MODEL` / `GOOGLE_MODEL`: provider model names

## Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm run test
```

## Self-hosting

The app is configured for standalone Next.js output.

```bash
docker compose up --build
```

Provide your environment in `.env.local` or adapt `docker-compose.yml`.

## Architecture

- `app/`: App Router pages, route handlers, and server actions
- `components/slides/`: product UI for generation, editing, review, and publishing
- `lib/ai/`: provider routing and deck generation schema/prompting
- `lib/deck-runtime.ts`: standalone HTML artifact generator
- `lib/repository.ts`: persistence + authorization layer over Convex/demo store
- `convex/`: schema and backend query/mutation functions

## Notes

- Public deck slugs only resolve explicitly published versions.
- Password protection is enforced on public deck rendering and immutable artifacts.
- Embeds require signed URLs.
- Team members can access all workspaces in their team.
