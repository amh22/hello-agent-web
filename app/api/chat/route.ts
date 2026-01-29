/**
 * Chat API Route Handler
 *
 * This route streams responses from the Cloudflare Worker.
 * Using an API Route (instead of Server Action) enables proper streaming.
 *
 * Architecture:
 * Browser → Next.js API Route → Cloudflare Worker → Sandbox (Agent SDK)
 */

import { NextRequest, NextResponse } from "next/server";

// Use Edge runtime for proper streaming without buffering
export const runtime = "edge";

// Get worker URL from environment
const WORKER_URL = process.env.CLOUDFLARE_WORKER_URL;

export async function POST(request: NextRequest) {
  // Validate configuration
  if (!WORKER_URL) {
    return NextResponse.json(
      { error: "CLOUDFLARE_WORKER_URL is not configured" },
      { status: 500 }
    );
  }

  // Parse request body
  let body: {
    prompt: string;
    repoUrl?: string;
    history?: Array<{ role: "user" | "assistant"; content: string }>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.prompt || typeof body.prompt !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid 'prompt' field" },
      { status: 400 }
    );
  }

  // Get Authorization header to forward to worker
  const authHeader = request.headers.get("Authorization");

  console.log("[api/chat] Forwarding request to worker:", {
    workerUrl: WORKER_URL,
    promptLength: body.prompt.length,
    repoUrl: body.repoUrl || "(default)",
    historyLength: body.history?.length || 0,
    hasAuth: !!authHeader,
  });

  try {
    // Call the Cloudflare Worker
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader && { Authorization: authHeader }),
      },
      body: JSON.stringify({
        prompt: body.prompt,
        ...(body.repoUrl && { repoUrl: body.repoUrl }),
        ...(body.history?.length && { history: body.history }),
      }),
    });

    // Even for error responses, forward the worker's body (it's NDJSON with error info)
    if (!response.ok) {
      console.error("[api/chat] Worker error:", response.status);
      // The worker returns NDJSON even for errors, so forward it
      if (response.body) {
        return new Response(response.body, {
          status: response.status,
          headers: {
            "Content-Type": "application/x-ndjson",
          },
        });
      }
      // Fallback if no body
      const errorJson = JSON.stringify({ type: "error", content: `Request failed with status ${response.status}` }) + "\n";
      return new Response(errorJson, {
        status: response.status,
        headers: { "Content-Type": "application/x-ndjson" },
      });
    }

    // Stream the response body directly to the client
    if (!response.body) {
      return NextResponse.json(
        { error: "No response body from worker" },
        { status: 500 }
      );
    }

    // Return a streaming response with proper headers
    return new Response(response.body, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Accel-Buffering": "no", // Disable nginx buffering
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("[api/chat] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
