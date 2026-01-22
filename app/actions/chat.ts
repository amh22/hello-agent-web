"use server";

/**
 * NOTE: This Server Action is currently NOT IN USE.
 * The app uses the API Route at /api/chat/route.ts instead.
 * Server Actions had streaming issues in Vercel production.
 * This file is kept for reference/fallback.
 */

/**
 * Chat Server Action
 *
 * This action handles chat requests by calling the Cloudflare Worker.
 * The worker runs the Claude Agent SDK in a sandboxed container.
 *
 * Architecture:
 * Next.js (Vercel) → Worker (Cloudflare) → Sandbox (Agent SDK)
 *
 * The worker returns NDJSON events that are streamed directly to the client.
 */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Get worker URL from environment
const WORKER_URL = process.env.CLOUDFLARE_WORKER_URL;

// Validate worker URL is configured
function validateConfig(): void {
  if (!WORKER_URL) {
    throw new Error(
      "CLOUDFLARE_WORKER_URL is not configured. " +
      "Set it in your environment variables to point to the hello-agent-web-worker."
    );
  }
}

export async function chat(messages: ChatMessage[], repoUrl?: string): Promise<ReadableStream> {
  const encoder = new TextEncoder();
  const latestMessage = messages[messages.length - 1].content;

  console.log("[chat] Forwarding request to worker:", {
    workerUrl: WORKER_URL,
    promptLength: latestMessage.length,
    repoUrl: repoUrl || "(default)",
  });

  // Validate configuration
  try {
    validateConfig();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Configuration error";
    return createErrorStream(encoder, errorMessage);
  }

  try {
    // Call the Cloudflare Worker
    const response = await fetch(WORKER_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: latestMessage,
        ...(repoUrl && { repoUrl }),
      }),
    });

    // Even for error responses, the worker returns NDJSON with error details
    // So we can return the body directly and let the frontend parse it
    if (!response.ok && response.body) {
      return response.body;
    }

    if (!response.ok) {
      return createErrorStream(encoder, formatHttpError(response.status));
    }

    // Stream the response body directly
    // The worker returns NDJSON in the same format the frontend expects
    if (!response.body) {
      return createErrorStream(encoder, "No response body from worker");
    }

    return response.body;
  } catch (error) {
    console.error("[chat] Worker error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return createErrorStream(encoder, formatErrorForUser(errorMessage));
  }
}

// Create a ReadableStream with a single error event
function createErrorStream(encoder: TextEncoder, message: string): ReadableStream {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(
          JSON.stringify({ type: "error", content: message }) + "\n"
        )
      );
      controller.close();
    },
  });
}

// Format HTTP errors into user-friendly messages
function formatHttpError(status: number): string {
  switch (status) {
    case 429:
      return "Too many requests. Please wait a moment and try again.";
    case 500:
    case 502:
    case 503:
      return "The AI service is temporarily unavailable. Please try again.";
    default:
      return `Request failed with status ${status}`;
  }
}

// Format technical errors into user-friendly messages
function formatErrorForUser(error: string): string {
  if (error.includes("fetch") || error.includes("network")) {
    return "Unable to reach the AI service. Please check your connection and try again.";
  }
  if (error.includes("timeout")) {
    return "The request timed out. Please try a simpler question.";
  }
  return `Something went wrong: ${error}`;
}
