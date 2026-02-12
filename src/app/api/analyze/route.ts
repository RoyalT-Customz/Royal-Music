import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileName, duration, sampleRate, channels, peakLevel, rmsLevel } =
      body as {
        fileName: string;
        duration: number;
        sampleRate: number;
        channels: number;
        peakLevel: number;
        rmsLevel: number;
      };

    if (!fileName || typeof duration !== "number") {
      return NextResponse.json(
        { success: false, error: "Invalid audio metadata." },
        { status: 400 },
      );
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `You are a professional audio mastering engineer. Analyze this audio file's characteristics and suggest optimal enhancement settings for making it sound polished and ready for streaming platforms (Spotify, Apple Music, YouTube, etc.).

Audio file info:
- File name: "${fileName}"
- Duration: ${duration.toFixed(1)} seconds
- Sample rate: ${sampleRate} Hz
- Channels: ${channels}
- Peak level: ${peakLevel.toFixed(4)} (0–1 scale, where 1.0 is digital maximum)
- RMS level: ${rmsLevel.toFixed(4)} (0–1 scale, average loudness)

Based on this analysis:
1. If the peak level is low, suggest gain to bring it up closer to 0.9–0.95.
2. Suggest subtle EQ adjustments based on the likely genre/content (infer from the file name).
3. Suggest gentle compression to glue the mix together.
4. Add makeup gain to compensate for compression.
5. Keep changes tasteful — the goal is to enhance, not drastically change the sound.

Respond in this exact JSON format and nothing else:
{
  "summary": "Brief 1-2 sentence description of what enhancements you recommend and why",
  "genre": "Inferred genre or style from the file name",
  "settings": {
    "gain": <number, normalization multiplier, typically 1.0-2.0>,
    "bass": <number, bass EQ in dB, -6 to +6>,
    "mid": <number, mid EQ in dB, -6 to +6>,
    "treble": <number, treble EQ in dB, -6 to +6>,
    "presence": <number, presence EQ in dB, -6 to +6>,
    "compThreshold": <number, compressor threshold in dB, -30 to -5>,
    "compRatio": <number, compression ratio, 1.5 to 6>,
    "compAttack": <number, attack time in seconds, 0.003 to 0.1>,
    "compRelease": <number, release time in seconds, 0.05 to 0.5>,
    "makeupGain": <number, makeup gain in dB, 0 to 8>
  }
}`,
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Try to parse Claude's JSON response
    const parsed = JSON.parse(text);

    return NextResponse.json({
      success: true,
      summary: parsed.summary || "Standard mastering applied.",
      genre: parsed.genre || "Unknown",
      settings: parsed.settings,
    });
  } catch (error) {
    console.error("[Analyze] Error:", error);

    // Return sensible fallback settings so the user can still enhance
    return NextResponse.json({
      success: true,
      summary:
        "Applying standard mastering: gentle normalization, balanced EQ, and light compression for a polished, streaming-ready sound.",
      genre: "General",
      settings: {
        gain: 1.2,
        bass: 1.5,
        mid: 0.5,
        treble: 1.0,
        presence: 0.5,
        compThreshold: -18,
        compRatio: 3,
        compAttack: 0.01,
        compRelease: 0.15,
        makeupGain: 3,
      },
    });
  }
}
