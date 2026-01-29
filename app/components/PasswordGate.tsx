"use client";

import { useState, useEffect, FormEvent, ReactNode } from "react";
import { verifyPassword } from "../actions/auth";

interface PasswordGateProps {
  children: ReactNode;
}

// Storage key for auth token
export const AUTH_TOKEN_KEY = "neo-auth-token";

export function PasswordGate({ children }: PasswordGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check localStorage for existing token
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    try {
      const result = await verifyPassword(password);
      if (result.success && result.token) {
        localStorage.setItem(AUTH_TOKEN_KEY, result.token);
        setIsAuthenticated(true);
      } else {
        setError(result.error || "Incorrect password. Please try again.");
        setPassword("");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show nothing while checking authentication status
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-[#666666] dark:text-[#a8a49c]">Loading...</div>
      </div>
    );
  }

  // Show children if authenticated
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Show password form
  return (
    <div className="h-full overflow-y-auto flex flex-col items-center px-4 py-8 sm:justify-center max-lg:landscape:justify-start max-lg:landscape:py-4">
      {/* Neo Branding */}
      <h1 className="text-5xl md:text-6xl font-bold text-[#1a1a1a] dark:text-[#F5F0EB] mb-4 tracking-tight">
        Neo
      </h1>
      <p className="text-lg md:text-xl text-[#666666] dark:text-[#a8a49c] mb-2 text-center">
        See the code for what it really is
      </p>
      <p className="text-sm text-[#888888] dark:text-[#777777] max-w-md text-center mb-8">
        Point Neo at any public GitHub repository. It reads, searches, and decodes the codebase for you.
      </p>

      {/* Password Form */}
      <div className="w-full max-w-sm">
        <div className="bg-white/95 dark:bg-[#1c1b18]/95 backdrop-blur-sm rounded-2xl shadow-lg border border-[#d0d0d0] dark:border-[#3d3b36] p-6">
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#f5e6d3] dark:bg-[#3d3b36] mb-3">
              <svg
                className="w-5 h-5 text-[#b8860b] dark:text-[#d4a574]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <p className="text-sm text-[#666666] dark:text-[#a8a49c]">
              This demo is password protected
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                disabled={isSubmitting}
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-[#d0d0d0] dark:border-[#3d3b36] bg-white dark:bg-[#1c1b18] text-[#1a1a1a] dark:text-[#F5F0EB] placeholder-[#666666] dark:placeholder-[#a8a49c] focus:outline-none focus:ring-2 focus:ring-[#6B4C7A] disabled:opacity-50"
              />
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !password.trim()}
              className="w-full py-3 rounded-full bg-[#4a5f52] dark:bg-[#3a4f42] text-[#f0f0f0] font-medium border border-[#1a1a1a] dark:border-[#3d3b36] hover:bg-[#5a6f62] dark:hover:bg-[#4a5f52] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Verifying..." : <>Follow the <span className="text-lg">🐇</span></>}
            </button>
          </form>
        </div>

        {/* Attribution */}
        <div className="mt-6 text-center text-xs text-[#888888] dark:text-[#666666]">
          <span>
            Orchestrated by{" "}
            <a
              href="https://github.com/amh22"
              className="underline hover:text-[#1a1a1a] dark:hover:text-[#a8a49c]"
              target="_blank"
              rel="noopener noreferrer"
            >
              amh
            </a>
          </span>
          <span className="mx-2">|</span>
          <span>
            Powered by{" "}
            <a
              href="https://anthropic.com"
              className="underline hover:text-[#1a1a1a] dark:hover:text-[#a8a49c]"
              target="_blank"
              rel="noopener noreferrer"
            >
              Anthropic
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}
