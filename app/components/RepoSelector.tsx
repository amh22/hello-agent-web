"use client";

import { useState } from "react";

interface RepoSelectorProps {
  repoOwner: string;
  repoName: string;
  repoError: string | null;
  isLoading: boolean;
  hasMessages: boolean;
  onOwnerChange: (owner: string) => void;
  onRepoChange: (repo: string) => void;
  onErrorClear: () => void;
  onNewChat: () => void;
}

export function RepoSelector({
  repoOwner,
  repoName,
  repoError,
  isLoading,
  hasMessages,
  onOwnerChange,
  onRepoChange,
  onErrorClear,
  onNewChat,
}: RepoSelectorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [originalOwner, setOriginalOwner] = useState("");
  const [originalRepo, setOriginalRepo] = useState("");

  // GitHub validation patterns - no spaces allowed, validate raw input
  const OWNER_PATTERN = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
  const REPO_PATTERN = /^[a-zA-Z0-9._-]+$/;

  // Validate raw input (catches any spaces)
  const isValidOwner = repoOwner && OWNER_PATTERN.test(repoOwner);
  const isValidRepoName = repoName && REPO_PATTERN.test(repoName);
  const isValidRepo = isValidOwner && isValidRepoName;

  // Use trimmed values for comparison to detect actual changes
  const trimmedOwner = repoOwner.trim();
  const trimmedRepo = repoName.trim();
  const hasRepoChanged = trimmedOwner !== originalOwner.trim() || trimmedRepo !== originalRepo.trim();

  const handleEditClick = () => {
    // Store original values when entering edit mode
    setOriginalOwner(repoOwner);
    setOriginalRepo(repoName);
    setIsEditing(true);
  };

  const handleCancel = () => {
    // Restore original values and close edit mode
    onOwnerChange(originalOwner);
    onRepoChange(originalRepo);
    onErrorClear();
    setIsEditing(false);
  };

  const handleDone = () => {
    // Only called when repo has changed and is valid
    if (isValidRepo && hasRepoChanged) {
      // Trim values before saving
      onOwnerChange(trimmedOwner);
      onRepoChange(trimmedRepo);
      setIsEditing(false);
      onNewChat();
    }
  };

  const handleNewChat = () => {
    onNewChat();
  };

  // GitHub icon SVG
  const GitHubIcon = () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  );

  // Pencil/Edit icon SVG
  const EditIcon = () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );

  // New chat/refresh icon SVG
  const NewChatIcon = () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );

  return (
    <div className="pl-6 pr-16 lg:px-6 py-3 bg-[#FAF9F6] dark:bg-[#1c1b18] border-b border-[#e0e0e0] dark:border-[#3d3b36]">
      <div className="max-w-2xl mx-auto">
        {!isEditing ? (
          /* Compact Badge View */
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* GitHub Badge */}
              <a
                href={`https://github.com/${repoOwner}/${repoName}`}
                target="_blank"
                rel="noopener noreferrer"
                title={`${repoOwner}/${repoName}`}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#2a2925] border border-[#d0d0d0] dark:border-[#3d3b36] hover:border-[#999999] dark:hover:border-[#555555] transition-colors min-w-0"
              >
                <GitHubIcon />
                <span className="text-sm font-medium text-[#1a1a1a] dark:text-[#F5F0EB] truncate max-w-[150px] sm:max-w-[200px] md:max-w-none">
                  {repoOwner}/{repoName}
                </span>
              </a>

              {/* Edit Button */}
              <button
                onClick={handleEditClick}
                disabled={isLoading}
                className="p-1.5 rounded-md bg-[#e8e8e8] dark:bg-[#3d3b36] border border-[#d0d0d0] dark:border-[#4d4b46] text-[#555555] dark:text-[#b8b4ac] hover:bg-[#d8d8d8] dark:hover:bg-[#4d4b46] hover:text-[#1a1a1a] dark:hover:text-[#F5F0EB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Change repository"
              >
                <EditIcon />
              </button>
            </div>

            {/* New Chat Button - only show when there are messages */}
            {hasMessages && (
              <button
                onClick={handleNewChat}
                disabled={isLoading}
                className="flex items-center gap-1.5 p-1.5 md:px-3 md:py-1.5 rounded-md bg-[#e8e8e8] dark:bg-[#3d3b36] border border-[#d0d0d0] dark:border-[#4d4b46] text-[#555555] dark:text-[#b8b4ac] hover:bg-[#d8d8d8] dark:hover:bg-[#4d4b46] hover:text-[#1a1a1a] dark:hover:text-[#F5F0EB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                title="Start new chat"
              >
                <NewChatIcon />
                <span className="hidden md:inline text-sm">New Chat</span>
              </button>
            )}
          </div>
        ) : (
          /* Edit Mode - Input Fields */
          <div className="space-y-2">
            {/* Inputs and buttons - stack on mobile, inline on desktop */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#666666] dark:text-[#a8a49c]">github.com/</span>
                <input
                  type="text"
                  value={repoOwner}
                  onChange={(e) => {
                    onOwnerChange(e.target.value);
                    onErrorClear();
                  }}
                  placeholder="owner"
                  disabled={isLoading}
                  autoFocus
                  className={`flex-1 sm:w-28 sm:flex-none px-3 py-2 text-sm rounded-lg border bg-white dark:bg-[#2a2925] text-[#1a1a1a] dark:text-[#F5F0EB] placeholder-[#888888] dark:placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-[#6B4C7A] disabled:opacity-50 ${
                    !repoOwner.trim()
                      ? "border-red-400/50 dark:border-red-500/50"
                      : "border-[#d0d0d0] dark:border-[#3d3b36]"
                  }`}
                />
              </div>
              <div className="flex items-center gap-2 sm:flex-1 sm:min-w-[180px]">
                <span className="text-sm text-[#666666] dark:text-[#a8a49c]">/</span>
                <input
                  type="text"
                  value={repoName}
                  onChange={(e) => {
                    onRepoChange(e.target.value);
                    onErrorClear();
                  }}
                  placeholder="repo"
                  disabled={isLoading}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border bg-white dark:bg-[#2a2925] text-[#1a1a1a] dark:text-[#F5F0EB] placeholder-[#888888] dark:placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-[#6B4C7A] disabled:opacity-50 ${
                    !repoName.trim()
                      ? "border-red-400/50 dark:border-red-500/50"
                      : "border-[#d0d0d0] dark:border-[#3d3b36]"
                  }`}
                />
              </div>
              {/* Buttons - inline on desktop */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-[#d0d0d0] dark:border-[#3d3b36] text-[#666666] dark:text-[#a8a49c] hover:bg-[#e8e8e8] dark:hover:bg-[#3d3b36] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                {hasRepoChanged && isValidRepo && (
                  <button
                    onClick={handleDone}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-[#1a1a1a] dark:bg-[#F5F0EB] text-white dark:text-[#1a1a1a] hover:bg-[#333333] dark:hover:bg-[#e0dbd4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Change
                  </button>
                )}
              </div>
            </div>

            <p className="text-xs text-[#888888] dark:text-[#777777]">
              Enter a public GitHub repository to explore. Private repos are not supported.
            </p>
            {repoError && (
              <p className="mt-1 text-xs text-red-500 dark:text-red-400">{repoError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
