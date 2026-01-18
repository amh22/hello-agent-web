# Hello Agent

A self-referential AI demo: a web chat interface that lets users ask an AI agent about its own source code.

**Demo pitch**: "Chat with an AI that can read and explain its own source code"

## Features

- Real-time streaming responses
- AI agent with read-only access to its own codebase
- Tool usage indicators (Glob, Grep, Read)
- Clean, minimal UI with dark mode support

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS
- **AI**: Claude Agent SDK
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Anthropic API key

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

3. Create `.env.local` with your API key:

```bash
ANTHROPIC_API_KEY=your-api-key-here
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

## Architecture

```
Browser (Chat UI)
    │
    │ Server Action (streaming)
    ▼
Next.js Server
    │
    │ query() with onMessage callback
    ▼
Claude Agent SDK
    │
    │ allowedTools: Read, Glob, Grep
    ▼
Project Source Files
```

## Deployment

Deploy to Vercel:

1. Push to GitHub
2. Connect repository to Vercel
3. Set `ANTHROPIC_API_KEY` in environment variables
4. Deploy

## License

MIT
