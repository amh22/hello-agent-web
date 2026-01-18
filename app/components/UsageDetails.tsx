"use client";

import { useState } from "react";

export interface UsageData {
  total_cost_usd?: number;
  duration_ms?: number;
  num_turns?: number;
  usage?: {
    input_tokens?: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
    output_tokens?: number;
    server_tool_use?: unknown;
    service_tier?: string;
  };
  modelUsage?: Record<
    string,
    {
      inputTokens?: number;
      outputTokens?: number;
      cacheCreationInputTokens?: number;
      cacheReadInputTokens?: number;
      costUSD?: number;
      webSearchRequests?: number;
      contextWindow?: number;
      maxOutputTokens?: number;
    }
  >;
}

interface UsageDetailsProps {
  usage: UsageData;
}

export function UsageDetails({ usage }: UsageDetailsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatCost = (cost?: number) => {
    if (cost === undefined || cost === null) return "N/A";
    return `$${cost.toFixed(4)}`;
  };

  const formatDuration = (ms?: number) => {
    if (ms === undefined || ms === null) return "N/A";
    return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
  };

  const formatNumber = (n?: number) => {
    if (n === undefined || n === null) return "N/A";
    return n.toLocaleString();
  };

  return (
    <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
      >
        <svg
          className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        <span>
          Details ({formatCost(usage.total_cost_usd)} /{" "}
          {formatDuration(usage.duration_ms)})
        </span>
      </button>

      {isExpanded && (
        <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 space-y-2">
          {/* Summary stats */}
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span>
              <strong>Total Cost:</strong> {formatCost(usage.total_cost_usd)}
            </span>
            <span>
              <strong>Duration:</strong> {formatDuration(usage.duration_ms)}
            </span>
            <span>
              <strong>Turns:</strong> {formatNumber(usage.num_turns)}
            </span>
          </div>

          {/* Token usage - calculated from modelUsage for accurate totals */}
          {usage.modelUsage && Object.keys(usage.modelUsage).length > 0 && (
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded p-2">
              <div className="font-medium mb-1">Token Usage</div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {(() => {
                  const totals = Object.values(usage.modelUsage!).reduce(
                    (acc, stats) => ({
                      input: acc.input + (stats.inputTokens ?? 0),
                      output: acc.output + (stats.outputTokens ?? 0),
                      cacheRead: acc.cacheRead + (stats.cacheReadInputTokens ?? 0),
                      cacheCreate: acc.cacheCreate + (stats.cacheCreationInputTokens ?? 0),
                    }),
                    { input: 0, output: 0, cacheRead: 0, cacheCreate: 0 }
                  );
                  return (
                    <>
                      <span>Input: {formatNumber(totals.input)}</span>
                      <span>Output: {formatNumber(totals.output)}</span>
                      {totals.cacheRead > 0 && (
                        <span>Cache Read: {formatNumber(totals.cacheRead)}</span>
                      )}
                      {totals.cacheCreate > 0 && (
                        <span>Cache Create: {formatNumber(totals.cacheCreate)}</span>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Model breakdown */}
          {usage.modelUsage && Object.keys(usage.modelUsage).length > 0 && (
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded p-2">
              <div className="font-medium mb-1">Models Used</div>
              <div className="space-y-1">
                {Object.entries(usage.modelUsage).map(([model, stats]) => (
                  <div key={model} className="flex flex-wrap gap-x-3 gap-y-1">
                    <span className="font-mono text-zinc-700 dark:text-zinc-300">
                      {model}
                    </span>
                    <span>{formatCost(stats.costUSD)}</span>
                    <span className="text-zinc-500">
                      ({formatNumber(stats.inputTokens)} in /{" "}
                      {formatNumber(stats.outputTokens)} out)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw details */}
          <RawDetails usage={usage} />
        </div>
      )}
    </div>
  );
}

function RawDetails({ usage }: { usage: UsageData }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="pt-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
      >
        <svg
          className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        <span>Raw JSON</span>
      </button>

      {isExpanded && (
        <pre className="mt-2 p-2 bg-zinc-100 dark:bg-zinc-900 rounded text-[10px] overflow-x-auto max-h-64 overflow-y-auto">
          {JSON.stringify(usage, null, 2)}
        </pre>
      )}
    </div>
  );
}
