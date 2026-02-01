# AGENTS.md — Neo Frontend (hello-agent-web)

## Development Workflow

- Branch from `main`, PR back to `main`
- Observability first: add logging before adding features
- Test locally with `pnpm dev` before pushing

## Observability First

Every change should be observable. When adding or modifying features:

- Log at each pipeline stage with `[prefix]` tags (e.g., `[chat]`, `[api/chat]`)
- Frontend: use `console.debug` for verbose/diagnostic logs, `console.error` for failures
- Always include context: prompt length, auth status, elapsed time, event counts
- This pattern was established after diagnosing a bug where NDJSON chunks split across read boundaries caused silent data loss — the silent `catch {}` made it invisible

## Package Manager

pnpm (see `pnpm-workspace.yaml`)

## Directory Structure

```
app/
├── api/
│   ├── auth/route.ts      # Auth proxy to worker
│   └── chat/route.ts      # Chat proxy to worker (Edge runtime, streams NDJSON)
├── actions/
│   ├── auth.ts             # Auth action
│   └── chat.ts             # Chat action (unused, kept for reference)
├── components/
│   ├── Chat.tsx            # Main chat component (NDJSON stream parser)
│   ├── ActivityPanel.tsx   # Tool use activity display
│   ├── InputWithPills.tsx  # Input with blue/red pill selector
│   ├── MatrixBackground.tsx# Animated background
│   ├── Message.tsx         # Message bubble with markdown
│   ├── PasswordGate.tsx    # Auth gate (localStorage token)
│   ├── RepoSelector.tsx    # GitHub repo owner/name inputs
│   ├── ThemeToggle.tsx     # Dark/light mode toggle
│   └── UsageDetails.tsx    # Token/cost usage display
├── globals.css
├── layout.tsx
└── page.tsx
```

## Code Conventions

- **Language:** TypeScript (strict)
- **Framework:** Next.js 15 App Router
- **Styling:** Tailwind CSS with dark mode (`dark:` prefix)
- **Components:** Functional React with hooks, `"use client"` directive where needed
- **Naming:** PascalCase for components, camelCase for functions/variables
- **Exports:** Named exports for components (e.g., `export function Chat()`)

## Streaming Protocol

The frontend consumes NDJSON from the worker via the API route. Event types:

| Type | Fields | Description |
|------|--------|-------------|
| `request_id` | `id` | Correlation ID from worker for debugging |
| `text` | `content` | Agent response text (streamed incrementally) |
| `tool_use` | `tool`, `detail` | Tool invocation (e.g., file read, search) |
| `turn` | `turn` | Current agent turn number |
| `usage` | `data` | Token counts, cost, model info |
| `result` | `content` | Final result (fallback if streaming text missed) |
| `error` | `content` | Error message |

**Important:** The NDJSON parser in `Chat.tsx` buffers partial lines across chunks. This is critical — network chunking can split a JSON line across two `reader.read()` calls.

## Architecture

```
Browser → Next.js API Route (Edge) → Cloudflare Worker → Sandbox (Agent SDK)
                                         ↓
                                    NDJSON stream
```

- The API route (`app/api/chat/route.ts`) is a transparent proxy — it forwards the request and streams the response
- Auth tokens are stored in `localStorage` and sent as `Authorization: Bearer` headers
- On 401 from worker, the frontend clears the token and shows the password gate

## Don'ts

- Don't add dependencies without checking `package.json` first
- Don't modify the streaming protocol without updating the worker too
- Don't use `console.log` in the frontend — use `console.debug` (verbose) or `console.error` (failures)
- Don't silence errors in catch blocks without logging them
