import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import Replicate from "replicate";

// Allow up to 5 minutes for music generation on serverless platforms
export const maxDuration = 300;

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ── Claude-powered helpers ───────────────────────────────────────────────────

/**
 * Use Claude to enhance a user's music prompt into a detailed,
 * MusicGen-optimized description and generate a creative title.
 */
async function enhanceWithClaude(
  userPrompt: string,
  style?: string
): Promise<{ enhancedPrompt: string; title: string }> {
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `You are a music production expert. Given this user request for AI music generation, do two things:

1. **Enhanced prompt**: Rewrite it into a detailed, descriptive prompt optimized for an AI music generator (MusicGen). Add specific details about instruments, tempo, mood, texture, and production style. Keep it under 200 words. Do NOT include lyrics or vocal instructions — instrumental only.
${style ? `The user wants this style: ${style}` : ""}

2. **Title**: Create a short, creative, catchy title for this track (2-4 words).

User's request: "${userPrompt}"

Respond in this exact JSON format and nothing else:
{"enhancedPrompt": "...", "title": "..."}`,
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";
    const parsed = JSON.parse(text);
    return {
      enhancedPrompt: parsed.enhancedPrompt || userPrompt,
      title: parsed.title || generateFallbackTitle(userPrompt),
    };
  } catch (error) {
    console.warn("[Claude] Enhancement failed, using original prompt:", error);
    return {
      enhancedPrompt: style ? `${userPrompt} (style: ${style})` : userPrompt,
      title: generateFallbackTitle(userPrompt),
    };
  }
}

/**
 * Fallback title generator when Claude is unavailable.
 */
function generateFallbackTitle(prompt: string): string {
  const words = prompt.split(/\s+/).filter((w) => w.length > 3);
  const styleParts = words.slice(0, 3).map((w) => w.replace(/[^a-zA-Z]/g, ""));
  if (styleParts.length === 0) return "Untitled Track";

  const capitalized = styleParts.map(
    (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
  );
  return capitalized.join(" ");
}

// ── Replicate music generation ───────────────────────────────────────────────

const POLL_INTERVAL_MS = 2_000; // check every 2 seconds
const MAX_POLL_ATTEMPTS = 150; // 150 * 2s = 5 minutes max

/**
 * Create a prediction on Replicate's MusicGen model and poll until the audio
 * file is ready.  Returns the public mp3 URL.
 */
async function generateMusic(prompt: string): Promise<string> {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error(
      "REPLICATE_API_TOKEN is not configured. Add it to your environment variables."
    );
  }

  // 1. Create the prediction
  let prediction = await replicate.predictions.create({
    model: "meta/musicgen",
    input: {
      prompt,
      duration: 15, // seconds of audio to generate
      output_format: "mp3",
      normalization_strategy: "peak",
    },
  });

  console.log(
    `[MusicGen] Prediction ${prediction.id} created — status: ${prediction.status}`
  );

  // 2. Poll until the prediction reaches a terminal state
  let attempts = 0;

  while (
    prediction.status !== "succeeded" &&
    prediction.status !== "failed" &&
    prediction.status !== "canceled"
  ) {
    if (attempts >= MAX_POLL_ATTEMPTS) {
      throw new Error(
        "Music generation timed out after 5 minutes. Please try again."
      );
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    prediction = await replicate.predictions.get(prediction.id);
    attempts++;

    if (attempts % 5 === 0) {
      console.log(
        `[MusicGen] Prediction ${prediction.id} — status: ${prediction.status} (attempt ${attempts})`
      );
    }
  }

  // 3. Handle terminal states
  if (prediction.status === "failed") {
    const errorDetail =
      typeof prediction.error === "string"
        ? prediction.error
        : JSON.stringify(prediction.error) || "Unknown error";
    throw new Error(`Music generation failed: ${errorDetail}`);
  }

  if (prediction.status === "canceled") {
    throw new Error("Music generation was canceled.");
  }

  // 4. Extract the audio URL from the output
  const output = prediction.output;

  if (typeof output === "string") {
    return output;
  }

  if (Array.isArray(output) && output.length > 0) {
    return String(output[0]);
  }

  throw new Error("No audio URL was returned from the model.");
}

// ── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, style } = body as { prompt: string; style?: string };

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { success: false, error: "A valid prompt is required." },
        { status: 400 }
      );
    }

    // Use Claude to enhance the prompt and generate a creative title
    console.log(`[Claude] Enhancing prompt: "${prompt}"`);
    const { enhancedPrompt, title } = await enhanceWithClaude(prompt, style);
    console.log(`[Claude] Enhanced prompt: "${enhancedPrompt}"`);
    console.log(`[Claude] Title: "${title}"`);

    const audioUrl = await generateMusic(enhancedPrompt);

    return NextResponse.json({
      success: true,
      audioUrl,
      title,
    });
  } catch (error) {
    console.error("Generation error:", error);

    const message =
      error instanceof Error ? error.message : "An unknown error occurred.";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
