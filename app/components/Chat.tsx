"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { Message } from "./Message";
import { chat, type ChatMessage } from "../actions/chat";

const SUGGESTED_QUESTIONS = [
  "How does the streaming work in this app?",
  "What's the tech stack of this project?",
  "Find all React components and describe them",
  "Explain how you process my messages",
];

export function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [currentTool, setCurrentTool] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setStreamingContent("");
    setCurrentTool(null);

    try {
      const stream = await chat(newMessages);
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

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
              setCurrentTool(event.tool);
            } else if (event.type === "error") {
              fullContent += `\n\nError: ${event.content}`;
              setStreamingContent(fullContent);
            }
          } catch {
            // Skip invalid JSON lines
          }
        }
      }

      // Add the complete assistant message
      if (fullContent) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: fullContent },
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
      setCurrentTool(null);
    }
  };

  const handleSuggestionClick = (question: string) => {
    setInput(question);
  };

  return (
    <div className="flex flex-col h-[600px] max-w-2xl mx-auto bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <p className="text-zinc-500 dark:text-zinc-400 mb-4">
              Ask me anything about my own source code!
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTED_QUESTIONS.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(question)}
                  className="text-xs px-3 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <Message key={index} role={message.role} content={message.content} />
        ))}

        {/* Streaming message */}
        {isLoading && streamingContent && (
          <Message role="assistant" content={streamingContent} isStreaming />
        )}

        {/* Tool indicator */}
        {isLoading && currentTool && (
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mb-4">
            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            Using {currentTool}...
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && !streamingContent && (
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
            <span className="inline-block w-2 h-2 bg-zinc-400 rounded-full animate-pulse" />
            <span className="inline-block w-2 h-2 bg-zinc-400 rounded-full animate-pulse delay-100" />
            <span className="inline-block w-2 h-2 bg-zinc-400 rounded-full animate-pulse delay-200" />
          </div>
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
