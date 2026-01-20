"use client";

interface MessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  pillColor?: "blue" | "red";
}

export function Message({ role, content, isStreaming, pillColor = "blue" }: MessageProps) {
  const isUser = role === "user";

  const getUserBubbleClasses = () => {
    if (pillColor === "red") {
      return "bg-red-100 dark:bg-red-600 text-red-900 dark:text-white border-red-300 dark:border-red-500";
    }
    return "bg-blue-100 dark:bg-blue-600 text-blue-900 dark:text-white border-blue-300 dark:border-blue-500";
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 border ${
          isUser
            ? getUserBubbleClasses()
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
