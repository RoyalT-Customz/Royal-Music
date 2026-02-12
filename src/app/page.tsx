"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import PromptInput from "@/components/PromptInput";
import MusicPlayer from "@/components/MusicPlayer";
import BackgroundEffects from "@/components/BackgroundEffects";

interface Track {
  id: string;
  prompt: string;
  status: string;
  message?: string;
}

export default function Home() {
  const [track, setTrack] = useState<Track | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async (prompt: string) => {
    setIsLoading(true);
    setTrack(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const json = await res.json();

      if (json.success) {
        setTrack(json.data);
      } else {
        setTrack({
          id: `error_${Date.now()}`,
          prompt,
          status: "error",
          message: json.error || "Something went wrong.",
        });
      }
    } catch {
      setTrack({
        id: `error_${Date.now()}`,
        prompt,
        status: "error",
        message: "Network error. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen">
      <BackgroundEffects />
      <Navbar />

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pt-16">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-full px-4 py-1.5 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
            </span>
            <span className="text-xs text-zinc-400 font-medium">
              Powered by AI — Now in Beta
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
        <PromptInput onGenerate={handleGenerate} isLoading={isLoading} />

        {/* Music Player */}
        <MusicPlayer track={track} isLoading={isLoading} />

        {/* Stats bar */}
        <div className="flex items-center justify-center gap-8 sm:gap-12 mt-16 mb-8">
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
