"use client";

interface Track {
  id: string;
  prompt: string;
  status: string;
  message?: string;
}

interface MusicPlayerProps {
  track: Track | null;
  isLoading: boolean;
}

export default function MusicPlayer({ track, isLoading }: MusicPlayerProps) {
  if (!track && !isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-8">
        <div className="glass rounded-2xl p-8 text-center glow-border">
          {/* Idle state */}
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

  return (
    <div className="w-full max-w-2xl mx-auto mt-8">
      <div className="glass rounded-2xl overflow-hidden glow-border-active">
        {/* Track header */}
        <div className="p-6 border-b border-white/[0.06]">
          <div className="flex items-start gap-4">
            {/* Album art placeholder */}
            <div className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-brand-500/20 to-pink-500/20 border border-white/[0.06] flex items-center justify-center shrink-0 overflow-hidden">
              {isLoading ? (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent animate-shimmer" style={{ backgroundSize: "200% 100%" }} />
              ) : null}
              <svg
                className="w-6 h-6 text-brand-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {isLoading ? "Generating your track..." : "Generated Track"}
              </p>
              <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                {track?.prompt || "Processing..."}
              </p>
              {track?.message && (
                <p className="text-xs text-brand-400/80 mt-2">
                  {track.message}
                </p>
              )}
            </div>

            {/* Status badge */}
            <span
              className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${
                isLoading
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              }`}
            >
              {isLoading ? "Processing" : "Ready"}
            </span>
          </div>
        </div>

        {/* Player controls */}
        <div className="p-6">
          {/* Progress bar */}
          <div className="flex items-center gap-3 mb-5">
            <span className="text-xs text-zinc-500 tabular-nums w-8 text-right">
              0:00
            </span>
            <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
              {isLoading ? (
                <div className="h-full w-1/3 bg-gradient-to-r from-brand-500 to-brand-400 rounded-full animate-pulse" />
              ) : (
                <div className="h-full w-0 bg-gradient-to-r from-brand-500 to-brand-400 rounded-full" />
              )}
            </div>
            <span className="text-xs text-zinc-500 tabular-nums w-8">
              {isLoading ? "--:--" : "0:00"}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <button className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-all">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>

            <button
              disabled={isLoading}
              className="w-14 h-14 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 disabled:opacity-50 transition-all"
            >
              <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>

            <button className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-all">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
