# Replit Learn

Standalone Replit Learn MVP extracted from commit `ff17310402fc97167cf72ce8d5f1fa6e32d34bd8` on the `platform/fumadocs` migration of `replit-docs`.

The project preserves the current Learn experience while removing its runtime and content dependencies on the parent documentation repository. It includes the existing 53 lessons, five course pillars, Replit styling and themes, Replit sign-in, Ask AI, and read-only project context through the Replit MCP server.

## Architecture

- **React and Vite** render the current Learn interface.
- **Fumadocs MDX** remains configured in `vite.config.ts` so lessons can move from typed content to MDX incrementally.
- **Cloudflare Worker** serves the built SPA and the authentication, MCP, and Ask AI endpoints.
- **Durable Objects** store dynamic OAuth client registrations, short-lived authorization flows, and signed-in sessions.
- **Replit OIDC** provides identity and a read-only `apps:read` token for the Replit MCP server.
- **Learn search index** is generated during development and builds. Lexical retrieval works from the bundled file; the preserved Vectorize path can add semantic retrieval from a Learn-owned index. Neither path depends on `replit-docs` at runtime.

## Run locally

Install dependencies:

```bash
pnpm install
```

For fast UI development with Vite and hot reload:

```bash
pnpm dev
```

Open the URL Vite prints. Changes to `src/learn-content.ts` also regenerate the bundled Ask index before the browser reloads, so lesson content and Ask grounding stay aligned. In this mode, the interface is complete, but Worker-backed sign-in and Ask AI are unavailable.

For the full sign-in, Ask AI, and Replit MCP flow:

```bash
cp .dev.vars.example .dev.vars
pnpm dev:auth
```

Open [http://localhost:4173](http://localhost:4173). Add `OPENAI_API_KEY` to `.dev.vars` for generated answers grounded in Learn content. Without it, Learn questions use the extractive fallback; project questions still use the Replit MCP server after sign-in.

The Replit Run button uses this full-stack command.

## Commands

- `pnpm dev` — generate the Learn index and start Vite with hot reload.
- `pnpm dev:auth` — build the app and run it through the Worker on port 4173.
- `pnpm build` — generate the index, type-check the app, and create a production build.
- `pnpm typecheck` — type-check the frontend.
- `pnpm generate:learn-index` — regenerate `public/retrieval/replit-learn-index.json`.
- `pnpm upsert:learn-index` — send the generated manifest to a configured Learn Worker so it can populate Vectorize.

## Authentication and MCP

The preserved sign-in flow uses OAuth 2.0 / OIDC with PKCE and dynamic client registration for the current origin. The Worker requests identity scopes plus `apps:read`, stores tokens server-side in a Durable Object, and sends only secure session cookies to the browser.

Ask AI can answer from two context sources:

1. The standalone Learn index for course questions.
2. A selected Replit app through the MCP `ask_question` tool.

The project list comes from the MCP `list_apps` tool. Browser code never receives the Replit access token.

The Worker uses the standalone `LEARN_VECTORIZE` binding when a Learn-owned `replit-learn-openai` index has been provisioned and populated. Until then, the same Ask UI and generated answers use the bundled lexical index. Vectorize is an optional retrieval enhancement, not a runtime dependency.

## Content

For this MVP, lesson content remains in `src/learn-content.ts` to preserve the migrated interface. The Fumadocs compiler is ready for a later, incremental MDX conversion.

The navigation groups Learn into five pillars without moving the existing lesson URLs:

1. Discover Replit
2. Operate
3. Design
4. Build
5. Admin

The existing 53 lessons remain intact. App Foundations, AI Foundations, and Agent Foundations now sit under Discover Replit. Additional lightweight prototype lessons demonstrate the missing Discover, Operate, and Admin paths; they are not final curriculum.

## Configuration

- `OPENAI_API_KEY` — optional locally; enables generated, source-grounded Learn answers.
- `REPLIT_OIDC_ISSUER` — defaults to `https://replit.com/oidc`.
- `REPLIT_MCP_URL` — defaults to `https://replit-mcp.com/server/mcp`.
- `REPLIT_OIDC_CLIENT_ID` — optional static client ID; otherwise the Worker registers one per origin.
- `RAG_INDEX_SECRET` — only needed if semantic Vectorize indexing is added later.

To populate an available Learn Vectorize index, run the Worker with the same `RAG_INDEX_SECRET`, then set `RAG_INDEX_ENDPOINT` to its `/api/rag/index` URL and run `pnpm upsert:learn-index`. Cloud resource provisioning and deployment automation remain outside this MVP.

Do not commit `.dev.vars` or any other secret file.

## MVP boundaries

Included:

- Current Learn pages and interaction patterns
- Pillar → module → lesson navigation
- Existing CSS, fonts, logos, theme controls, and responsive behavior
- Replit sign-in, Ask AI, and Replit MCP integration
- Standalone development and build configuration

Not included:

- CI/CD or deployment automation
- Full rewrites of the existing lessons or finalized five-pillar curriculum
- Persistent course progress or quiz scoring
- Cloud resource provisioning for the declared Learn Vectorize index
