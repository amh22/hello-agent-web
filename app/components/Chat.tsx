"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { Message } from "./Message";
import { UsageDetails, type UsageData } from "./UsageDetails";
import { ActivityPanel, type ToolUse } from "./ActivityPanel";
import { RepoSelector } from "./RepoSelector";
import { InputWithPills, type PillType } from "./InputWithPills";
import { AUTH_TOKEN_KEY } from "./PasswordGate";

// Toggle between Server Action and API Route for streaming
// Server Action: simpler, but may have buffering issues in some environments
// API Route: uses Edge runtime, guaranteed streaming support
// const USE_SERVER_ACTION = false; // Use API Route for reliable streaming in production

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface MessageWithUsage extends ChatMessage {
  usage?: UsageData;
  pillColor?: "blue" | "red";
}

// Validation patterns for GitHub owner and repo names
const OWNER_PATTERN = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
const REPO_PATTERN = /^[a-zA-Z0-9._-]+$/;

// Default repo (this app's own codebase)
const DEFAULT_OWNER = "amh22";
const DEFAULT_REPO = "hello-agent-web";

// Number of previous questions to include in conversation history
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);

  const hasMessages = messages.length > 0 || isLoading;

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    setStreamingContent("");
    setToolHistory([]);
    setSelectedPill("blue");
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
      const history = messages.slice(-(HISTORY_QUESTIONS * 2)).map(m => ({
        role: m.role,
        content: m.content,
      }));

      // API Route - Edge runtime, guaranteed streaming
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          prompt: userMessage.content,
          repoUrl,
          history,
        }),
      });

      // Handle 401 - clear token and reload to show password gate
      if (response.status === 401) {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        window.location.reload();
        return;
      }

      if (!response.body) {
        throw new Error(`Request failed: ${response.status}`);
      }
      stream = response.body;

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

  return (
    <div className="flex flex-col h-full relative z-20">
      {/* Zone 1: Fixed Top - Repo Selector */}
      <div className="shrink-0">
        <RepoSelector
          repoOwner={repoOwner}
          repoName={repoName}
          repoError={repoError}
          isLoading={isLoading}
          hasMessages={messages.length > 0}
          onOwnerChange={setRepoOwner}
          onRepoChange={setRepoName}
          onErrorClear={() => setRepoError(null)}
          onNewChat={handleNewChat}
        />
      </div>

      {/* Zone 2: Scrollable Middle - Messages or Empty State */}
      <div className="flex-1 overflow-y-auto">
        {!hasMessages ? (
          /* Empty State - Branding in center */
          <div className="h-full flex flex-col items-center justify-center pb-8">
            <h1 className="text-5xl md:text-6xl font-bold text-[#1a1a1a] dark:text-[#F5F0EB] mb-4 tracking-tight">
              Neo
            </h1>
            <p className="text-lg md:text-xl text-[#666666] dark:text-[#a8a49c] mb-2 text-center">
              See the code for what it really is
            </p>
            <p className="text-sm text-[#888888] dark:text-[#777777] max-w-md text-center px-6">
              Point Neo at any public GitHub repository. It reads, searches, and decodes the codebase for you.
            </p>
          </div>
        ) : (
          /* Active State - Messages */
          <div className="max-w-2xl mx-auto pl-6 pr-3 pt-4 pb-8">
            {messages.map((message, index) => (
              <div key={index}>
                <Message
                  role={message.role}
                  content={message.content}
                  pillColor={message.pillColor || selectedPill}
                  answeredFromContext={message.role === "assistant" && message.usage && (!message.usage.num_tools || message.usage.num_tools === 0)}
                />
                {message.role === "assistant" && message.usage && (
                  <div className="flex justify-start mb-4 -mt-2">
                    <div className="max-w-[80%] px-4">
                      {(!message.usage.num_tools || message.usage.num_tools === 0) && (
                        <div className="mt-1 mb-3 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 text-sm text-green-700 dark:text-green-400">
                          Answered from conversation context (no tools were called)
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
        )}
      </div>

      {/* Zone 3: Fixed Bottom - Input with Pills */}
      <div className="shrink-0">
        <InputWithPills
          input={input}
          isLoading={isLoading}
          selectedPill={selectedPill}
          hasMessages={hasMessages}
          onInputChange={setInput}
          onSubmit={handleSubmit}
          onPillSelect={setSelectedPill}
        />
      </div>
    </div>
  );
}
