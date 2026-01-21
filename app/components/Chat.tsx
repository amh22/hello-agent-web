"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { Message } from "./Message";
import { UsageDetails, type UsageData } from "./UsageDetails";
import { ActivityPanel, type ToolUse } from "./ActivityPanel";
import { chat } from "../actions/chat";

// Toggle between Server Action and API Route for streaming
// Server Action: simpler, but may have buffering issues in some environments
// API Route: uses Edge runtime, guaranteed streaming support
const USE_SERVER_ACTION = false; // Use API Route for reliable streaming in production

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface MessageWithUsage extends ChatMessage {
  usage?: UsageData;
  pillColor?: "blue" | "red";
}

// Blue Pill: Stay in the comfortable illusion - fun, generic questions
const BLUE_PILL_QUESTIONS = [
  "Explain this project in simple terms",
  "I'm an executive and I'd like a high-level architecture overview for a board presentation",
  "Summarize this codebase in 3 sentences",
  "How is this project organized?",
  "If this codebase was a movie, what genre would it be?",
  "What problem does this code solve?",
  "What's the most interesting file in this project?",
  "Can you write a short poem about this codebase?",
  "What would you name this project if you had to rename it?",
  "What's one thing that surprised you about this code?",
];

// Red Pill: Go down the rabbit hole - deep technical questions
const RED_PILL_QUESTIONS = [
  "What's the overall architecture of this project?",
  "What are the main entry points to this codebase?",
  "What dependencies does this project use?",
  "Find all TODO comments and summarize them",
  "Explain how authentication works in this codebase",
  "Where should I start if I want to contribute?",
  "What testing framework is being used?",
  "Are there any potential security vulnerabilities?",
  "What design patterns are used in this codebase?",
  "Find any code that could be refactored and explain why",
  "How is error handling implemented?",
  "What's the data flow through this application?",
  "What AI model does this codebase use?",
];

type PillType = "blue" | "red";

// Validation patterns for GitHub owner and repo names
const OWNER_PATTERN = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
const REPO_PATTERN = /^[a-zA-Z0-9._-]+$/;

// Default repo (this app's own codebase)
const DEFAULT_OWNER = "amh22";
const DEFAULT_REPO = "hello-agent-web";

// Number of previous questions to include in conversation history
// Each question includes its corresponding assistant response
// Can be configured via NEXT_PUBLIC_HISTORY_QUESTIONS env var
const HISTORY_QUESTIONS = parseInt(process.env.NEXT_PUBLIC_HISTORY_QUESTIONS || "8", 10);

function validateOwner(owner: string): string | null {
  if (!owner.trim()) return "Owner is required";
  if (owner.length > 39) return "Owner name too long";
  if (!OWNER_PATTERN.test(owner)) return "Invalid owner name";
  return null;
}

function validateRepo(repo: string): string | null {
  if (!repo.trim()) return "Repo is required";
  if (repo.length > 100) return "Repo name too long";
  if (!REPO_PATTERN.test(repo)) return "Invalid repo name";
  return null;
}

export function Chat() {
  const [messages, setMessages] = useState<MessageWithUsage[]>([]);
  const [input, setInput] = useState("");
  const [repoOwner, setRepoOwner] = useState(DEFAULT_OWNER);
  const [repoName, setRepoName] = useState(DEFAULT_REPO);
  const [repoError, setRepoError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [toolHistory, setToolHistory] = useState<ToolUse[]>([]);
  const [turnCount, setTurnCount] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedPill, setSelectedPill] = useState<PillType>("blue");
  const [questionIndex, setQuestionIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);

  const currentQuestions = selectedPill === "blue" ? BLUE_PILL_QUESTIONS : RED_PILL_QUESTIONS;
  const currentQuestion = currentQuestions[questionIndex % currentQuestions.length];

  const handlePrevQuestion = () => {
    setQuestionIndex((prev) => (prev - 1 + currentQuestions.length) % currentQuestions.length);
  };

  const handleNextQuestion = () => {
    setQuestionIndex((prev) => (prev + 1) % currentQuestions.length);
  };

  const handlePillSelect = (pill: PillType) => {
    setSelectedPill(pill);
    setQuestionIndex(0);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, toolHistory]);

  // Timer for elapsed time during loading
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Validate repo inputs
    const ownerError = validateOwner(repoOwner);
    const repoNameError = validateRepo(repoName);
    if (ownerError || repoNameError) {
      setRepoError(ownerError || repoNameError);
      return;
    }
    setRepoError(null);

    // Construct the repo URL from validated inputs
    const repoUrl = `https://github.com/${repoOwner}/${repoName}`;

    const userMessage: MessageWithUsage = { role: "user", content: input.trim(), pillColor: selectedPill };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setStreamingContent("");
    setToolHistory([]);
    setTurnCount(0);
    setElapsedTime(0);
    startTimeRef.current = Date.now();

    try {
      let stream: ReadableStream<Uint8Array>;

      // Collect conversation history (last N questions and their responses)
      // Each question = 1 user message + 1 assistant response = 2 array items
      const history = messages.slice(-(HISTORY_QUESTIONS * 2)).map(m => ({
        role: m.role,
        content: m.content,
      }));

      if (USE_SERVER_ACTION) {
        // Option 1: Server Action - simpler, streams response.body directly
        stream = await chat([...messages, userMessage], repoUrl);
      } else {
        // Option 2: API Route - Edge runtime, guaranteed streaming
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: userMessage.content,
            repoUrl,
            history,
          }),
        });

        if (!response.body) {
          throw new Error(`Request failed: ${response.status}`);
        }
        stream = response.body;
      }

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let capturedUsage: UsageData | null = null;
      let toolCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          try {
            const event = JSON.parse(line);
            if (event.type === "text") {
              // Add paragraph break between text blocks from different turns
              if (fullContent && !fullContent.endsWith("\n")) {
                fullContent += "\n\n";
              }
              fullContent += event.content;
              setStreamingContent(fullContent);
            } else if (event.type === "tool_use") {
              toolCount++;
              setToolHistory((prev) => [...prev, { tool: event.tool, detail: event.detail, timestamp: Date.now() }]);
            } else if (event.type === "turn") {
              setTurnCount(event.turn);
            } else if (event.type === "usage") {
              capturedUsage = event.data;
            } else if (event.type === "result") {
              // Final result from SDK - use if we didn't get streaming text
              if (!fullContent && event.content) {
                fullContent = event.content;
                setStreamingContent(fullContent);
              }
            } else if (event.type === "error") {
              fullContent += `\n\nError: ${event.content}`;
              setStreamingContent(fullContent);
            }
          } catch {
            // Skip invalid JSON lines
          }
        }
      }

      // Add the complete assistant message with usage data
      if (fullContent) {
        const totalDurationMs = Date.now() - startTimeRef.current;
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: fullContent,
            usage: capturedUsage
              ? { ...capturedUsage, num_tools: toolCount, total_duration_ms: totalDurationMs }
              : undefined
          },
        ]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, an error occurred. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
      setStreamingContent("");
      setToolHistory([]);
    }
  };

  const handleSuggestionClick = (question: string) => {
    setInput(question);
  };

  return (
    <div className="flex flex-col h-[600px] max-w-2xl mx-auto bg-white dark:bg-[#0d0d0d]/95 rounded-2xl shadow-lg border border-[#1a1a1a] dark:border-[#00ff00]/15 dark:shadow-[0_0_20px_rgba(0,255,0,0.08)]">
      {/* GitHub repo inputs */}
      <div className="border-b border-[#1a1a1a] dark:border-[#3d3b36] px-6 py-4">
        <label className="block text-sm font-medium text-[#1a1a1a] dark:text-[#d5d0c8] mb-2">
          GitHub Repository
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#666666] dark:text-[#a8a49c]">github.com/</span>
            <input
              type="text"
              value={repoOwner}
              onChange={(e) => {
                setRepoOwner(e.target.value);
                setRepoError(null);
              }}
              placeholder="owner"
              disabled={isLoading}
              className={`w-28 px-3 py-2 text-sm rounded-lg border bg-white dark:bg-[#1c1b18] text-[#1a1a1a] dark:text-[#F5F0EB] placeholder-[#888888] dark:placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-[#6B4C7A] disabled:opacity-50 ${
                !repoOwner.trim()
                  ? "border-red-400/50 dark:border-red-500/50"
                  : "border-[#1a1a1a] dark:border-[#3d3b36]"
              }`}
            />
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-[180px]">
            <span className="text-sm text-[#666666] dark:text-[#a8a49c]">/</span>
            <input
              type="text"
              value={repoName}
              onChange={(e) => {
                setRepoName(e.target.value);
                setRepoError(null);
              }}
              placeholder="repo"
              disabled={isLoading}
              className={`flex-1 px-3 py-2 text-sm rounded-lg border bg-white dark:bg-[#1c1b18] text-[#1a1a1a] dark:text-[#F5F0EB] placeholder-[#888888] dark:placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-[#6B4C7A] disabled:opacity-50 ${
                !repoName.trim()
                  ? "border-red-400/50 dark:border-red-500/50"
                  : "border-[#1a1a1a] dark:border-[#3d3b36]"
              }`}
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-[#888888] dark:text-[#777777]">
          Enter a public GitHub repository to explore. Private repos are not supported.
        </p>
        {repoError && (
          <p className="mt-1 text-xs text-red-500 dark:text-red-400">{repoError}</p>
        )}
      </div>

      {/* Header with pill toggles and question carousel */}
      <div className="border-b border-[#1a1a1a] dark:border-[#3d3b36] px-4 py-3">
        <div className="flex items-center justify-center gap-3 mb-2">
          <p className="text-sm text-[#666666] dark:text-[#d5d0c8]">
            See how deep the rabbit hole goes
          </p>

          {/* Pill toggles */}
          <div className="flex gap-3">
            <button
              onClick={() => handlePillSelect("blue")}
              disabled={isLoading}
              className={`transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                selectedPill === "blue"
                  ? "scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                  : "opacity-50 hover:opacity-100 hover:scale-105"
              }`}
              title="Blue pill: Stay comfortable with fun questions"
            >
              <svg width="24" height="15" viewBox="0 0 32 20">
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
            </button>
            <button
              onClick={() => handlePillSelect("red")}
              disabled={isLoading}
              className={`transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                selectedPill === "red"
                  ? "scale-110 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                  : "opacity-50 hover:opacity-100 hover:scale-105"
              }`}
              title="Red pill: Go down the rabbit hole with deep technical questions"
            >
              <svg width="24" height="15" viewBox="0 0 32 20">
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
            </button>
          </div>
        </div>

        {/* Question carousel */}
        <div className="flex items-center justify-center gap-1 sm:gap-2 px-1">
          <button
            onClick={handlePrevQuestion}
            disabled={isLoading}
            className="p-1 text-[#666666] dark:text-[#a8a49c] hover:text-[#1a1a1a] dark:hover:text-[#F5F0EB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            title="Previous question"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={() => handleSuggestionClick(currentQuestion)}
            disabled={isLoading}
            className={`text-xs px-3 sm:px-4 py-2 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1 min-w-0 ${
              selectedPill === "blue"
                ? "bg-blue-50 dark:bg-blue-500/15 border-blue-300 dark:border-blue-500/40 text-[#1a1a1a] dark:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-500/25"
                : "bg-red-50 dark:bg-red-500/15 border-red-300 dark:border-red-500/40 text-[#1a1a1a] dark:text-red-100 hover:bg-red-100 dark:hover:bg-red-500/25"
            }`}
          >
            {currentQuestion}
          </button>

          <button
            onClick={handleNextQuestion}
            disabled={isLoading}
            className="p-1 text-[#666666] dark:text-[#a8a49c] hover:text-[#1a1a1a] dark:hover:text-[#F5F0EB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            title="Next question"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message, index) => (
          <div key={index}>
            <Message role={message.role} content={message.content} pillColor={message.pillColor || selectedPill} />
            {message.role === "assistant" && message.usage && (
              <div className="flex justify-start mb-4 -mt-2">
                <div className="max-w-[80%] px-4">
                  {(!message.usage.num_tools || message.usage.num_tools === 0) && (
                    <div className="mb-2 px-3 py-2 rounded-lg bg-[#f0e6d3] dark:bg-[#2a2520] border border-[#d4a574] dark:border-[#8b6914] text-sm text-[#8b6914] dark:text-[#d4a574]">
                      Answered from conversation context (no tools called)
                    </div>
                  )}
                  <UsageDetails usage={message.usage} />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Streaming message and activity panel during loading */}
        {isLoading && (
          <>
            {streamingContent && (
              <Message role="assistant" content={streamingContent} isStreaming pillColor={selectedPill} />
            )}
            <ActivityPanel toolHistory={toolHistory} turnCount={turnCount} elapsedTime={elapsedTime} />
          </>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-[#1a1a1a] dark:border-[#3d3b36] p-4"
      >
        <div className="flex h-[38px] gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this codebase..."
            disabled={isLoading}
            className="flex-1 h-full px-3 text-sm rounded-lg border border-[#1a1a1a] dark:border-[#3d3b36] bg-white dark:bg-[#1c1b18] text-[#1a1a1a] dark:text-[#F5F0EB] placeholder-[#666666] dark:placeholder-[#a8a49c] focus:outline-none focus:ring-2 focus:ring-[#6B4C7A] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={`h-full px-4 text-sm rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              selectedPill === "blue"
                ? "bg-blue-100 dark:bg-blue-600 text-blue-900 dark:text-white border-blue-300 dark:border-blue-500 hover:bg-blue-200 dark:hover:bg-blue-500"
                : "bg-red-100 dark:bg-red-600 text-red-900 dark:text-white border-red-300 dark:border-red-500 hover:bg-red-200 dark:hover:bg-red-500"
            }`}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
