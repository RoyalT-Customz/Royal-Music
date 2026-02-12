"use client";

import { useRef, useState } from "react";

export interface Song {
  id: string;
  title: string;
  prompt: string;
  audioUrl: string;
  createdAt: number; // timestamp ms
}

interface SongCardProps {
  song: Song;
  index: number;
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 5) return "Just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function SongCard({ song, index }: SongCardProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (t: number) => {
    if (!t || !isFinite(t)) return "0:00";
    const mins = Math.floor(t / 60);
    const secs = Math.floor(t % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * duration;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="song-card glass rounded-2xl overflow-hidden glow-border hover:glow-border-active transition-all duration-500 group"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Card Header */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Album art icon */}
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500/20 to-pink-500/20 border border-white/[0.06] flex items-center justify-center shrink-0 group-hover:from-brand-500/30 group-hover:to-pink-500/30 transition-all duration-500">
              <svg
                className="w-5 h-5 text-brand-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-white truncate">
                {song.title}
              </h3>
              <p className="text-xs text-zinc-500 truncate mt-0.5">
                {song.prompt}
              </p>
            </div>
          </div>
          <span className="shrink-0 text-[10px] font-medium text-zinc-500 mt-1 whitespace-nowrap">
            {timeAgo(song.createdAt)}
          </span>
        </div>
      </div>

      {/* Custom Audio Player */}
      <div className="px-5 pb-2">
        <audio
          ref={audioRef}
          src={song.audioUrl}
          preload="metadata"
          onTimeUpdate={() =>
            setCurrentTime(audioRef.current?.currentTime ?? 0)
          }
          onLoadedMetadata={() =>
            setDuration(audioRef.current?.duration ?? 0)
          }
          onEnded={() => setIsPlaying(false)}
        />

        <div className="flex items-center gap-3">
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="w-9 h-9 rounded-full bg-brand-500/20 hover:bg-brand-500/30 border border-brand-500/30 flex items-center justify-center transition-all duration-200 shrink-0"
          >
            {isPlaying ? (
              <svg className="w-4 h-4 text-brand-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-brand-300 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Progress bar */}
          <div className="flex-1 min-w-0">
            <div
              className="relative h-1.5 bg-white/[0.06] rounded-full cursor-pointer group/bar"
              onClick={handleSeek}
            >
              <div
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-[width] duration-150"
                style={{ width: `${progress}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-brand-400 rounded-full opacity-0 group-hover/bar:opacity-100 transition-opacity shadow-lg shadow-brand-500/50"
                style={{ left: `calc(${progress}% - 6px)` }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-zinc-600 tabular-nums">
                {formatTime(currentTime)}
              </span>
              <span className="text-[10px] text-zinc-600 tabular-nums">
                {formatTime(duration)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Download button */}
      <div className="px-5 pb-4 pt-1">
        <a
          href={song.audioUrl}
          download={`${song.title}.mp3`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.1] text-zinc-400 hover:text-white text-xs font-medium transition-all duration-200"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </a>
      </div>
    </div>
  );
}
