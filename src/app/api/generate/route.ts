import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "A valid prompt is required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.AI_API_KEY;
    const apiUrl = process.env.AI_API_URL;

    if (!apiKey || !apiUrl || apiKey === "your-api-key-here") {
      // Return a mock response for development
      return NextResponse.json({
        success: true,
        data: {
          id: `track_${Date.now()}`,
          prompt,
          status: "processing",
          message:
            "AI generation is not configured yet. Connect your API in .env.local to enable real generation.",
        },
      });
    }

    // Real API call (replace with your provider's integration)
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate music. Please try again." },
      { status: 500 }
    );
  }
}
