# Hello, Agent

An AI codebase explorer. By default, the agent explores its own source code - or point it at any public GitHub repo.

**Demo pitch**: "Chat with an AI that can read and explain a codebase"

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

### Security Notes

- Password verification uses timing-safe comparison to prevent timing attacks
- Authentication is stored in `sessionStorage` (cleared when tab closes)
- Rate limiting and budget limits are enforced by the worker
- Each agent request runs in an isolated sandbox container
- Only read-only tools (Read, Glob, Grep) are allowed

## License

MIT
