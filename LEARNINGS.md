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
