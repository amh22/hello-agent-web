"use client";

import { useRef, useEffect } from "react";

export interface ToolUse {
  tool: string;
  detail?: string;
  timestamp: number;
}

interface ActivityPanelProps {
  toolHistory: ToolUse[];
  turnCount: number;
  elapsedTime: number;
}

export function ActivityPanel({ toolHistory, turnCount, elapsedTime }: ActivityPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new tools are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [toolHistory]);

  return (
    <div className="bg-white dark:bg-[#2a2925] rounded-xl border border-[#1a1a1a] dark:border-[#3d3b36] mb-4 overflow-hidden">
      {/* Fixed header - always visible within panel */}
      <div className="flex items-center justify-between p-3 pb-2 border-b border-[#1a1a1a]/10 dark:border-[#3d3b36]/50">
        <div className="flex items-center gap-2 text-xs text-[#1a1a1a] dark:text-[#F5F0EB]">
          <span className="inline-block w-2 h-2 bg-[#6B4C7A] rounded-full animate-pulse" />
          <span className="font-medium animate-pulse">Agent working...</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-[#666666] dark:text-[#a8a49c] font-mono">
          {turnCount > 0 && <span>Turn {turnCount}</span>}
          {toolHistory.length > 0 && <span>{toolHistory.length} Tools</span>}
          <span>{elapsedTime}s</span>
        </div>
      </div>

      {/* Tool history - scrolls independently, auto-scrolls to latest */}
      <div ref={scrollRef} className="p-3 pt-2 max-h-40 overflow-y-auto">
        {toolHistory.length > 0 ? (
          <div className="space-y-1">
            {toolHistory.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-xs text-[#666666] dark:text-[#a8a49c] overflow-hidden"
              >
                <span className="text-[#6B4C7A] flex-shrink-0">✓</span>
                <span className="flex-shrink-0 font-medium">{item.tool}</span>
                {item.detail && (
                  <span className="text-[#888888] dark:text-[#8a8680] truncate" title={item.detail}>
                    {item.detail}
                  </span>
                )}
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
            <span className="ml-1">Reviewing context...</span>
          </div>
        )}
      </div>
    </div>
  );
}
