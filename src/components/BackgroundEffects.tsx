"use client";

export default function BackgroundEffects() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-hero-glow opacity-60" />

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-[15%] w-72 h-72 bg-brand-500/[0.04] rounded-full blur-3xl animate-float" />
      <div
        className="absolute top-1/3 right-[10%] w-96 h-96 bg-purple-500/[0.03] rounded-full blur-3xl animate-float"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="absolute bottom-1/4 left-[40%] w-64 h-64 bg-pink-500/[0.03] rounded-full blur-3xl animate-float"
        style={{ animationDelay: "4s" }}
      />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}
