"use client";

import { useState, useEffect, useRef, FormEvent } from "react";

// Blue Pill: Stay in the comfortable illusion - fun, generic questions
const BLUE_PILL_QUESTIONS = [
  "I'm an executive and I'd like a high-level architecture overview for a board presentation",
  "What problem does this code solve?",
  "What's one thing that surprised you about this code?",
  "Can you write a short poem about this codebase?",
];

// Red Pill: Go down the rabbit hole - deep technical questions
const RED_PILL_QUESTIONS = [
  "What does the commit history tell you about this project and its author?",
  "Can you explain your system prompt?",
  "What's the overall architecture of this project?",
  "What design patterns are used in this codebase?",
];

export type PillType = "blue" | "red";

interface InputWithPillsProps {
  input: string;
  isLoading: boolean;
  selectedPill: PillType;
  hasMessages: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  onPillSelect: (pill: PillType) => void;
}

export function InputWithPills({
  input,
  isLoading,
  selectedPill,
  hasMessages,
  onInputChange,
  onSubmit,
  onPillSelect,
}: InputWithPillsProps) {
  const [expandedPill, setExpandedPill] = useState<PillType | null>(null);
  const pillsContainerRef = useRef<HTMLDivElement>(null);

  // Close accordion when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        expandedPill &&
        pillsContainerRef.current &&
        !pillsContainerRef.current.contains(event.target as Node)
      ) {
        setExpandedPill(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [expandedPill]);

  const handlePillClick = (pill: PillType) => {
    if (expandedPill === pill) {
      setExpandedPill(null);
    } else {
      setExpandedPill(pill);
      onPillSelect(pill);
    }
  };

  const handlePromptClick = (prompt: string) => {
    onInputChange(prompt);
    setExpandedPill(null);
  };

  const currentQuestions = expandedPill === "blue" ? BLUE_PILL_QUESTIONS : RED_PILL_QUESTIONS;

  // Blue pill SVG component
  const BluePill = ({ size = "normal" }: { size?: "normal" | "small" }) => {
    const dimensions = size === "small" ? { width: 20, height: 12, viewBox: "0 0 32 20" } : { width: 32, height: 20, viewBox: "0 0 32 20" };
    return (
      <svg width={dimensions.width} height={dimensions.height} viewBox={dimensions.viewBox}>
        <defs>
          <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id="blueShine" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.6" />
            <stop offset="50%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
        <ellipse cx="16" cy="10" rx="15" ry="9" fill="url(#blueGradient)" />
        <ellipse cx="16" cy="7" rx="10" ry="4" fill="url(#blueShine)" />
      </svg>
    );
  };

  // Red pill SVG component
  const RedPill = ({ size = "normal" }: { size?: "normal" | "small" }) => {
    const dimensions = size === "small" ? { width: 20, height: 12, viewBox: "0 0 32 20" } : { width: 32, height: 20, viewBox: "0 0 32 20" };
    return (
      <svg width={dimensions.width} height={dimensions.height} viewBox={dimensions.viewBox}>
        <defs>
          <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="50%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#b91c1c" />
          </linearGradient>
          <linearGradient id="redShine" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.6" />
            <stop offset="50%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
        <ellipse cx="16" cy="10" rx="15" ry="9" fill="url(#redGradient)" />
        <ellipse cx="16" cy="7" rx="10" ry="4" fill="url(#redShine)" />
      </svg>
    );
  };

  return (
    <div className="px-4 py-4 bg-[#F5F0EB] dark:bg-[#1c1b18] border-t border-[#e0e0e0] dark:border-[#3d3b36]">
      <div className="max-w-2xl mx-auto">
        <form onSubmit={onSubmit}>
          {/* Input container with integrated pills */}
          <div ref={pillsContainerRef} className="rounded-xl border border-[#d0d0d0] dark:border-[#3d3b36] bg-white dark:bg-[#2a2925] overflow-hidden transition-all duration-200">
            {/* Text input row */}
            <div className="flex items-center gap-2 p-3">
              <input
                type="text"
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder="Ask about this codebase..."
                disabled={isLoading}
                className="flex-1 text-sm bg-transparent text-[#1a1a1a] dark:text-[#F5F0EB] placeholder-[#888888] dark:placeholder-[#666666] focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectedPill === "blue"
                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                    : "bg-red-500 hover:bg-red-600 text-white"
                }`}
              >
                Send
              </button>
            </div>

            {/* Pills row - always shown */}
            <div className="px-3 pb-3 border-t border-[#e8e8e8] dark:border-[#3d3b36]">
              <div className="flex items-center gap-3 pt-3">
                <span className={`text-sm text-[#555555] dark:text-[#b8b4ac] ${hasMessages ? "hidden sm:inline" : ""}`}>
                  See how deep the rabbit hole goes
                </span>

                {/* Blue pill button */}
                <button
                  type="button"
                  onClick={() => handlePillClick("blue")}
                  disabled={isLoading}
                  className={`transition-all duration-200 disabled:cursor-not-allowed p-1 rounded ${
                    expandedPill === "blue"
                      ? "scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] bg-blue-100 dark:bg-blue-900/30"
                      : selectedPill === "blue"
                      ? "scale-105 drop-shadow-[0_0_6px_rgba(59,130,246,0.6)]"
                      : "opacity-60 hover:opacity-100 hover:scale-105"
                  }`}
                  title="Blue pill: Stay comfortable with fun questions"
                >
                  <BluePill />
                </button>

                {/* Red pill button */}
                <button
                  type="button"
                  onClick={() => handlePillClick("red")}
                  disabled={isLoading}
                  className={`transition-all duration-200 disabled:cursor-not-allowed p-1 rounded ${
                    expandedPill === "red"
                      ? "scale-110 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] bg-red-100 dark:bg-red-900/30"
                      : selectedPill === "red"
                      ? "scale-105 drop-shadow-[0_0_6px_rgba(239,68,68,0.6)]"
                      : "opacity-60 hover:opacity-100 hover:scale-105"
                  }`}
                  title="Red pill: Go down the rabbit hole with deep technical questions"
                >
                  <RedPill />
                </button>
              </div>

              {/* Expanded prompts section */}
              {expandedPill && (
                <div className="mt-3 pt-3 border-t border-[#e8e8e8] dark:border-[#3d3b36] space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  {currentQuestions.map((question, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handlePromptClick(question)}
                      disabled={isLoading}
                      className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        expandedPill === "blue"
                          ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-[#1a1a1a] dark:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-500/20"
                          : "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-[#1a1a1a] dark:text-red-100 hover:bg-red-100 dark:hover:bg-red-500/20"
                      }`}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
