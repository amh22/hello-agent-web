# Key Principles for AI Agents

Distilled wisdom from Manus, Agent-Native architecture, and the Anthropic two-agent pattern.

## Context Engineering (Manus)

### KV-Cache Optimization
- Keep system prompts and tool definitions stable (prefix caching)
- Append new information, don't restructure context
- Minimize context churn in long-running agents

### File System as Extended Memory
- Large observations → write to files, reference by path
- Keeps context window lean
- Files are inspectable and debuggable

### Preserve Failure States
- Don't hide errors or retry silently
- Keep error traces visible in context
- Failures inform future decisions

### Recite Goals
- Regularly update todo lists / progress files
- Prevents drift in long-running tasks
- Agent "reminds itself" of objectives

## Agent-Native Architecture

### Parity
> Agents can do anything the UI can do

- Don't build separate "AI features"
- AI uses the same tools as manual flows
- Enables drop-in agent enhancement

### Granularity
> Atomic tools, decisions in prompts

- Tools are primitive operations (read, write, move)
- Intelligence lives in the prompt, not tool logic
- Small tools = flexible composition

### Composability
> New features = new prompts

- Agent capabilities emerge from prompt + tools
- Add features by describing them, not coding them
- Prompts are the new configuration

### Files as Universal Interface
- All data stored as files
- Human-readable formats (JSON, markdown)
- Portable between tools and systems
- Easy to inspect, debug, version

## Two-Agent Pattern (Anthropic)

### Initializer Agent
- Analyzes the task/PRD
- Creates work plan and progress tracking
- Sets up environment and artifacts
- Hands off to worker agent

### Worker Agent (Looped)
- Works on one item at a time
- Commits incrementally
- Updates progress file after each step
- Signals completion explicitly

### Progress Tracking
```markdown
# Progress File

## Completed
- [x] Feature 1
- [x] Feature 2

## In Progress
- [ ] Feature 3  <-- current

## Blocked
- Feature 4: waiting on API docs
```

### Key Patterns
- **Explicit completion signals** - don't assume done
- **Incremental commits** - recoverable state
- **Feature isolation** - one thing at a time
- **Documented blockers** - visible impediments

## Tool Design Guidelines

### Do
- Keep tools atomic (single responsibility)
- Return structured data when possible
- Fail fast with clear error messages
- Make operations idempotent when feasible

### Don't
- Build "smart" tools that make decisions
- Hide complexity in tool implementations
- Create tools with side effects
- Return ambiguous success/failure

## System Prompt Principles

### Structure
1. Role and capabilities
2. Available tools and when to use them
3. Constraints and guardrails
4. Output format expectations

### Effective Patterns
- Be specific about tool selection criteria
- Include examples of good behavior
- State what NOT to do explicitly
- Remind of goals at decision points

## Error Handling

### For Agents
- Log errors to files/progress tracking
- Continue with other work when possible
- Document blockers clearly
- Don't retry indefinitely

### For Orchestrators
- Monitor for stuck states
- Implement timeouts
- Preserve state for debugging
- Allow manual intervention

## Memory Management

### Short Context
- Summarize large outputs
- Reference files instead of inline content
- Prune completed items periodically

### Long-Running Tasks
- Checkpoint progress regularly
- Use files for persistent state
- Design for resumability
- Clear context between major phases

## Testing Agents

### Manual Verification
- Test with edge cases
- Verify tool call sequences
- Check for context pollution
- Confirm cleanup/completion

### Automated Checks
- Validate output structure
- Check for common failure patterns
- Monitor token usage
- Log decision points

## Sources

- [Manus Context Engineering](https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus)
- [Every.to Agent-Native Guide](https://every.to/guides/agent-native)
- [Anthropic Two-Agent Pattern](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- [Ralph Repository](https://github.com/snarktank/ralph)
