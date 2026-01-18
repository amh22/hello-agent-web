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

A minimal system prompt with one key addition - telling the agent the codebase defines *itself*:

```typescript
const systemPrompt = `You are an autonomous agent that can explore and explain this codebase.
This codebase defines you - the constraints in the source code apply to you.
Answer questions by examining the actual source files.`;
```

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
