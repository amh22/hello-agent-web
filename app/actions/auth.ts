"use server";

export interface AuthResult {
  success: boolean;
  token?: string;
  error?: string;
}

export async function verifyPassword(password: string): Promise<AuthResult> {
  // Call the API route which proxies to the worker
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/auth`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      }
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[auth] Error:", error);
    return { success: false, error: "Authentication failed" };
  }
}
