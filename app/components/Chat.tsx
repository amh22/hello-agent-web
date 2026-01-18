"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { Message } from "./Message";
import { UsageDetails, type UsageData } from "./UsageDetails";
import { ActivityPanel, type ToolUse } from "./ActivityPanel";
import { chat, type ChatMessage } from "../actions/chat";

interface MessageWithUsage extends ChatMessage {
  usage?: UsageData;
}

const ALL_QUESTIONS = [
  "How does the streaming work in this app?",
  "What's the tech stack of this project?",
  "Find all React components and describe them",
  "Explain how you process my messages",
  "How many React components are using hooks?",
  "What is the Anthropic API key that you are using?",
  "Are you using any sort of session management?",
  "Can you explain session management in simple, non-technical terms?",
  "What's another good question I could ask about this codebase?",
  "Can you write a short poem about this codebase?",
  "What file are you reading right now?",
];

function getRandomQuestions(count: number): string[] {
  const shuffled = [...ALL_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function Chat() {
  const [messages, setMessages] = useState<MessageWithUsage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [toolHistory, setToolHistory] = useState<ToolUse[]>([]);
  const [turnCount, setTurnCount] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [displayedQuestions, setDisplayedQuestions] = useState<string[]>(() => getRandomQuestions(4));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);

  const handleShuffle = () => {
    setDisplayedQuestions(getRandomQuestions(4));
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

    const userMessage: ChatMessage = { role: "user", content: input.trim() };
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
      const stream = await chat(newMessages);
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let capturedUsage: UsageData | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          try {
            const event = JSON.parse(line);
            if (event.type === "text") {
              fullContent += event.content;
              setStreamingContent(fullContent);
            } else if (event.type === "tool_use") {
              setToolHistory((prev) => [...prev, { tool: event.tool, timestamp: Date.now() }]);
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
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: fullContent, usage: capturedUsage ?? undefined },
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
    <div className="flex flex-col h-[600px] max-w-2xl mx-auto bg-white dark:bg-[#2a2925] rounded-2xl shadow-lg border border-[#1a1a1a] dark:border-[#3d3b36]">
      {/* Header with suggested questions */}
      <div className="border-b border-[#1a1a1a] dark:border-[#3d3b36] px-6 py-6">
        <p className="text-[#666666] dark:text-[#d5d0c8] text-center mb-4">
          Ask me anything about my own source code!
        </p>
        <div className="flex flex-wrap gap-3 justify-center items-center">
          {displayedQuestions.map((question, index) => (
            <button
              key={question}
              onClick={() => handleSuggestionClick(question)}
              disabled={isLoading}
              className="text-xs px-3 py-2 rounded-lg bg-white dark:bg-[#1c1b18] border border-[#1a1a1a] dark:border-[#3d3b36] text-[#1a1a1a] dark:text-[#c5c0b8] hover:bg-[#E8D5F0] dark:hover:bg-[#6B4C7A] dark:hover:text-[#F5F0EB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {question}
            </button>
          ))}
          <button
            onClick={handleShuffle}
            disabled={isLoading}
            className="p-2 rounded-full border border-[#1a1a1a] dark:border-[#3d3b36] text-[#666666] dark:text-[#a8a49c] hover:bg-[#E8D5F0] dark:hover:bg-[#6B4C7A] hover:text-[#1a1a1a] dark:hover:text-[#F5F0EB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Shuffle questions"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message, index) => (
          <div key={index}>
            <Message role={message.role} content={message.content} />
            {message.role === "assistant" && message.usage && (
              <div className="flex justify-start mb-4 -mt-2">
                <div className="max-w-[80%] px-4">
                  <UsageDetails usage={message.usage} />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Streaming message */}
        {isLoading && streamingContent && (
          <Message role="assistant" content={streamingContent} isStreaming />
        )}

        {/* Activity panel during loading */}
        {isLoading && !streamingContent && (
          <ActivityPanel toolHistory={toolHistory} turnCount={turnCount} elapsedTime={elapsedTime} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-[#1a1a1a] dark:border-[#3d3b36] p-4"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about my source code..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-full border border-[#1a1a1a] dark:border-[#3d3b36] bg-white dark:bg-[#1c1b18] text-[#1a1a1a] dark:text-[#F5F0EB] placeholder-[#666666] dark:placeholder-[#a8a49c] focus:outline-none focus:ring-2 focus:ring-[#6B4C7A] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-2 rounded-full bg-[#E8D5F0] dark:bg-[#6B4C7A] text-[#1a1a1a] dark:text-[#F5F0EB] font-medium border border-[#1a1a1a] dark:border-[#3d3b36] hover:bg-[#d9c4e3] dark:hover:bg-[#7d5a8c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
