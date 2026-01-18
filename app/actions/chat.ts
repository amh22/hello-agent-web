"use server";

import { query, type SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import { headers } from "next/headers";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Define allowed tools for read-only codebase exploration
const allowedTools = ["Read", "Glob", "Grep"];

// Get max budget from environment, default to $1.00
const maxBudgetUsd = parseFloat(process.env.MAX_BUDGET_USD || "1.00");

// Rate limiting configuration (configurable via env)
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "5"); // Default: 5 requests per minute per IP

// In-memory rate limit store (resets on server restart)
const rateLimitStore = new Map<string, { timestamps: number[] }>();

function checkRateLimit(ip: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  // Get or create entry for this IP
  let entry = rateLimitStore.get(ip);
  if (!entry) {
    entry = { timestamps: [] };
    rateLimitStore.set(ip, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

  // Check if rate limited
  if (entry.timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    const oldestInWindow = entry.timestamps[0];
    const retryAfterMs = oldestInWindow + RATE_LIMIT_WINDOW_MS - now;
    return { allowed: false, retryAfterMs };
  }

  // Add current request timestamp
  entry.timestamps.push(now);
  return { allowed: true };
}

async function getClientIP(): Promise<string> {
  const headersList = await headers();
  // Check common headers for real IP (behind proxies/load balancers)
  return (
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    headersList.get("cf-connecting-ip") || // Cloudflare
    "unknown"
  );
}

// Minimal system prompt - let the agent discover autonomously
const systemPrompt = `You are an autonomous agent that can explore and explain this codebase.
This codebase defines you - the constraints in the source code apply to you.
Answer questions by examining the actual source files.`;

export async function chat(messages: ChatMessage[]): Promise<ReadableStream> {
  const encoder = new TextEncoder();

  // Check rate limit
  const clientIP = await getClientIP();
  const rateLimitResult = checkRateLimit(clientIP);

  if (!rateLimitResult.allowed) {
    const retryAfterSec = Math.ceil((rateLimitResult.retryAfterMs || 0) / 1000);
    console.log("[chat] Rate limited:", { clientIP, retryAfterSec });

    // Return a stream with just the error
    return new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "error",
              content: `Too many requests. Please wait ${retryAfterSec} seconds before trying again.`,
            }) + "\n"
          )
        );
        controller.close();
      },
    });
  }

  const projectRoot = process.cwd();
  const latestMessage = messages[messages.length - 1].content;

  console.log("[chat] Starting query:", {
    cwd: projectRoot,
    clientIP,
    promptLength: latestMessage.length,
    maxBudgetUsd,
  });

  // Create a ReadableStream to stream the response to the client
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // query() returns an AsyncGenerator<SDKMessage>
        const response = query({
          prompt: latestMessage,
          options: {
            cwd: projectRoot,
            systemPrompt,
            maxTurns: 10,
            maxBudgetUsd,
            allowedTools,
            // Auto-approve only our allowed read-only tools
            canUseTool: async (toolName: string) => {
              if (allowedTools.includes(toolName)) {
                return { behavior: "allow" as const };
              }
              return { behavior: "deny" as const, message: "Tool not allowed" };
            },
          },
        });

        // Track turns: a new turn starts when we see assistant after user (tool results)
        let currentTurn = 0;
        let lastMessageType = "";

        // Iterate over the async generator to get streaming messages
        for await (const message of response) {
          // Detect turn transitions: user (tool results) → assistant = new turn
          if (message.type === "assistant" && lastMessageType === "user") {
            currentTurn++;
            controller.enqueue(
              encoder.encode(JSON.stringify({ type: "turn", turn: currentTurn }) + "\n")
            );
          }
          lastMessageType = message.type;

          handleMessage(message, controller, encoder);
        }

        controller.close();
      } catch (error) {
        console.error("[chat] SDK error:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        const userMessage = formatErrorForUser(errorMessage);
        controller.enqueue(
          encoder.encode(
            JSON.stringify({ type: "error", content: userMessage }) + "\n"
          )
        );
        controller.close();
      }
    },
  });

  return stream;
}

function handleMessage(
  message: SDKMessage,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  // Handle assistant messages with tool_use (during agentic loop)
  // Structure: { type: "assistant", message: { content: [...] } }
  if (message.type === "assistant" && "message" in message) {
    const msg = message.message as { content?: Array<{ type: string; text?: string; name?: string; id?: string }> };
    if (msg.content) {
      for (const block of msg.content) {
        if (block.type === "tool_use" && block.name) {
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "tool_use",
                tool: block.name,
                id: block.id,
              }) + "\n"
            )
          );
        } else if (block.type === "text" && block.text) {
          controller.enqueue(
            encoder.encode(
              JSON.stringify({ type: "text", content: block.text }) + "\n"
            )
          );
        }
      }
    }
  }

  // Handle result message
  if (message.type === "result") {
    // Stream usage data for all result types (success or error)
    const usageData = {
      total_cost_usd: message.total_cost_usd,
      duration_ms: message.duration_ms,
      num_turns: message.num_turns,
      usage: message.usage,
      modelUsage: message.modelUsage,
    };
    console.log("[chat] Result received:", {
      subtype: message.subtype,
      total_cost_usd: message.total_cost_usd,
      duration_ms: message.duration_ms,
      num_turns: message.num_turns,
      usage: JSON.stringify(message.usage, null, 2),
      modelUsage: JSON.stringify(message.modelUsage, null, 2),
    });
    controller.enqueue(
      encoder.encode(JSON.stringify({ type: "usage", data: usageData }) + "\n")
    );

    if (message.subtype === "success") {
      // Result contains the final text
      if (message.result) {
        controller.enqueue(
          encoder.encode(
            JSON.stringify({ type: "result", content: message.result }) + "\n"
          )
        );
      }
    } else {
      // Handle error results
      console.error("[chat] Result error:", message.subtype, message);
      const errorDetail =
        "errorDetails" in message ? String(message.errorDetails) : "";
      const userMessage = formatErrorForUser(
        `${message.subtype}: ${errorDetail}`
      );
      controller.enqueue(
        encoder.encode(
          JSON.stringify({ type: "error", content: userMessage }) + "\n"
        )
      );
    }
  }
}

// Format technical errors into user-friendly messages
function formatErrorForUser(error: string): string {
  if (error.includes("exited with code 1")) {
    return "The AI service encountered an error. Please try again or contact support if the issue persists.";
  }
  if (error.includes("authentication") || error.includes("API key")) {
    return "Authentication error. Please check the service configuration.";
  }
  if (error.includes("rate_limit")) {
    return "Too many requests. Please wait a moment and try again.";
  }
  if (error.includes("max_budget")) {
    return "Budget limit reached for this query. Please try a simpler question.";
  }
  if (error.includes("max_turns")) {
    return "The query required too many steps. Please try a simpler question.";
  }
  // For development, include original error; in production you might hide this
  return `Something went wrong: ${error}`;
}
