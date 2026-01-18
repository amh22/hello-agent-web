"use client";

import { useState, useEffect, FormEvent, ReactNode } from "react";
import { verifyPassword } from "../actions/auth";

interface PasswordGateProps {
  children: ReactNode;
}

const SESSION_KEY = "hello-agent-authenticated";

export function PasswordGate({ children }: PasswordGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check sessionStorage for existing authentication
    const authenticated = sessionStorage.getItem(SESSION_KEY);
    if (authenticated === "true") {
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
      if (result.success) {
        sessionStorage.setItem(SESSION_KEY, "true");
        setIsAuthenticated(true);
      } else {
        setError("Incorrect password. Please try again.");
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
    <div className="max-w-md mx-auto">
      <div className="bg-white dark:bg-[#2a2925] rounded-2xl shadow-lg border border-[#1a1a1a] dark:border-[#3d3b36] p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#E8D5F0] dark:bg-[#6B4C7A] mb-4">
            <svg
              className="w-6 h-6 text-[#6B4C7A] dark:text-[#E8D5F0]"
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
          <h2 className="text-xl font-semibold text-[#1a1a1a] dark:text-[#F5F0EB]">
            Enter Password
          </h2>
          <p className="text-sm text-[#666666] dark:text-[#a8a49c] mt-2">
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
              className="w-full px-4 py-3 rounded-xl border border-[#1a1a1a] dark:border-[#3d3b36] bg-white dark:bg-[#1c1b18] text-[#1a1a1a] dark:text-[#F5F0EB] placeholder-[#666666] dark:placeholder-[#a8a49c] focus:outline-none focus:ring-2 focus:ring-[#6B4C7A] disabled:opacity-50"
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
            className="w-full py-3 rounded-full bg-[#E8D5F0] dark:bg-[#6B4C7A] text-[#1a1a1a] dark:text-[#F5F0EB] font-medium border border-[#1a1a1a] dark:border-[#3d3b36] hover:bg-[#d9c4e3] dark:hover:bg-[#7d5a8c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Verifying..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
