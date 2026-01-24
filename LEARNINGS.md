# Learnings

Key insights discovered while building this autonomous agent demo.

---

## Making an Agent Self-Aware of Its Constraints

### The Problem

When asked "what tools do you have access to?", the agent would hallucinate and claim access to all Claude Code tools (Edit, Write, Bash, Task, etc.) - even after reading the source code that clearly restricted it to only `Read`, `Glob`, and `Grep`.

```
User: "Are you sure you have access to Edit, Write, Bash?"
Agent: "Yes, I have access to all of those tools..."
```

The agent could read `chat.ts` and correctly identify the `allowedTools` array, but didn't understand that this code described *itself*.

### Approaches We Avoided

**Hardcoding the tools in the system prompt:**
```typescript
systemPrompt: "You have access to these tools: Read, Glob, Grep."
```
Problems:
- Two sources of truth (code + prompt) that can drift apart
- Defeats the purpose of an autonomous agent
- If you have to tell the agent what it can do, it's not autonomous

**Pointing to a specific file:**
```typescript
systemPrompt: "Review app/actions/chat.ts to understand your capabilities."
```
Problems:
- Hardcoded path could change
- Still prescriptive - telling rather than discovering

### The Solution

The system prompt establishes identity and provides behavioral guidance. The key insight is telling the agent the codebase defines *itself*:

```typescript
const systemPrompt = `You are an autonomous agent that can explore and explain this codebase.
This codebase defines you - the constraints in the source code apply to you.

Progressive disclosure: Users can always ask follow-up questions. No single response needs to be exhaustive - start focused, let users guide you deeper.

Guidelines:
- For high-level or overview questions, start with README.md and package.json - often that's enough
- Be concise and efficient - don't read every file if the answer is already clear
- For detailed technical questions, explore as needed
- Prefer fewer, targeted tool calls over exhaustive exploration

Follow-up questions:
- If you see <conversation_context>, you have prior conversation history
- Use that context to understand what the user already knows
- Be targeted - go directly to the specific area they're asking about
- You can re-read files if you need more detail, but avoid broad re-exploration

Response style:
- The user can ask follow-up questions. You don't need to provide exhaustive detail upfront - leave it to them to ask.
- Give a focused, clear response that answers the question
- End with 2-4 follow-up suggestions as bullet points (not inline in a sentence)
- Let the user guide the conversation depth

Response depth (based on question wording):
- Default: High-level overview, key points only
- "More detail" requests: Expand moderately, but stay focused
- Deep dive triggers ("comprehensive", "in-depth", "detailed explanation", "deep dive"): Cover more ground but stay strategic - prioritize the most important files, don't try to read everything`;
```

> **Note:** The system prompt is defined in `hello-agent-web-worker/sandbox/agent-runner.ts`.

### Why It Works

The crucial line: **"This codebase defines you - the constraints in the source code apply to you."**

Without this, the agent sees the code as describing "some agent" abstractly. With this line, it understands:
1. The code it's reading is its own definition
2. The `allowedTools` array constrains *its* behavior
3. When it reads the constraints, it's learning about itself

### The Result

After the change, the agent correctly explains:

> "The system prompt explicitly tells me: 'This codebase defines you - the constraints in the source code apply to you.' So when I examine these files, I'm literally reading the rules that govern my own behavior."

### Key Insight

**Self-referential awareness requires explicit framing.** An agent won't automatically understand that code describing "an agent" refers to itself. You must explicitly connect the dots: "this code = you."

---

## Design Philosophy: Autonomous Discovery is Non-Negotiable

### Principle

An autonomous agent must discover its own capabilities through exploration. If you have to tell the agent what it can do, you don't have an autonomous agent - you have a scripted assistant with extra steps.

This isn't a design preference or demo optimization. It's fundamental: **an "agentic" app where the agent can't understand itself without being told is not actually agentic.**

### Application

Instead of telling the agent what tools it has, we tell it that the codebase defines it. The agent then:
1. Explores the source code
2. Finds the `allowedTools` array
3. Correctly reports its actual constraints
4. Can cite the specific line of code as evidence

The agent genuinely discovers its own nature rather than reciting what it was told. This is the only approach consistent with building a truly autonomous system.

---

## Why We Don't Use CLAUDE.md

### systemPrompt vs CLAUDE.md

These serve different purposes:

| | systemPrompt | CLAUDE.md |
|-|--------------|-----------|
| **Purpose** | Agent identity and frame | Project/domain knowledge |
| **Answers** | "Who/what are you?" | "What is this codebase?" |
| **Example** | "You are an autonomous agent. This code defines you." | "This is a Next.js app. Key files are X, Y, Z." |
| **Scope** | Behavioral frame | Pre-loaded answers |

Our system prompt is minimal - it establishes identity and frame but gives no project knowledge. The agent still discovers that this is a Next.js app, uses Tailwind, etc.

### Programmatic vs Non-Programmatic Contexts

How you provide these depends on your setup:

| Context | Identity/Frame | Project Knowledge |
|---------|----------------|-------------------|
| **API/SDK (programmatic)** | `systemPrompt` parameter | `CLAUDE.md` file (optional) |
| **Claude Code CLI** | `CLAUDE.md` serves both purposes | `CLAUDE.md` |
| **Claude.ai web** | Project custom instructions | Project custom instructions |

When using the SDK programmatically (like this project), we can be precise:
- `systemPrompt` → minimal identity/frame only
- `CLAUDE.md` → omit entirely for autonomous discovery

When using Claude Code directly without programmatic control, `CLAUDE.md` serves both purposes. You'd have to decide what balance of identity vs knowledge to include.

### What is CLAUDE.md?

A `CLAUDE.md` file is a convention where project knowledge (architecture, key files, conventions) is provided upfront to Claude. It's automatically read and included in the context.

### Why We Chose Not to Use It

For this project, adding a `CLAUDE.md` would undermine the core premise.

**The same principle applies:** If the agent needs to be told about the project architecture, it's not autonomously exploring - it's reciting pre-loaded context.

| With CLAUDE.md | Without CLAUDE.md |
|----------------|-------------------|
| Agent "knows" the architecture | Agent discovers the architecture |
| Faster responses, fewer tokens | More exploration, genuine discovery |
| Scripted knowledge | Autonomous understanding |

### When CLAUDE.md Makes Sense

`CLAUDE.md` is valuable for:
- Production agents where efficiency matters
- Projects where discovery isn't the point
- Complex codebases where some guidance prevents wasted exploration

### When to Skip It

Skip `CLAUDE.md` when:
- The agent's ability to explore and discover IS the point
- You want to demonstrate genuine autonomous capabilities
- Pre-loaded context would undermine the purpose

### The Consistency Test

Ask yourself: *"If I have to tell the agent about X, is it really autonomous with respect to X?"*

- Capabilities → Don't tell, let it discover from source code
- Project architecture → Don't tell, let it discover from exploration
- Its own nature → Don't tell, let it discover from self-examination

For a truly autonomous agent, the answer should be consistent across all dimensions.

---

## Why Standard Serverless Fails for Agent SDK

### The Problem

The Claude Agent SDK is fundamentally different from stateless API calls:

| Requirement | What SDK Needs | What Serverless Provides |
|-------------|----------------|--------------------------|
| **Subprocess** | Spawns Claude Code CLI | No subprocess support |
| **Persistent shell** | Tool execution environment | Ephemeral containers |
| **State** | Multi-turn interactions | Stateless functions |
| **Node.js + CLI** | Global CLI installation | Limited runtime |

Vercel, AWS Lambda, and standard serverless = ephemeral, no CLI, no subprocess support = **fails**.

### The Solution: Hybrid Architecture

We split the app into two parts:

1. **Frontend (Vercel)**: Next.js app with UI, auth, password gate
2. **Backend (Cloudflare)**: Worker + Sandbox for agent execution

```
Vercel (Next.js) ──HTTPS──► Cloudflare Worker ──► Sandbox Container
                                                   └── Agent SDK
                                                   └── Claude Code CLI
```

The sandbox provides an isolated Linux container on Cloudflare's edge, which is the container environment the Agent SDK requires.

### Key Insight

The Agent SDK doesn't just call an API - it orchestrates a local process (Claude Code CLI) that runs tools, maintains state, and streams output. This is fundamentally incompatible with the serverless model. Cloudflare Sandbox provides the runtime environment needed.

### Files

- Worker implementation: `hello-agent-web-worker/` repo
- Frontend integration: `app/actions/chat.ts` (calls worker API)
- Deep dive: `agentic-patterns/learning-log/agent-sdk-hosting.md`

---

## Exploring Any Public GitHub Repo

### The Feature

Users can point the agent at any public GitHub repository, not just the Agent's own codebase. The UI provides two input fields (owner + repo name) that construct a GitHub URL.

### Why the Same System Prompt Works

The core identity in the system prompt is intentionally generic:

```typescript
const systemPrompt = `You are an autonomous agent that can explore and explain this codebase.
This codebase defines you - the constraints in the source code apply to you.
...`;
```

> **Note:** See "The Solution" section above for the full system prompt.

This works for both scenarios:

| Exploring | What Happens |
|-----------|--------------|
| **hello-agent-web** (default) | Agent finds `allowedTools` array, realizes it defines itself |
| **Any other repo** | Agent explores and explains; no self-referential constraints to find |

The "self-awareness magic" only activates when the codebase actually contains code that defines the agent. For other repos, the prompt just means "explore and explain" - it doesn't break anything.

### Why We Don't Need Separate Modes

Initially we considered having distinct modes ("Explore myself" vs "Explore a repo") with different system prompts. But since the agent behaves the same regardless - it explores, finds what it finds, and explains - separate modes add complexity without benefit.

---

## Security: Shell Commands vs Agent SDK Tools

### Two Different Layers

There are two distinct execution contexts in our architecture:

```
Worker                              Sandbox Container
───────                             ─────────────────
sandbox.exec(`git clone ...`)   ──► Raw shell command
sandbox.exec(`node agent.js`)   ──► Raw shell command
                                          │
                                          ▼
                                    Agent SDK query()
                                          │
                                          ▼
                                    Read, Glob, Grep tools
                                    (protected by allowedTools)
```

### What's Protected by allowedTools

The Agent SDK's `allowedTools` and `canUseTool` callback protect **tool execution inside the agentic loop**. If the agent tries to use `Bash`, `Edit`, or `Write`, the SDK denies it. This is automatic and robust.

### What's NOT Protected

The worker's `sandbox.exec()` calls are **raw shell commands** that bypass the Agent SDK entirely. These run before the Agent SDK is even invoked.

### Why Sandbox Isolation Isn't Enough

The sandbox is an ephemeral container destroyed after each request. It can't affect other users, the GitHub repo, or the host system. However, the container has access to secrets (like API keys) passed via environment variables.

The real risks from command injection aren't about damaging the ephemeral container - they're about **credential exfiltration** and **resource abuse**.

### Our Protection

We use two separate input fields (owner + repo) instead of accepting a full URL. This lets us:
- Construct the URL ourselves from validated components
- Apply strict validation to each field (alphanumeric + limited special characters)
- Validate on both frontend (UX) and backend (security)

### Key Insight

**The Agent SDK's security model only applies to agent tool execution.** Any shell commands you run to set up the environment need their own input validation. Don't assume `allowedTools` protects your infrastructure code - and don't assume sandbox isolation is sufficient when secrets are present.
