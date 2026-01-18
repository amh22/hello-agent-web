"use client";

export interface ToolUse {
  tool: string;
  timestamp: number;
}

interface ActivityPanelProps {
  toolHistory: ToolUse[];
  turnCount: number;
  elapsedTime: number;
}

export function ActivityPanel({ toolHistory, turnCount, elapsedTime }: ActivityPanelProps) {
  return (
    <div className="bg-white dark:bg-[#2a2925] rounded-xl border border-[#1a1a1a] dark:border-[#3d3b36] p-3 mb-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-xs text-[#1a1a1a] dark:text-[#F5F0EB]">
          <span className="inline-block w-2 h-2 bg-[#6B4C7A] rounded-full animate-pulse" />
          <span className="font-medium">Agent working...</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-[#666666] dark:text-[#a8a49c] font-mono">
          {turnCount > 0 && <span>Turn {turnCount}</span>}
          {toolHistory.length > 0 && <span>{toolHistory.length} tools</span>}
          <span>{elapsedTime}s</span>
        </div>
      </div>

      {/* Tool history */}
      {toolHistory.length > 0 ? (
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {toolHistory.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-xs text-[#666666] dark:text-[#a8a49c]"
            >
              <span className="text-[#6B4C7A]">✓</span>
              <span>{item.tool}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-[#666666] dark:text-[#a8a49c]">
          <span
            className="inline-block w-1.5 h-1.5 bg-[#666666] dark:bg-[#a8a49c] rounded-full animate-pulse"
          />
          <span
            className="inline-block w-1.5 h-1.5 bg-[#666666] dark:bg-[#a8a49c] rounded-full animate-pulse"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="inline-block w-1.5 h-1.5 bg-[#666666] dark:bg-[#a8a49c] rounded-full animate-pulse"
            style={{ animationDelay: "300ms" }}
          />
          <span className="ml-1">Starting...</span>
        </div>
      )}
    </div>
  );
}
