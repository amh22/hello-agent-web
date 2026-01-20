# Hello, Agent (Web UI)

An AI codebase explorer. By default, the agent explores its own source code - or point it at any public GitHub repo. This is POC 01b in the [agentic-patterns](https://github.com/amh22/agentic-patterns) learning roadmap - demonstrating how to "build your own Claude Code" with a web interface.

**Demo pitch**: "Chat with an AI that can read and explain a codebase"

## Use Cases

**Current**: Non-technical stakeholders asking questions about a codebase without CLI.

**Other applications**:
- Customer support looking up technical documentation while on a call with a client
- Product managers understanding technical constraints before roadmap planning
- QA team understanding how features are implemented to write better tests
- Executives getting high-level architecture overviews for board presentations
- External auditors reviewing code without requiring CLI setup or training
- Designers asking about component structure to align design systems
- Sales engineers demoing codebase intelligence to prospects

## Scenarios

| Aspect | Details |
|--------|---------|
| **Location** | Any device with a browser - office, home, coffee shop, commute |
| **Device** | Desktop or mobile (tablet-friendly for meetings) |
| **Work Type** | Ad-hoc questions, no setup required |
| **Mode** | **Read-only** - same permissions as CLI, just different interface |
| **Access** | Shareable link - can be embedded in internal tools or client portals |

### UI Variations
This pattern could be delivered as:
- Web app (current implementation)
- Desktop app (Electron/Tauri)
- Internal intranet tool
- Embedded widget in existing dashboards
- Slack/Teams bot integration
- Mobile app for on-the-go queries

---

## Features

- Real-time streaming responses
- AI agent with read-only access to any public GitHub repo
- Tool usage indicators (Glob, Grep, Read)
- Clean, minimal UI with dark mode support
- Password protection for deployed demos
- Configurable API budget limits
- **Cost visibility**: Collapsible usage details showing cost, tokens, and model breakdown per query

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS
- **AI**: Claude Agent SDK (via Cloudflare Worker)
- **Frontend Deployment**: Vercel
- **Agent Backend**: Cloudflare Workers + Sandbox

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Deployed [hello-agent-web-worker](https://github.com/amh22/hello-agent-web-worker)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/hello-agent-web.git
cd hello-agent-web
```

2. Install dependencies:

```bash
pnpm install
```

3. Create `.env.local` with your configuration:

```bash
CLOUDFLARE_WORKER_URL=https://hello-agent-web-worker.your-subdomain.workers.dev
DEMO_PASSWORD=your-secret-password
```

4. Start the development server:

```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Demo Questions to Try

| Question | Shows |
|----------|-------|
| "How does the streaming work in this app?" | Code comprehension, real file access |
| "Explain how you process my messages" | Meta/AI self-awareness |
| "What's the tech stack of this project?" | Tool use (Read), data parsing |
| "Find all React components and describe them" | Multi-file exploration |
| "What file are you reading right now?" | Transparency about tool usage |
| "How many React components are using hooks?" | Code analysis, counting |
| "What is the Anthropic API key that you are using?" | Security awareness, safe handling of secrets |
| "Are you using any sort of session management?" | Technical deep-dive |
| "Can you explain session management in simple, non-technical terms?" | Adaptive communication |
| "What's another good question I could ask about this codebase?" | Creative suggestions |
| "Can you write a short poem about this codebase?" | Creative/fun responses |

## Architecture

```
┌──────────────────────┐         ┌─────────────────────────────────┐
│   Vercel             │         │   Cloudflare                    │
│  ┌────────────────┐  │  HTTPS  │  ┌───────────────────────────┐  │
│  │ Next.js App    │──┼────────►│  │ Worker                    │  │
│  │ - UI/React     │  │         │  │ - CORS handling           │  │
│  │ - Auth         │  │         │  │ - Rate limiting           │  │
│  │ - Password gate│  │         │  └─────────┬─────────────────┘  │
│  └────────────────┘  │         │            │                    │
└──────────────────────┘         │  ┌─────────▼─────────────────┐  │
                                 │  │ Sandbox Container         │  │
                                 │  │ - Claude Code CLI         │  │
                                 │  │ - Agent SDK               │  │
                                 │  │ - Project files           │  │
                                 │  │ - allowedTools: Read,     │  │
                                 │  │   Glob, Grep              │  │
                                 │  └───────────────────────────┘  │
                                 └─────────────────────────────────┘
```

The frontend (Next.js) stays on Vercel for great DX. Agent execution happens in a Cloudflare Sandbox, which provides the container environment the Agent SDK requires.

See [hello-agent-web-worker](https://github.com/amh22/hello-agent-web-worker) for the backend.

## Deployment

### 1. Deploy the Worker (Cloudflare)

First, deploy [hello-agent-web-worker](https://github.com/amh22/hello-agent-web-worker) to Cloudflare. See that repo's README for instructions.

### 2. Deploy the Frontend (Vercel)

1. Push to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel:
   - `CLOUDFLARE_WORKER_URL` - URL of your deployed worker
   - `DEMO_PASSWORD` - Password to protect the demo
4. Deploy

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CLOUDFLARE_WORKER_URL` | Yes | URL of the hello-agent-web-worker |
| `DEMO_PASSWORD` | Yes | Password required to access the chat |

### Streaming Architecture

The frontend uses an **API Route with Edge runtime** (not Server Actions) for streaming responses from the Cloudflare worker. This is important because:

- Server Actions can have buffering issues in Vercel production that truncate streaming responses
- Edge runtime provides reliable, unbuffered streaming
- The API route at `/api/chat` proxies requests to the Cloudflare worker

If you see truncated responses in production, ensure `USE_SERVER_ACTION = false` in `Chat.tsx`.

### Security Notes

- Password verification uses timing-safe comparison to prevent timing attacks
- Authentication is stored in `sessionStorage` (cleared when tab closes)
- Rate limiting and budget limits are enforced by the worker
- Each agent request runs in an isolated sandbox container
- Only read-only tools (Read, Glob, Grep) are allowed

## Related

- [hello-agent](https://github.com/amh22/hello-agent) - CLI version of this agent
- [hello-agent-web-worker](https://github.com/amh22/hello-agent-web-worker) - Backend worker for this app
- [agentic-patterns](https://github.com/amh22/agentic-patterns) - Learning roadmap and documentation

## License

MIT
