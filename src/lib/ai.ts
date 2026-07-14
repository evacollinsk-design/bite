import type { AnalysisResult, ClarifyResult, FoodItem, Nutrition } from "./types";
import { detectLanguage } from "./language";
import { emptyNutrition, normalizeNutrition } from "./nutrition";

type Macro = Omit<Nutrition, "estimatedWeightGrams" | "fruitServings" | "vegServings">;

const FOOD_DB: Array<{
  keys: string[];
  name: string;
  per100g: Macro;
  defaultGrams: number;
  fruit?: number;
  veg?: number;
}> = [
  { keys: ["dal", "daal", "lentil", "दाल"], name: "Dal", per100g: { calories: 116, protein: 9, carbs: 17, fat: 2, fiber: 5, sugar: 1 }, defaultGrams: 150 },
  { keys: ["roti", "chapati", "रोटी"], name: "Roti", per100g: { calories: 297, protein: 9, carbs: 51, fat: 6, fiber: 4, sugar: 1 }, defaultGrams: 40 },
  { keys: ["rice", "chawal", "चावल"], name: "Rice", per100g: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, sugar: 0 }, defaultGrams: 180 },
  { keys: ["khichdi", "khichri", "खिचड़ी"], name: "Khichdi", per100g: { calories: 120, protein: 4, carbs: 20, fat: 2.5, fiber: 2, sugar: 0.5 }, defaultGrams: 220 },
  { keys: ["parantha", "paratha", "पराठा", "aloo"], name: "Paratha", per100g: { calories: 320, protein: 7, carbs: 42, fat: 14, fiber: 3, sugar: 1 }, defaultGrams: 80 },
  { keys: ["sabzi", "sabji", "vegetable", "सब्जी"], name: "Sabzi", per100g: { calories: 85, protein: 2.5, carbs: 10, fat: 4, fiber: 3, sugar: 2 }, defaultGrams: 150, veg: 1 },
  { keys: ["yogurt", "dahi", "curd", "दही"], name: "Yogurt / Dahi", per100g: { calories: 61, protein: 3.5, carbs: 4.7, fat: 3.3, fiber: 0, sugar: 4.7 }, defaultGrams: 120 },
  { keys: ["chicken", "murgh", "मुर्गी"], name: "Chicken", per100g: { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugar: 0 }, defaultGrams: 120 },
  { keys: ["egg", "anda", "अंडा"], name: "Egg", per100g: { calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, sugar: 0.5 }, defaultGrams: 50 },
  { keys: ["banana", "kela", "केला"], name: "Banana", per100g: { calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, sugar: 12 }, defaultGrams: 120, fruit: 1 },
  { keys: ["apple", "seb", "सेब"], name: "Apple", per100g: { calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, sugar: 10 }, defaultGrams: 180, fruit: 1 },
  { keys: ["oatmeal", "oats", "porridge"], name: "Oatmeal", per100g: { calories: 71, protein: 2.5, carbs: 12, fat: 1.5, fiber: 1.7, sugar: 1 }, defaultGrams: 220 },
  { keys: ["pasta", "noodles", "maggi"], name: "Pasta / Noodles", per100g: { calories: 158, protein: 5.8, carbs: 31, fat: 1.3, fiber: 1.8, sugar: 1 }, defaultGrams: 200 },
  { keys: ["sandwich", "toast"], name: "Sandwich", per100g: { calories: 250, protein: 10, carbs: 30, fat: 10, fiber: 2, sugar: 3 }, defaultGrams: 160, veg: 0.5 },
  { keys: ["salad"], name: "Salad", per100g: { calories: 35, protein: 2, carbs: 5, fat: 1, fiber: 2, sugar: 2 }, defaultGrams: 180, veg: 1.5 },
  { keys: ["idli"], name: "Idli", per100g: { calories: 110, protein: 3.5, carbs: 22, fat: 0.5, fiber: 1, sugar: 0.5 }, defaultGrams: 80 },
  { keys: ["dosa"], name: "Dosa", per100g: { calories: 168, protein: 4, carbs: 28, fat: 4.5, fiber: 1.5, sugar: 0.5 }, defaultGrams: 100 },
  { keys: ["milk", "doodh", "दूध"], name: "Milk", per100g: { calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, fiber: 0, sugar: 5 }, defaultGrams: 200 },
  { keys: ["paneer"], name: "Paneer", per100g: { calories: 265, protein: 18, carbs: 1.2, fat: 20, fiber: 0, sugar: 0.5 }, defaultGrams: 80 },
  { keys: ["ghee"], name: "Ghee", per100g: { calories: 900, protein: 0, carbs: 0, fat: 100, fiber: 0, sugar: 0 }, defaultGrams: 5 },
];

function scale(per100: Macro, grams: number): FoodItem {
  const f = grams / 100;
  return {
    name: "",
    portion: `${Math.round(grams)}g`,
    calories: Math.round(per100.calories * f),
    protein: Math.round(per100.protein * f * 10) / 10,
    carbs: Math.round(per100.carbs * f * 10) / 10,
    fat: Math.round(per100.fat * f * 10) / 10,
    fiber: Math.round(per100.fiber * f * 10) / 10,
    sugar: Math.round(per100.sugar * f * 10) / 10,
    confidence: 0.75,
  };
}

function parsePortionMultiplier(text: string): number {
  const lower = text.toLowerCase();
  if (/\b(half|aadha|aadhi|½|thoda kam|small|choti|chhota|kam|only half)\b/.test(lower)) return 0.5;
  if (/\b(double|do|2x|badi|bada|zyada|extra|full plate|bada plate|second serving)\b/.test(lower)) return 1.5;
  if (/\b(1\.5|dedh|very little oil|little oil)\b/.test(lower)) {
    if (/oil|ghee/.test(lower)) return 0.85;
    return 1.5;
  }
  const count = lower.match(/\b(\d+)\s*(roti|rotis|idli|idlis|egg|eggs|anda|ande)\b/);
  if (count) return Number(count[1]);
  return 1;
}

function oilAdjustment(text: string): number {
  const lower = text.toLowerCase();
  if (/very little oil|kam oil|little oil|less oil|without oil/.test(lower)) return 0.85;
  if (/lots of oil|zyada oil|deep.?fried|ghee/.test(lower) && !/without ghee|no ghee/.test(lower)) return 1.15;
  return 1;
}

export function mockAnalyzeFromImageMeta(opts?: { preferredLanguage?: string }): AnalysisResult {
  const presets: AnalysisResult[] = [
    {
      items: [
        { name: "Khichdi", portion: "1 bowl (~220g)", calories: 264, protein: 8.8, carbs: 44, fat: 5.5, fiber: 4, sugar: 1, confidence: 0.62 },
        { name: "Curd / Dahi", portion: "1 katori (~100g)", calories: 61, protein: 3.5, carbs: 4.7, fat: 3.3, fiber: 0, sugar: 4.7, confidence: 0.55 },
      ],
      nutrition: {
        calories: 325, protein: 12.3, carbs: 48.7, fat: 8.8, fiber: 4.4, sugar: 5.7,
        estimatedWeightGrams: 320, fruitServings: 0, vegServings: 0.5,
      },
      confidence: 0.58,
      needsClarification: true,
      questions: [
        { id: "q1", question: "Is that khichdi or plain rice with dal?", questionLocal: "क्या यह खिचड़ी है या दाल-चावल?", options: ["Khichdi", "Dal-chawal", "Something else"] },
        { id: "q2", question: "Was this made with ghee?", questionLocal: "क्या इसमें घी था?", options: ["Yes, with ghee", "Very little oil", "No added fat"] },
      ],
      detectedCuisine: "Indian home meal",
      summary: "Looks like a warm bowl meal — estimates only; portion is uncertain.",
      summaryLocal: "गर्म कटोरी वाला खाना लगता है — यह अनुमान है; मात्रा स्पष्ट नहीं है।",
      language: opts?.preferredLanguage ?? "en",
    },
    {
      items: [
        { name: "Aloo paratha", portion: "1 piece (~80g)", calories: 256, protein: 5.6, carbs: 33.6, fat: 11.2, fiber: 2.4, sugar: 0.8, confidence: 0.66 },
        { name: "Dahi", portion: "½ katori", calories: 40, protein: 2.2, carbs: 3, fat: 2, fiber: 0, sugar: 3, confidence: 0.6 },
      ],
      nutrition: {
        calories: 296, protein: 7.8, carbs: 36.6, fat: 13.2, fiber: 2.4, sugar: 3.8,
        estimatedWeightGrams: 140, fruitServings: 0, vegServings: 0.5,
      },
      confidence: 0.64,
      needsClarification: true,
      questions: [
        { id: "q1", question: "Was this one or two parathas?", options: ["One", "Two", "Half"] },
        { id: "q2", question: "How much oil was used?", options: ["Very little oil", "Normal", "Extra ghee"] },
      ],
      detectedCuisine: "North Indian breakfast",
      summary: "Paratha plate detected — estimates only until portion and oil are confirmed.",
      language: "en",
    },
    {
      items: [
        { name: "Idli", portion: "3 pieces (~120g)", calories: 132, protein: 4.2, carbs: 26.4, fat: 0.6, fiber: 1.2, sugar: 0.6, confidence: 0.7 },
        { name: "Sambar", portion: "1 small bowl (~120g)", calories: 90, protein: 4, carbs: 12, fat: 2.5, fiber: 2.5, sugar: 2, confidence: 0.6 },
      ],
      nutrition: {
        calories: 222, protein: 8.2, carbs: 38.4, fat: 3.1, fiber: 3.7, sugar: 2.6,
        estimatedWeightGrams: 240, fruitServings: 0, vegServings: 1,
      },
      confidence: 0.64,
      needsClarification: true,
      questions: [
        { id: "q1", question: "How many idlis were served?", options: ["2", "3", "4"] },
        { id: "q2", question: "Was the milk / chai on the side full-fat or toned?", options: ["Full-fat", "Toned", "No milk"] },
      ],
      detectedCuisine: "South Indian breakfast",
      summary: "Idli plate detected — count and sides need a quick check. Values are estimates.",
      language: "en",
    },
  ];

  return presets[Math.floor(Math.random() * presets.length)];
}

export function clarifyFromText(
  currentItems: FoodItem[],
  currentNutrition: Nutrition,
  userText: string,
): ClarifyResult {
  const lang = detectLanguage(userText);
  const lower = userText.toLowerCase();
  const multiplier = parsePortionMultiplier(userText);
  const oilMul = oilAdjustment(userText);

  const matched = FOOD_DB.filter((food) =>
    food.keys.some((k) => lower.includes(k.toLowerCase())),
  );

  let items: FoodItem[] = [...currentItems];
  let nutrition = normalizeNutrition(currentNutrition);

  if (matched.length > 0) {
    items = matched.map((food) => {
      const grams = Math.round(food.defaultGrams * multiplier);
      const scaled = scale(food.per100g, grams);
      const withOil =
        /paratha|parantha|sabzi|fry/.test(food.name.toLowerCase())
          ? {
              ...scaled,
              calories: Math.round(scaled.calories * oilMul),
              fat: Math.round(scaled.fat * oilMul * 10) / 10,
            }
          : scaled;
      return {
        ...withOil,
        name: food.name,
        portion: `${grams}g`,
        confidence: 0.88,
      };
    });
    nutrition = {
      calories: items.reduce((s, i) => s + i.calories, 0),
      protein: Math.round(items.reduce((s, i) => s + i.protein, 0) * 10) / 10,
      carbs: Math.round(items.reduce((s, i) => s + i.carbs, 0) * 10) / 10,
      fat: Math.round(items.reduce((s, i) => s + i.fat, 0) * 10) / 10,
      fiber: Math.round(items.reduce((s, i) => s + (i.fiber ?? 0), 0) * 10) / 10,
      sugar: Math.round(items.reduce((s, i) => s + (i.sugar ?? 0), 0) * 10) / 10,
      estimatedWeightGrams: matched.reduce((s, f) => s + Math.round(f.defaultGrams * multiplier), 0),
      fruitServings: matched.reduce((s, f) => s + (f.fruit ?? 0) * multiplier, 0),
      vegServings: matched.reduce((s, f) => s + (f.veg ?? 0) * multiplier, 0),
    };
  } else if (multiplier !== 1 || oilMul !== 1) {
    const m = multiplier * oilMul;
    items = items.map((item) => ({
      ...item,
      calories: Math.round(item.calories * m),
      protein: Math.round(item.protein * m * 10) / 10,
      carbs: Math.round(item.carbs * m * 10) / 10,
      fat: Math.round(item.fat * m * 10) / 10,
      fiber: Math.round((item.fiber ?? 0) * m * 10) / 10,
      sugar: Math.round((item.sugar ?? 0) * m * 10) / 10,
      confidence: Math.min(0.95, item.confidence + 0.1),
      portion: `${item.portion} ×${multiplier}`,
    }));
    nutrition = {
      calories: Math.round(nutrition.calories * m),
      protein: Math.round(nutrition.protein * m * 10) / 10,
      carbs: Math.round(nutrition.carbs * m * 10) / 10,
      fat: Math.round(nutrition.fat * m * 10) / 10,
      fiber: Math.round(nutrition.fiber * m * 10) / 10,
      sugar: Math.round(nutrition.sugar * m * 10) / 10,
      estimatedWeightGrams: Math.round(nutrition.estimatedWeightGrams * multiplier),
      fruitServings: (nutrition.fruitServings ?? 0) * multiplier,
      vegServings: (nutrition.vegServings ?? 0) * multiplier,
    };
  }

  const interpretation =
    matched.length > 0
      ? `Updated estimate using your description (${matched.map((m) => m.name).join(", ")}). Values remain approximate.`
      : multiplier !== 1 || oilMul !== 1
        ? `Adjusted portion/oil estimate (×${Math.round(multiplier * oilMul * 100) / 100}). Still an estimate.`
        : "Noted your clarification. Nutrition kept as an estimate with higher confidence.";

  const interpretationLocal =
    lang.code === "hi"
      ? matched.length > 0
        ? `आपके बताए अनुसार अनुमान अपडेट किया गया: ${matched.map((m) => m.name).join(", ")}। यह अनुमानित मान हैं।`
        : "मात्रा/तेल के अनुसार अनुमान समायोजित किया गया।"
      : interpretation;

  return {
    items,
    nutrition,
    confidence: matched.length > 0 || multiplier !== 1 ? 0.9 : 0.75,
    detectedLanguage: lang.code,
    languageName: lang.name,
    interpretation,
    interpretationLocal,
    remainingQuestions: [],
  };
}

export async function analyzeWithOpenAI(
  imageDataUrl: string,
  preferredLanguage?: string,
): Promise<AnalysisResult | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const system = `You are Bite, a warm family nutrition assistant. Never use judgmental words like bad food, cheat meal, or failed goal.
Analyze the meal photo and return STRICT JSON:
{
  "items":[{"name":"","portion":"","calories":0,"protein":0,"carbs":0,"fat":0,"fiber":0,"sugar":0,"confidence":0}],
  "nutrition":{"calories":0,"protein":0,"carbs":0,"fat":0,"fiber":0,"sugar":0,"estimatedWeightGrams":0,"fruitServings":0,"vegServings":0},
  "confidence":0,
  "needsClarification":false,
  "questions":[{"id":"q1","question":"","questionLocal":"","options":[""]}],
  "detectedCuisine":"",
  "summary":"",
  "summaryLocal":"",
  "language":"en"
}
Always present values as estimates. If uncertain about dish, oil/ghee, milk fat %, or portion (e.g. one vs two rotis), ask 1-2 simple questions.
Prefer language ${preferredLanguage || "en"} for summaryLocal / questionLocal.
Understand Hindi/Hinglish/regional home cooking.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this meal photo for family nutrition logging." },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    console.error("OpenAI analyze failed", await res.text());
    return null;
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;
  const parsed = JSON.parse(content) as AnalysisResult;
  parsed.nutrition = normalizeNutrition(parsed.nutrition);
  return parsed;
}

export async function clarifyWithOpenAI(
  currentItems: FoodItem[],
  currentNutrition: Nutrition,
  userText: string,
  preferredLanguage?: string,
): Promise<ClarifyResult | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const lang = detectLanguage(userText);

  const system = `You are Bite. User is correcting a meal in possibly vernacular / Hinglish language.
Detect language, reinterpret the meal, return STRICT JSON:
{
  "items":[{"name":"","portion":"","calories":0,"protein":0,"carbs":0,"fat":0,"fiber":0,"sugar":0,"confidence":0}],
  "nutrition":{"calories":0,"protein":0,"carbs":0,"fat":0,"fiber":0,"sugar":0,"estimatedWeightGrams":0,"fruitServings":0,"vegServings":0},
  "confidence":0,
  "detectedLanguage":"${lang.code}",
  "languageName":"${lang.name}",
  "interpretation":"",
  "interpretationLocal":"",
  "remainingQuestions":[]
}
Current estimate: ${JSON.stringify({ items: currentItems, nutrition: currentNutrition })}
Handle phrases like "aloo paratha with very little oil, child ate only half".
Respond in ${preferredLanguage || lang.code}. Values are estimates. Warm supportive tone.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: userText },
      ],
    }),
  });

  if (!res.ok) {
    console.error("OpenAI clarify failed", await res.text());
    return null;
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;
  const parsed = JSON.parse(content) as ClarifyResult;
  parsed.nutrition = normalizeNutrition(parsed.nutrition ?? emptyNutrition());
  return parsed;
}
