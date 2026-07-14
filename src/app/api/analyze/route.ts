import { NextResponse } from "next/server";
import { analyzeWithOpenAI, mockAnalyzeFromImageMeta } from "@/lib/ai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const imageDataUrl = body.imageDataUrl as string | undefined;
    const preferredLanguage = body.preferredLanguage as string | undefined;

    if (!imageDataUrl) {
      return NextResponse.json({ error: "imageDataUrl required" }, { status: 400 });
    }

    const ai = await analyzeWithOpenAI(imageDataUrl, preferredLanguage);
    if (ai) {
      return NextResponse.json({ ...ai, source: "openai" });
    }

    const mock = mockAnalyzeFromImageMeta({ preferredLanguage });
    return NextResponse.json({ ...mock, source: "demo" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to analyze meal" }, { status: 500 });
  }
}
