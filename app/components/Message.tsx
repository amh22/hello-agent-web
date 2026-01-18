"use client";

interface MessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export function Message({ role, content, isStreaming }: MessageProps) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 border ${
          isUser
            ? "bg-[#E8D5F0] dark:bg-[#6B4C7A] text-[#1a1a1a] dark:text-[#F5F0EB] border-[#1a1a1a] dark:border-[#3d3b36]"
            : "bg-white dark:bg-[#2a2925] text-[#1a1a1a] dark:text-[#F5F0EB] border-[#1a1a1a] dark:border-[#3d3b36]"
        }`}
      >
        <div className="text-sm font-medium mb-1 opacity-60">
          {isUser ? "You" : "Agent"}
        </div>
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {content}
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}
