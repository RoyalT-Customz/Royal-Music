"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import PromptInput from "@/components/PromptInput";
import MusicPlayer from "@/components/MusicPlayer";
import BackgroundEffects from "@/components/BackgroundEffects";
import SongCard from "@/components/SongCard";
import type { Song } from "@/components/SongCard";

export default function Home() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [credits, setCredits] = useState(5);

  const handleGenerate = async (prompt: string) => {
    if (credits <= 0) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const json = await res.json();

      if (json.success && json.audioUrl) {
        const newSong: Song = {
          id: crypto.randomUUID(),
          title: json.title || "Untitled Track",
          prompt,
          audioUrl: json.audioUrl,
          createdAt: Date.now(),
        };
        setSongs((prev) => [newSong, ...prev]);
        setCredits((prev) => Math.max(0, prev - 1));
      } else {
        setError(json.error || "Something went wrong.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen">
      <BackgroundEffects />
      <Navbar credits={credits} />

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center px-4 pt-32 sm:pt-40">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-full px-4 py-1.5 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
            </span>
            <span className="text-xs text-zinc-400 font-medium">
              Powered by Claude 4.6 — Now in Beta
            </span>
          </div>

          {/* Headlines */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            Create Music
            <br />
            <span className="text-gradient">With AI</span>
          </h1>

          <p className="text-lg sm:text-xl text-zinc-400 max-w-xl leading-relaxed mb-10">
            Describe your song. Let AI produce it.
            <br className="hidden sm:block" />
            <span className="text-zinc-500">
              From idea to studio-quality track in seconds.
            </span>
          </p>
        </div>

        {/* Prompt Input */}
        <PromptInput onGenerate={handleGenerate} isLoading={isLoading} credits={credits} />

        {/* Loading / Error indicator */}
        <MusicPlayer
          audioUrl={null}
          error={error}
          isLoading={isLoading}
          hasSongs={songs.length > 0}
        />

        {/* Songs Grid */}
        {songs.length > 0 && (
          <div className="w-full max-w-6xl mx-auto mt-10 mb-16">
            <div className="flex items-center justify-between mb-6 px-1">
              <h2 className="text-sm font-semibold text-zinc-300">
                Your Library
                <span className="ml-2 text-xs font-normal text-zinc-600">
                  {songs.length} {songs.length === 1 ? "track" : "tracks"}
                </span>
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {songs.map((song, i) => (
                <SongCard key={song.id} song={song} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Stats bar */}
        <div className="flex items-center justify-center gap-8 sm:gap-12 mt-8 mb-16">
          {[
            { label: "Tracks Created", value: "2.4M+" },
            { label: "Active Users", value: "180K+" },
            { label: "Genres", value: "50+" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-lg sm:text-xl font-semibold text-white">
                {stat.value}
              </p>
              <p className="text-xs text-zinc-600 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
