"use client";

interface MusicPlayerProps {
  audioUrl: string | null;
  error: string | null;
  isLoading: boolean;
  hasSongs?: boolean;
}

export default function MusicPlayer({
  error,
  isLoading,
  hasSongs = false,
}: MusicPlayerProps) {
  // Loading state — show spinner
  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-8">
        <div className="glass rounded-2xl p-8 glow-border-active animate-pulse-glow">
          <div className="flex flex-col items-center gap-4">
            {/* Spinning loader */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg
                className="animate-spin w-12 h-12 text-brand-400"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm text-zinc-300 font-medium">
                Generating your track...
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                This may take a few seconds
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-8 animate-fade-in">
        <div className="glass rounded-2xl p-8 glow-border">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <svg
                className="w-7 h-7 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm text-red-400 font-medium">
                Generation Failed
              </p>
              <p className="text-xs text-zinc-500 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Idle state — only show placeholder if no songs exist yet
  if (!hasSongs) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-8">
        <div className="glass rounded-2xl p-8 text-center glow-border">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <svg
                className="w-7 h-7 text-zinc-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-zinc-500 font-medium">
                Your music will appear here
              </p>
              <p className="text-xs text-zinc-600 mt-1">
                Enter a prompt above to get started
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If songs exist and no loading/error, render nothing (the grid handles display)
  return null;
}
