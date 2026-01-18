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
    <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3 mb-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <span className="font-medium">Agent working...</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
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
              className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400"
            >
              <span className="text-green-500">✓</span>
              <span>{item.tool}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span
            className="inline-block w-1.5 h-1.5 bg-zinc-400 rounded-full animate-pulse"
          />
          <span
            className="inline-block w-1.5 h-1.5 bg-zinc-400 rounded-full animate-pulse"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="inline-block w-1.5 h-1.5 bg-zinc-400 rounded-full animate-pulse"
            style={{ animationDelay: "300ms" }}
          />
          <span className="ml-1">Starting...</span>
        </div>
      )}
    </div>
  );
}
