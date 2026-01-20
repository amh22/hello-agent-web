"use client";

import { useEffect, useState, useCallback } from "react";

const THEME_KEY = "theme";

function applyTheme(dark: boolean) {
  if (dark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
}

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Initialize from localStorage or system preference
    const stored = localStorage.getItem(THEME_KEY);
    const prefersDark = stored
      ? stored === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;

    setIsDark(prefersDark);
    applyTheme(prefersDark);
    setMounted(true);
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark(prev => {
      const newValue = !prev;
      applyTheme(newValue);
      return newValue;
    });
  }, []);

  // Avoid hydration mismatch
  if (!mounted) {
    return (
      <button
        className="p-2 rounded-lg border border-[#1a1a1a] dark:border-[#3d3b36] bg-white dark:bg-[#2a2925] opacity-0"
        aria-label="Toggle theme"
      >
        <span className="w-5 h-5 block" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg border transition-colors ${
        isDark
          ? "border-[#3d3b36] bg-[#2a2925] hover:bg-[#6B4C7A]"
          : "border-[#1a1a1a] bg-black hover:bg-[#1a1a1a]"
      }`}
      aria-label={isDark ? "Switch to light mode (real world)" : "Switch to dark mode (Matrix)"}
      title={isDark ? "Exit the Matrix" : "Enter the Matrix"}
    >
      {isDark ? (
        // Eye icon - "see the real world" (click to switch to light)
        <svg
          className="w-5 h-5 text-[#00ff00] animate-pulse"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
      ) : (
        // Terminal prompt - "enter the Matrix" (click to switch to dark)
        <span className="w-5 h-5 flex items-center justify-center font-mono text-xs text-[#00ff00] font-bold animate-pulse">
          &gt;_
        </span>
      )}
    </button>
  );
}
