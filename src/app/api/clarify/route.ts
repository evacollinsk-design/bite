import { NextResponse } from "next/server";
import { clarifyFromText, clarifyWithOpenAI } from "@/lib/ai";
import type { FoodItem, Nutrition } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text = (body.text as string | undefined)?.trim();
    const items = (body.items as FoodItem[] | undefined) ?? [];
    const nutrition = body.nutrition as Nutrition | undefined;
    const preferredLanguage = body.preferredLanguage as string | undefined;

    if (!text || !nutrition) {
      return NextResponse.json({ error: "text and nutrition required" }, { status: 400 });
    }

    const { result, error } = await clarifyWithOpenAI(
      items,
      nutrition,
      text,
      preferredLanguage,
    );
    if (result) {
      return NextResponse.json({
        ...result,
        source: "openai",
        model: process.env.OPENAI_MODEL || "gpt-4o",
      });
    }

    const mock = clarifyFromText(items, nutrition, text);
    return NextResponse.json({
      ...mock,
      source: "demo",
      reason: error ?? "openai_unavailable",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to clarify meal" }, { status: 500 });
  }
}
