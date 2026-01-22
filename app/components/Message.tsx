"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  pillColor?: "blue" | "red";
  answeredFromContext?: boolean;
}

// Preprocess markdown to ensure headings have proper newlines before them
function preprocessMarkdown(text: string): string {
  // Add newline before headings that don't have one (e.g., "text.# Heading" -> "text.\n\n# Heading")
  return text.replace(/([^\n])(#{1,6}\s)/g, '$1\n\n$2');
}

export function Message({ role, content, isStreaming, pillColor = "blue", answeredFromContext }: MessageProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isUser = role === "user";
  const processedContent = preprocessMarkdown(content);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isExpanded) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isExpanded]);

  const getUserBubbleClasses = () => {
    if (pillColor === "red") {
      return "bg-red-100 dark:bg-red-600 text-red-900 dark:text-white border-red-300 dark:border-red-500";
    }
    return "bg-blue-100 dark:bg-blue-600 text-blue-900 dark:text-white border-blue-300 dark:border-blue-500";
  };

  const markdownContent = (
    <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:mt-4 prose-headings:mb-2 prose-headings:font-semibold prose-h1:text-base prose-h2:text-sm prose-h3:text-sm prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0 prose-pre:bg-[#1a1a1a] prose-pre:dark:bg-[#1c1b18] prose-code:text-[#e879f9] prose-code:dark:text-[#c084fc] prose-hr:my-4 prose-hr:border-[#3d3b36] prose-table:border-collapse prose-th:border prose-th:border-[#3d3b36] prose-th:px-3 prose-th:py-2 prose-td:border prose-td:border-[#3d3b36] prose-td:px-3 prose-td:py-2">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{processedContent}</ReactMarkdown>
    </div>
  );

  return (
    <>
      <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
        <div
          className={`max-w-[80%] rounded-2xl px-4 py-3 border ${
            isUser
              ? getUserBubbleClasses()
              : "bg-white dark:bg-[#2a2925] text-[#1a1a1a] dark:text-[#F5F0EB] border-[#1a1a1a] dark:border-[#3d3b36]"
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="text-sm font-medium opacity-60">
              {isUser ? "You" : "Agent"}
            </div>
            {!isUser && !isStreaming && (
              <button
                onClick={() => setIsExpanded(true)}
                className="opacity-40 hover:opacity-100 transition-opacity"
                title="Expand message"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            )}
          </div>
          <div className="text-sm leading-relaxed">
            {isUser ? (
              <span className="whitespace-pre-wrap">{content}</span>
            ) : (
              markdownContent
            )}
            {isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
            )}
          </div>
          {/* Expand button at bottom for assistant messages */}
          {!isUser && !isStreaming && (
            <div className="flex justify-center mt-3">
              <button
                onClick={() => setIsExpanded(true)}
                className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-full bg-[#f5f5f5] dark:bg-[#3d3b36] hover:bg-[#e8e8e8] dark:hover:bg-[#4d4b46] text-[#666666] dark:text-[#a8a49c] transition-colors"
              >
                Expand
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Modal */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsExpanded(false)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#2a2925] border border-[#1a1a1a] dark:border-[#3d3b36] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a] dark:border-[#3d3b36] bg-white dark:bg-[#2a2925]">
              <div className="text-sm font-medium opacity-60">Agent</div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 rounded-lg hover:bg-[#f0f0f0] dark:hover:bg-[#3d3b36] transition-colors"
                title="Close (Esc)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Modal content */}
            <div className="p-6 text-[#1a1a1a] dark:text-[#F5F0EB]">
              {answeredFromContext && (
                <div className="mb-5 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 text-sm text-green-700 dark:text-green-400">
                  Answered from conversation context (no tools were called)
                </div>
              )}
              <div className="prose dark:prose-invert max-w-none prose-headings:mt-4 prose-headings:mb-2 prose-headings:font-semibold prose-h1:text-[22px] prose-h2:text-lg prose-h3:text-base prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0 prose-pre:bg-[#1a1a1a] prose-pre:dark:bg-[#1c1b18] prose-code:text-[#e879f9] prose-code:dark:text-[#c084fc] prose-hr:my-4 prose-hr:border-[#3d3b36] prose-table:border-collapse prose-th:border prose-th:border-[#3d3b36] prose-th:px-3 prose-th:py-2 prose-td:border prose-td:border-[#3d3b36] prose-td:px-3 prose-td:py-2">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{processedContent}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
