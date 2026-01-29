/**
 * Auth API Route Handler
 *
 * Proxies authentication requests to the Cloudflare Worker.
 * Returns a token on successful authentication.
 */

import { NextRequest, NextResponse } from "next/server";

// Use Edge runtime for consistency with chat route
export const runtime = "edge";

// Get worker URL from environment
const WORKER_URL = process.env.CLOUDFLARE_WORKER_URL;

export async function POST(request: NextRequest) {
  // Validate configuration
  if (!WORKER_URL) {
    return NextResponse.json(
      { success: false, error: "CLOUDFLARE_WORKER_URL is not configured" },
      { status: 500 }
    );
  }

  // Parse request body
  let body: { password: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!body.password || typeof body.password !== "string") {
    return NextResponse.json(
      { success: false, error: "Missing password" },
      { status: 400 }
    );
  }

  // Build the auth endpoint URL
  const authUrl = WORKER_URL.replace(/\/$/, "") + "/auth";

  try {
    // Call the Cloudflare Worker's /auth endpoint
    const response = await fetch(authUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password: body.password }),
    });

    // Parse and forward the response
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[api/auth] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
