import { NextResponse } from "next/server";
import { analyzeWithOpenAI, mockAnalyzeFromImageMeta } from "@/lib/ai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const imageDataUrl = body.imageDataUrl as string | undefined;
    const preferredLanguage = body.preferredLanguage as string | undefined;
    const allowDemo = body.allowDemo !== false;

    if (!imageDataUrl) {
      return NextResponse.json({ error: "imageDataUrl required" }, { status: 400 });
    }

    const { result, error } = await analyzeWithOpenAI(imageDataUrl, preferredLanguage);
    if (result) {
      return NextResponse.json({
        ...result,
        source: "openai",
        model: process.env.OPENAI_MODEL || "gpt-4o",
      });
    }

    const reason = error ?? "openai_unavailable";
    const quota =
      reason.includes("429") ||
      reason.includes("insufficient_quota") ||
      reason.includes("credit_balance");

    if (!allowDemo) {
      return NextResponse.json(
        {
          error: quota
            ? "OpenAI has no credits remaining. Add billing credits to use live recognition."
            : "Vision analysis unavailable",
          reason,
        },
        { status: 502 },
      );
    }

    const mock = mockAnalyzeFromImageMeta({ preferredLanguage });
    return NextResponse.json({
      ...mock,
      source: "demo",
      reason: quota ? "insufficient_quota" : reason,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to analyze meal" }, { status: 500 });
  }
}
