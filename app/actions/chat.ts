"use server";

import { query, type SDKMessage } from "@anthropic-ai/claude-agent-sdk";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Define allowed tools for read-only codebase exploration
const allowedTools = ["Read", "Glob", "Grep"];

// Get max budget from environment, default to $0.10
const maxBudgetUsd = parseFloat(process.env.MAX_BUDGET_USD || "0.10");

export async function chat(messages: ChatMessage[]): Promise<ReadableStream> {
  const projectRoot = process.cwd();
  const latestMessage = messages[messages.length - 1].content;

  console.log("[chat] Starting query:", {
    cwd: projectRoot,
    promptLength: latestMessage.length,
    maxBudgetUsd,
  });

  // Create a ReadableStream to stream the response to the client
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // query() returns an AsyncGenerator<SDKMessage>
        const response = query({
          prompt: latestMessage,
          options: {
            cwd: projectRoot,
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

        // Iterate over the async generator to get streaming messages
        for await (const message of response) {
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
  // Handle streaming text events
  if (message.type === "stream_event" && message.event) {
    const event = message.event;
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      controller.enqueue(
        encoder.encode(
          JSON.stringify({ type: "text", content: event.delta.text }) + "\n"
        )
      );
    } else if (event.type === "content_block_start") {
      if (event.content_block.type === "tool_use") {
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "tool_use",
              tool: event.content_block.name,
              id: event.content_block.id,
            }) + "\n"
          )
        );
      }
    }
  }

  // Handle complete assistant messages (fallback)
  if (message.type === "assistant" && "content" in message) {
    const content = message.content as Array<{ type: string; text?: string }>;
    for (const block of content) {
      if (block.type === "text" && block.text) {
        controller.enqueue(
          encoder.encode(
            JSON.stringify({ type: "text", content: block.text }) + "\n"
          )
        );
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
