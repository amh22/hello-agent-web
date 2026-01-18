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
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
            : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
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
