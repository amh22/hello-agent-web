"use server";

export interface AuthResult {
  success: boolean;
  token?: string;
  error?: string;
}

export async function verifyPassword(password: string): Promise<AuthResult> {
  // Call the worker directly (server action has access to server env vars)
  const workerUrl = process.env.CLOUDFLARE_WORKER_URL;

  if (!workerUrl) {
    console.error("[auth] CLOUDFLARE_WORKER_URL is not configured");
    return { success: false, error: "Authentication service not configured" };
  }

  const authUrl = workerUrl.replace(/\/$/, "") + "/auth";

  try {
    const response = await fetch(authUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[auth] Error:", error);
    return { success: false, error: "Authentication failed" };
  }
}
