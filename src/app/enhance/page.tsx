"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Navbar from "@/components/Navbar";
import BackgroundEffects from "@/components/BackgroundEffects";
import {
  analyzeAudio,
  processAudio,
  audioBufferToWav,
  drawWaveform,
  type EnhanceSettings,
  type AudioAnalysis,
} from "@/lib/audioProcessor";

// ── Page states ──────────────────────────────────────────────────────────────

type PageState =
  | "idle"        // waiting for upload
  | "loading"     // reading file into AudioBuffer
  | "analyzing"   // Claude is analyzing the track
  | "ready"       // showing AI suggestions + controls
  | "processing"  // applying effects
  | "done";       // showing before/after + download

// ── Component ────────────────────────────────────────────────────────────────

export default function EnhancePage() {
  // State
  const [pageState, setPageState] = useState<PageState>("idle");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [enhancedBuffer, setEnhancedBuffer] = useState<AudioBuffer | null>(null);
  const [analysis, setAnalysis] = useState<AudioAnalysis | null>(null);
  const [settings, setSettings] = useState<EnhanceSettings | null>(null);
  const [aiSummary, setAiSummary] = useState("");
  const [aiGenre, setAiGenre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Audio playback
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);
  const [enhancedBlob, setEnhancedBlob] = useState<Blob | null>(null);
  const [playingOriginal, setPlayingOriginal] = useState(false);
  const [playingEnhanced, setPlayingEnhanced] = useState(false);
  const originalAudioRef = useRef<HTMLAudioElement | null>(null);
  const enhancedAudioRef = useRef<HTMLAudioElement | null>(null);

  // Canvas refs for waveforms
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const enhancedCanvasRef = useRef<HTMLCanvasElement>(null);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Draw waveforms when buffers change ──
  useEffect(() => {
    if (audioBuffer && originalCanvasRef.current) {
      drawWaveform(originalCanvasRef.current, audioBuffer, "#71717a");
    }
  }, [audioBuffer, pageState]);

  useEffect(() => {
    if (enhancedBuffer && enhancedCanvasRef.current) {
      drawWaveform(enhancedCanvasRef.current, enhancedBuffer, "#8533ff");
    }
  }, [enhancedBuffer]);

  // ── Cleanup object URLs on unmount ──
  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      if (enhancedUrl) URL.revokeObjectURL(enhancedUrl);
    };
  }, [originalUrl, enhancedUrl]);

  // ── File handling ──────────────────────────────────────────────────────────

  const handleFile = useCallback(async (file: File) => {
    // Validate file type
    if (!file.type.startsWith("audio/")) {
      setError("Please upload an audio file (MP3, WAV, FLAC, OGG, etc.)");
      return;
    }

    // Max 50 MB
    if (file.size > 50 * 1024 * 1024) {
      setError("File is too large. Please upload a file under 50 MB.");
      return;
    }

    setError(null);
    setFileName(file.name);
    setFileSize(file.size);
    setPageState("loading");

    try {
      // Decode the audio file
      const arrayBuffer = await file.arrayBuffer();
      const audioCtx = new AudioContext();
      const decoded = await audioCtx.decodeAudioData(arrayBuffer);
      await audioCtx.close();

      setAudioBuffer(decoded);

      // Create an object URL for original playback
      const url = URL.createObjectURL(file);
      setOriginalUrl(url);

      // Analyze the audio
      const audioAnalysis = analyzeAudio(decoded);
      setAnalysis(audioAnalysis);

      // Send to Claude for AI analysis
      setPageState("analyzing");

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          duration: audioAnalysis.duration,
          sampleRate: audioAnalysis.sampleRate,
          channels: audioAnalysis.channels,
          peakLevel: audioAnalysis.peakLevel,
          rmsLevel: audioAnalysis.rmsLevel,
        }),
      });

      const json = await res.json();

      if (json.success && json.settings) {
        setSettings(json.settings);
        setAiSummary(json.summary);
        setAiGenre(json.genre || "General");
        setPageState("ready");
      } else {
        throw new Error(json.error || "Failed to analyze audio.");
      }
    } catch (err) {
      console.error("Error processing file:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to process the audio file. Try a different format.",
      );
      setPageState("idle");
    }
  }, []);

  // ── Drag and drop ──────────────────────────────────────────────────────────

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  // ── Enhancement ────────────────────────────────────────────────────────────

  const handleEnhance = async () => {
    if (!audioBuffer || !settings) return;

    setPageState("processing");

    try {
      // Small delay so the UI can update
      await new Promise((r) => setTimeout(r, 100));

      const processed = await processAudio(audioBuffer, settings);
      setEnhancedBuffer(processed);

      // Convert to WAV for playback and download
      const wavBlob = audioBufferToWav(processed);
      setEnhancedBlob(wavBlob);

      const url = URL.createObjectURL(wavBlob);
      setEnhancedUrl(url);

      setPageState("done");
    } catch (err) {
      console.error("Enhancement error:", err);
      setError("Failed to process audio. Please try again.");
      setPageState("ready");
    }
  };

  // ── Audio playback helpers ─────────────────────────────────────────────────

  const toggleOriginal = () => {
    if (!originalAudioRef.current) return;
    if (playingOriginal) {
      originalAudioRef.current.pause();
    } else {
      enhancedAudioRef.current?.pause();
      setPlayingEnhanced(false);
      originalAudioRef.current.play();
    }
    setPlayingOriginal(!playingOriginal);
  };

  const toggleEnhanced = () => {
    if (!enhancedAudioRef.current) return;
    if (playingEnhanced) {
      enhancedAudioRef.current.pause();
    } else {
      originalAudioRef.current?.pause();
      setPlayingOriginal(false);
      enhancedAudioRef.current.play();
    }
    setPlayingEnhanced(!playingEnhanced);
  };

  // ── Reset ──────────────────────────────────────────────────────────────────

  const handleReset = () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (enhancedUrl) URL.revokeObjectURL(enhancedUrl);
    setPageState("idle");
    setFileName("");
    setFileSize(0);
    setAudioBuffer(null);
    setEnhancedBuffer(null);
    setAnalysis(null);
    setSettings(null);
    setAiSummary("");
    setAiGenre("");
    setError(null);
    setOriginalUrl(null);
    setEnhancedUrl(null);
    setEnhancedBlob(null);
    setPlayingOriginal(false);
    setPlayingEnhanced(false);
    setShowAdvanced(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Slider update helper ───────────────────────────────────────────────────

  const updateSetting = (key: keyof EnhanceSettings, value: number) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  // ── Format helpers ─────────────────────────────────────────────────────────

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <main className="relative min-h-screen">
      <BackgroundEffects />
      <Navbar credits={5} />

      <section className="relative z-10 flex flex-col items-center px-4 pt-32 sm:pt-40 pb-20">
        {/* ── Header ── */}
        <div className="text-center mb-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-full px-4 py-1.5 mb-6">
            <svg className="w-3.5 h-3.5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-xs text-zinc-400 font-medium">
              AI-Powered Audio Enhancement
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-4">
            Enhance Your{" "}
            <span className="text-gradient">Music</span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Upload your track, let AI analyze it, and download a polished,
            streaming-ready version.
          </p>
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="w-full max-w-2xl mb-6 animate-fade-in">
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-3.5">
              <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-sm text-red-300">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* STATE: idle — Upload area                      */}
        {/* ═══════════════════════════════════════════════ */}
        {pageState === "idle" && (
          <div className="w-full max-w-2xl animate-fade-in">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative flex flex-col items-center justify-center
                rounded-2xl border-2 border-dashed cursor-pointer
                transition-all duration-300 py-16 px-6
                ${isDragging
                  ? "border-brand-500 bg-brand-500/10 scale-[1.02]"
                  : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]"
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileInput}
                className="hidden"
              />

              {/* Upload icon */}
              <div className={`
                w-16 h-16 rounded-2xl flex items-center justify-center mb-5
                ${isDragging
                  ? "bg-brand-500/20 border-brand-500/30"
                  : "bg-white/[0.04] border-white/[0.06]"
                }
                border transition-all duration-300
              `}>
                <svg className={`w-7 h-7 transition-colors duration-300 ${isDragging ? "text-brand-400" : "text-zinc-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>

              <p className="text-sm font-medium text-zinc-300 mb-1.5">
                {isDragging ? "Drop your track here" : "Drop your audio file here"}
              </p>
              <p className="text-xs text-zinc-500 mb-4">
                or click to browse
              </p>
              <div className="flex items-center gap-3 text-[10px] text-zinc-600 uppercase tracking-wider font-medium">
                <span>MP3</span>
                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                <span>WAV</span>
                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                <span>FLAC</span>
                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                <span>OGG</span>
                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                <span>Max 50 MB</span>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* STATE: loading — Decoding the audio file       */}
        {/* ═══════════════════════════════════════════════ */}
        {pageState === "loading" && (
          <div className="w-full max-w-2xl animate-fade-in">
            <div className="glass rounded-2xl p-10 text-center">
              <div className="w-12 h-12 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center mx-auto mb-5 animate-pulse-glow">
                <svg className="w-6 h-6 text-brand-400 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Reading Audio File</h3>
              <p className="text-sm text-zinc-500">
                Decoding <span className="text-zinc-300">{fileName}</span> ({formatSize(fileSize)})...
              </p>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* STATE: analyzing — Claude is analyzing         */}
        {/* ═══════════════════════════════════════════════ */}
        {pageState === "analyzing" && (
          <div className="w-full max-w-2xl animate-fade-in">
            <div className="glass rounded-2xl p-10 text-center animate-pulse-glow">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500/20 to-pink-500/20 border border-brand-500/30 flex items-center justify-center mx-auto mb-5">
                <svg className="w-6 h-6 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">AI Analyzing Your Track</h3>
              <p className="text-sm text-zinc-500">
                Claude is listening to <span className="text-zinc-300">{fileName}</span> and crafting the perfect enhancements...
              </p>

              {/* Analysis stats preview */}
              {analysis && (
                <div className="flex items-center justify-center gap-6 mt-6 text-xs text-zinc-600">
                  <span>{formatDuration(analysis.duration)}</span>
                  <span>{analysis.sampleRate / 1000}kHz</span>
                  <span>{analysis.channels === 1 ? "Mono" : "Stereo"}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* STATE: ready — Show AI suggestions + controls  */}
        {/* ═══════════════════════════════════════════════ */}
        {pageState === "ready" && settings && analysis && (
          <div className="w-full max-w-2xl space-y-5 animate-fade-in">
            {/* File info card */}
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500/20 to-pink-500/20 border border-white/[0.06] flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-brand-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-white truncate">{fileName}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                    <span>{formatSize(fileSize)}</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-700" />
                    <span>{formatDuration(analysis.duration)}</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-700" />
                    <span>{analysis.sampleRate / 1000}kHz</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-700" />
                    <span>{analysis.channels === 1 ? "Mono" : "Stereo"}</span>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors p-2"
                  title="Remove file"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Original waveform */}
              <canvas
                ref={originalCanvasRef}
                className="w-full h-16 mt-4 rounded-lg"
              />

              {/* Play original */}
              {originalUrl && (
                <div className="mt-3">
                  <audio
                    ref={originalAudioRef}
                    src={originalUrl}
                    onEnded={() => setPlayingOriginal(false)}
                  />
                  <button
                    onClick={toggleOriginal}
                    className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors"
                  >
                    {playingOriginal ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                    {playingOriginal ? "Pause Original" : "Preview Original"}
                  </button>
                </div>
              )}
            </div>

            {/* AI suggestion card */}
            <div className="glass rounded-2xl p-5 glow-border">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-pink-500 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">AI Mastering Suggestion</h3>
                  <span className="text-[10px] uppercase tracking-wider text-brand-400 font-medium">{aiGenre}</span>
                </div>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">{aiSummary}</p>
            </div>

            {/* Advanced controls toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mx-auto"
            >
              <svg className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
              {showAdvanced ? "Hide Advanced Controls" : "Show Advanced Controls"}
            </button>

            {/* Advanced sliders */}
            {showAdvanced && (
              <div className="glass rounded-2xl p-5 space-y-4 animate-fade-in">
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Enhancement Controls
                </h4>

                {/* Gain */}
                <SliderControl
                  label="Gain"
                  value={settings.gain}
                  min={0.5}
                  max={3}
                  step={0.05}
                  format={(v) => `${v.toFixed(2)}x`}
                  onChange={(v) => updateSetting("gain", v)}
                />

                <div className="border-t border-white/[0.04] pt-4">
                  <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-medium mb-3">Equalizer</p>
                </div>

                <SliderControl
                  label="Bass"
                  value={settings.bass}
                  min={-12}
                  max={12}
                  step={0.5}
                  format={(v) => `${v > 0 ? "+" : ""}${v.toFixed(1)} dB`}
                  onChange={(v) => updateSetting("bass", v)}
                />
                <SliderControl
                  label="Mid"
                  value={settings.mid}
                  min={-12}
                  max={12}
                  step={0.5}
                  format={(v) => `${v > 0 ? "+" : ""}${v.toFixed(1)} dB`}
                  onChange={(v) => updateSetting("mid", v)}
                />
                <SliderControl
                  label="Treble"
                  value={settings.treble}
                  min={-12}
                  max={12}
                  step={0.5}
                  format={(v) => `${v > 0 ? "+" : ""}${v.toFixed(1)} dB`}
                  onChange={(v) => updateSetting("treble", v)}
                />
                <SliderControl
                  label="Presence"
                  value={settings.presence}
                  min={-12}
                  max={12}
                  step={0.5}
                  format={(v) => `${v > 0 ? "+" : ""}${v.toFixed(1)} dB`}
                  onChange={(v) => updateSetting("presence", v)}
                />

                <div className="border-t border-white/[0.04] pt-4">
                  <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-medium mb-3">Compression</p>
                </div>

                <SliderControl
                  label="Threshold"
                  value={settings.compThreshold}
                  min={-50}
                  max={0}
                  step={1}
                  format={(v) => `${v} dB`}
                  onChange={(v) => updateSetting("compThreshold", v)}
                />
                <SliderControl
                  label="Ratio"
                  value={settings.compRatio}
                  min={1}
                  max={20}
                  step={0.5}
                  format={(v) => `${v.toFixed(1)}:1`}
                  onChange={(v) => updateSetting("compRatio", v)}
                />
                <SliderControl
                  label="Makeup Gain"
                  value={settings.makeupGain}
                  min={0}
                  max={12}
                  step={0.5}
                  format={(v) => `+${v.toFixed(1)} dB`}
                  onChange={(v) => updateSetting("makeupGain", v)}
                />
              </div>
            )}

            {/* Enhance button */}
            <button
              onClick={handleEnhance}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-500 to-pink-500 hover:from-brand-600 hover:to-pink-600 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-brand-500/20 hover:shadow-brand-500/40 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Enhance Track
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* STATE: processing — Applying effects           */}
        {/* ═══════════════════════════════════════════════ */}
        {pageState === "processing" && (
          <div className="w-full max-w-2xl animate-fade-in">
            <div className="glass rounded-2xl p-10 text-center animate-pulse-glow">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-pink-500 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-brand-500/30">
                <svg className="w-7 h-7 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Enhancing Your Track</h3>
              <p className="text-sm text-zinc-500">
                Applying normalization, EQ, and compression...
              </p>
              <div className="flex items-center justify-center gap-1.5 mt-4">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-6 rounded-full bg-brand-500/40"
                    style={{
                      animation: `pulse 1s ease-in-out ${i * 0.15}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* STATE: done — Before/After + Download          */}
        {/* ═══════════════════════════════════════════════ */}
        {pageState === "done" && enhancedBuffer && (
          <div className="w-full max-w-2xl space-y-5 animate-fade-in">
            {/* Success header */}
            <div className="text-center mb-2">
              <div className="w-12 h-12 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Enhancement Complete</h3>
              <p className="text-sm text-zinc-500 mt-1">Compare the results and download your enhanced track.</p>
            </div>

            {/* Before / After comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Original */}
              <div className="glass rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 bg-white/[0.04] px-2 py-0.5 rounded">Before</span>
                </div>
                <canvas ref={originalCanvasRef} className="w-full h-14 rounded-lg mb-3" />
                {originalUrl && (
                  <>
                    <audio
                      ref={originalAudioRef}
                      src={originalUrl}
                      onEnded={() => setPlayingOriginal(false)}
                    />
                    <button
                      onClick={toggleOriginal}
                      className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-400 hover:text-white text-xs font-medium transition-all"
                    >
                      {playingOriginal ? (
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                      {playingOriginal ? "Pause" : "Play Original"}
                    </button>
                  </>
                )}
              </div>

              {/* Enhanced */}
              <div className="glass rounded-2xl p-5 glow-border">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded">After</span>
                </div>
                <canvas ref={enhancedCanvasRef} className="w-full h-14 rounded-lg mb-3" />
                {enhancedUrl && (
                  <>
                    <audio
                      ref={enhancedAudioRef}
                      src={enhancedUrl}
                      onEnded={() => setPlayingEnhanced(false)}
                    />
                    <button
                      onClick={toggleEnhanced}
                      className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 text-brand-300 hover:text-brand-200 text-xs font-medium transition-all"
                    >
                      {playingEnhanced ? (
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                      {playingEnhanced ? "Pause" : "Play Enhanced"}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Download button */}
            {enhancedBlob && (
              <a
                href={enhancedUrl || "#"}
                download={`${fileName.replace(/\.[^.]+$/, "")}_enhanced.wav`}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-500 to-pink-500 hover:from-brand-600 hover:to-pink-600 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-brand-500/20 hover:shadow-brand-500/40"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Enhanced Track (WAV)
              </a>
            )}

            {/* Upload another */}
            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.1] text-zinc-400 hover:text-white text-sm font-medium transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Enhance Another Track
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SliderControl — Reusable range slider component
// ═══════════════════════════════════════════════════════════════════════════════

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-400">{label}</span>
        <span className="text-xs text-zinc-500 tabular-nums font-mono">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-white/[0.06] rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-3.5
          [&::-webkit-slider-thumb]:h-3.5
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-brand-500
          [&::-webkit-slider-thumb]:shadow-lg
          [&::-webkit-slider-thumb]:shadow-brand-500/30
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:hover:bg-brand-400
          [&::-webkit-slider-thumb]:transition-colors
          [&::-moz-range-thumb]:w-3.5
          [&::-moz-range-thumb]:h-3.5
          [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-brand-500
          [&::-moz-range-thumb]:border-0
          [&::-moz-range-thumb]:cursor-pointer"
      />
    </div>
  );
}
