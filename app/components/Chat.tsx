"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { Message } from "./Message";
import { UsageDetails, type UsageData } from "./UsageDetails";
import { ActivityPanel, type ToolUse } from "./ActivityPanel";
import { chat, type ChatMessage } from "../actions/chat";

interface MessageWithUsage extends ChatMessage {
  usage?: UsageData;
}

const SUGGESTED_QUESTIONS = [
  "How does the streaming work in this app?",
  "What's the tech stack of this project?",
  "Find all React components and describe them",
  "Explain how you process my messages",
];

export function Chat() {
  const [messages, setMessages] = useState<MessageWithUsage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [toolHistory, setToolHistory] = useState<ToolUse[]>([]);
  const [turnCount, setTurnCount] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);

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
    <div className="flex flex-col h-[600px] max-w-2xl mx-auto bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800">
      {/* Header with suggested questions */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 p-4">
        <p className="text-zinc-500 dark:text-zinc-400 text-center mb-3">
          Ask me anything about my own source code!
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {SUGGESTED_QUESTIONS.map((question, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(question)}
              disabled={isLoading}
              className="text-xs px-3 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {question}
            </button>
          ))}
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
        className="border-t border-zinc-200 dark:border-zinc-800 p-4"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about my source code..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-2 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
