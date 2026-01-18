"use server";

import { timingSafeEqual } from "crypto";

export interface AuthResult {
  success: boolean;
}

export async function verifyPassword(password: string): Promise<AuthResult> {
  const expectedPassword = process.env.DEMO_PASSWORD;

  if (!expectedPassword) {
    // If no password is set, deny access
    return { success: false };
  }

  // Use timing-safe comparison to prevent timing attacks
  const passwordBuffer = Buffer.from(password);
  const expectedBuffer = Buffer.from(expectedPassword);

  // Ensure both buffers are the same length for timing-safe comparison
  if (passwordBuffer.length !== expectedBuffer.length) {
    return { success: false };
  }

  const isValid = timingSafeEqual(passwordBuffer, expectedBuffer);
  return { success: isValid };
}
