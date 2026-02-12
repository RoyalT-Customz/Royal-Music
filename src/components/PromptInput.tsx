"use client";

import { useState } from "react";

interface PromptInputProps {
  onGenerate: (prompt: string) => void;
  isLoading: boolean;
  credits: number;
}

const EXAMPLE_PROMPTS = [
  "A chill lo-fi hip hop beat with jazzy piano and rain sounds",
  "Epic orchestral trailer music with heavy drums and brass",
  "Upbeat pop song with catchy guitar riff and summer vibes",
  "Dark ambient electronic with deep bass and ethereal pads",
  "Acoustic folk ballad with fingerpicked guitar and soft vocals",
];

export default function PromptInput({
  onGenerate,
  isLoading,
  credits,
}: PromptInputProps) {
  const [prompt, setPrompt] = useState("");

  const noCredits = credits <= 0;

  const handleSubmit = () => {
    if (prompt.trim() && !isLoading && !noCredits) {
      onGenerate(prompt.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Input area */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-500" />
        <div className="relative glass rounded-2xl p-1.5 glow-border group-focus-within:glow-border-active transition-shadow duration-300">
          <div className="flex items-end gap-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the music you want to create..."
              rows={3}
              className="flex-1 bg-transparent text-white placeholder-zinc-500 text-sm sm:text-base px-4 py-3 resize-none focus:outline-none leading-relaxed"
            />
            <button
              onClick={handleSubmit}
              disabled={!prompt.trim() || isLoading || noCredits}
              className="flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 disabled:from-zinc-700 disabled:to-zinc-700 disabled:text-zinc-500 text-white font-medium text-sm px-5 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-brand-500/20 hover:shadow-brand-500/40 disabled:shadow-none mb-1.5 mr-1 shrink-0"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <span>Generating</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
                  </svg>
                  <span>Generate</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Out of credits notice */}
      {noCredits && (
        <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-red-400">You&apos;re out of credits.</span>
          <button className="text-sm font-semibold text-brand-400 hover:text-brand-300 underline underline-offset-2 transition-colors">
            Upgrade to continue
          </button>
        </div>
      )}

      {/* Example prompts */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs text-zinc-600">Try:</span>
        {EXAMPLE_PROMPTS.slice(0, 3).map((example, i) => (
          <button
            key={i}
            onClick={() => setPrompt(example)}
            className="text-xs text-zinc-500 hover:text-zinc-300 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-full px-3 py-1.5 transition-all duration-200"
          >
            {example.length > 40 ? example.slice(0, 40) + "..." : example}
          </button>
        ))}
      </div>
    </div>
  );
}
