import { NextRequest, NextResponse } from "next/server";

/**
 * Placeholder async function that simulates music generation.
 * Replace this with a real music generation API call (e.g. Suno, MusicGen, etc.)
 */
async function generateMusic(prompt: string): Promise<string> {
  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Return a placeholder audio URL
  return `https://cdn.example.com/tracks/generated_${Date.now()}.mp3`;
}

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

    // Build the full prompt, incorporating style if provided
    const fullPrompt = style ? `${prompt} (style: ${style})` : prompt;

    const audioUrl = await generateMusic(fullPrompt);

    return NextResponse.json({
      success: true,
      audioUrl,
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
