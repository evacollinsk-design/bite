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
  { keys: ["dal", "daal", "lentil", "दाल", "sambar", "sambhar"], name: "Dal", per100g: { calories: 116, protein: 9, carbs: 17, fat: 2, fiber: 5, sugar: 1 }, defaultGrams: 150 },
  { keys: ["roti", "chapati", "phulka", "रोटी"], name: "Roti", per100g: { calories: 297, protein: 9, carbs: 51, fat: 6, fiber: 4, sugar: 1 }, defaultGrams: 40 },
  { keys: ["rice", "chawal", "jeera rice", "चावल"], name: "Rice", per100g: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, sugar: 0 }, defaultGrams: 180 },
  { keys: ["khichdi", "khichri", "खिचड़ी"], name: "Khichdi", per100g: { calories: 120, protein: 4, carbs: 20, fat: 2.5, fiber: 2, sugar: 0.5 }, defaultGrams: 220 },
  { keys: ["parantha", "paratha", "पराठा"], name: "Paratha", per100g: { calories: 320, protein: 7, carbs: 42, fat: 14, fiber: 3, sugar: 1 }, defaultGrams: 80 },
  { keys: ["sabzi", "sabji", "vegetable curry", "सब्जी"], name: "Sabzi", per100g: { calories: 85, protein: 2.5, carbs: 10, fat: 4, fiber: 3, sugar: 2 }, defaultGrams: 150, veg: 1 },
  { keys: ["yogurt", "dahi", "curd", "दही"], name: "Yogurt / Dahi", per100g: { calories: 61, protein: 3.5, carbs: 4.7, fat: 3.3, fiber: 0, sugar: 4.7 }, defaultGrams: 120 },
  { keys: ["chicken", "murgh", "मुर्गी"], name: "Chicken", per100g: { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugar: 0 }, defaultGrams: 120 },
  { keys: ["egg", "anda", "omelette", "omelet", "अंडा"], name: "Egg", per100g: { calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, sugar: 0.5 }, defaultGrams: 50 },
  { keys: ["banana", "kela", "केला"], name: "Banana", per100g: { calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, sugar: 12 }, defaultGrams: 120, fruit: 1 },
  { keys: ["apple", "seb", "सेब"], name: "Apple", per100g: { calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, sugar: 10 }, defaultGrams: 180, fruit: 1 },
  { keys: ["oatmeal", "oats", "porridge"], name: "Oatmeal", per100g: { calories: 71, protein: 2.5, carbs: 12, fat: 1.5, fiber: 1.7, sugar: 1 }, defaultGrams: 220 },
  { keys: ["pasta", "noodles", "maggi"], name: "Pasta / Noodles", per100g: { calories: 158, protein: 5.8, carbs: 31, fat: 1.3, fiber: 1.8, sugar: 1 }, defaultGrams: 200 },
  { keys: ["sandwich", "toast"], name: "Sandwich", per100g: { calories: 250, protein: 10, carbs: 30, fat: 10, fiber: 2, sugar: 3 }, defaultGrams: 160, veg: 0.5 },
  { keys: ["salad"], name: "Salad", per100g: { calories: 35, protein: 2, carbs: 5, fat: 1, fiber: 2, sugar: 2 }, defaultGrams: 180, veg: 1.5 },
  { keys: ["idli"], name: "Idli", per100g: { calories: 110, protein: 3.5, carbs: 22, fat: 0.5, fiber: 1, sugar: 0.5 }, defaultGrams: 40 },
  { keys: ["dosa"], name: "Dosa", per100g: { calories: 168, protein: 4, carbs: 28, fat: 4.5, fiber: 1.5, sugar: 0.5 }, defaultGrams: 100 },
  { keys: ["milk", "doodh", "दूध"], name: "Milk", per100g: { calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, fiber: 0, sugar: 5 }, defaultGrams: 200 },
  { keys: ["paneer"], name: "Paneer", per100g: { calories: 265, protein: 18, carbs: 1.2, fat: 20, fiber: 0, sugar: 0.5 }, defaultGrams: 80 },
  { keys: ["ghee"], name: "Ghee", per100g: { calories: 900, protein: 0, carbs: 0, fat: 100, fiber: 0, sugar: 0 }, defaultGrams: 5 },
  { keys: ["poha"], name: "Poha", per100g: { calories: 158, protein: 3, carbs: 28, fat: 4, fiber: 2, sugar: 2 }, defaultGrams: 200 },
  { keys: ["upma"], name: "Upma", per100g: { calories: 140, protein: 3.5, carbs: 22, fat: 4.5, fiber: 2, sugar: 1 }, defaultGrams: 200 },
  { keys: ["biryani"], name: "Biryani", per100g: { calories: 180, protein: 8, carbs: 24, fat: 6, fiber: 1.5, sugar: 1 }, defaultGrams: 300 },
  { keys: ["chai", "tea"], name: "Chai", per100g: { calories: 45, protein: 1.5, carbs: 6, fat: 1.8, fiber: 0, sugar: 5 }, defaultGrams: 150 },
  { keys: ["chutney"], name: "Chutney", per100g: { calories: 120, protein: 2, carbs: 12, fat: 7, fiber: 2, sugar: 4 }, defaultGrams: 30 },
  { keys: ["papad", "papadum"], name: "Papad", per100g: { calories: 370, protein: 18, carbs: 50, fat: 10, fiber: 8, sugar: 0 }, defaultGrams: 12 },
  { keys: ["fruit", "mixed fruit", "fruit bowl"], name: "Fruit", per100g: { calories: 60, protein: 0.8, carbs: 15, fat: 0.2, fiber: 2.5, sugar: 12 }, defaultGrams: 150, fruit: 1 },
];

function matchFoodEntry(name: string) {
  const lower = name.toLowerCase();
  let best: (typeof FOOD_DB)[number] | null = null;
  let bestLen = 0;
  for (const food of FOOD_DB) {
    for (const key of food.keys) {
      const k = key.toLowerCase();
      const hit =
        k.length <= 3
          ? new RegExp(`(?:^|[^a-z\\u0900-\\u097f])${k}(?:[^a-z\\u0900-\\u097f]|$)`, "i").test(
              lower,
            )
          : lower.includes(k);
      if (hit && k.length >= bestLen) {
        best = food;
        bestLen = k.length;
      }
    }
  }
  return best;
}

function parseEstimatedGrams(portion: string, fallback: number): number {
  const grams = portion.match(/(\d+(?:\.\d+)?)\s*g\b/i);
  if (grams) return Math.round(Number(grams[1]));

  const count = portion.match(
    /(\d+(?:\.\d+)?)\s*(roti|rotis|chapati|chapatis|idli|idlis|dosa|dosas|egg|eggs|anda|ande|piece|pieces|paratha|parathas|katori|bowl|cups?)\b/i,
  );
  if (count) {
    const n = Number(count[1]);
    const unit = count[2].toLowerCase();
    if (/roti|chapati|paratha/.test(unit)) return Math.round(n * 40);
    if (/idli/.test(unit)) return Math.round(n * 40);
    if (/dosa/.test(unit)) return Math.round(n * 100);
    if (/egg|anda/.test(unit)) return Math.round(n * 50);
    if (/katori|bowl|cup/.test(unit)) return Math.round(n * fallback);
    if (/piece/.test(unit)) return Math.round(n * fallback);
  }

  if (/\bhalf\b|½|aadha/i.test(portion)) return Math.round(fallback * 0.5);
  return fallback;
}

/** Prefer reference macros for known foods; keep model names + portion estimates. */
function groundAnalysis(analysis: AnalysisResult): AnalysisResult {
  let fruit = 0;
  let veg = 0;
  const items = analysis.items.map((item) => {
    const food = matchFoodEntry(item.name);
    if (!food) return item;
    const grams = parseEstimatedGrams(item.portion, food.defaultGrams);
    const scaled = scale(food.per100g, grams);
    fruit += food.fruit ?? 0;
    veg += food.veg ?? 0;
    return {
      ...item,
      calories: scaled.calories,
      protein: scaled.protein,
      carbs: scaled.carbs,
      fat: scaled.fat,
      fiber: scaled.fiber,
      sugar: scaled.sugar,
      portion: item.portion.includes("g")
        ? item.portion
        : `${item.portion} (~${grams}g)`,
      confidence: Math.min(0.95, Math.max(item.confidence, 0.78)),
    };
  });

  const nutrition = normalizeNutrition({
    calories: items.reduce((s, i) => s + i.calories, 0),
    protein: Math.round(items.reduce((s, i) => s + i.protein, 0) * 10) / 10,
    carbs: Math.round(items.reduce((s, i) => s + i.carbs, 0) * 10) / 10,
    fat: Math.round(items.reduce((s, i) => s + i.fat, 0) * 10) / 10,
    fiber: Math.round(items.reduce((s, i) => s + (i.fiber ?? 0), 0) * 10) / 10,
    sugar: Math.round(items.reduce((s, i) => s + (i.sugar ?? 0), 0) * 10) / 10,
    estimatedWeightGrams: items.reduce((s, i) => {
      const g = parseEstimatedGrams(i.portion, 100);
      return s + g;
    }, 0),
    fruitServings: fruit || analysis.nutrition.fruitServings || 0,
    vegServings: veg || analysis.nutrition.vegServings || 0,
  });

  return { ...analysis, items, nutrition };
}

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

function visionModel(): string {
  return process.env.OPENAI_MODEL || "gpt-4o";
}

function coerceAnalysis(raw: AnalysisResult): AnalysisResult {
  const items = (raw.items ?? []).map((item) => ({
    name: String(item.name || "Food item"),
    portion: String(item.portion || "1 serving"),
    calories: Number(item.calories) || 0,
    protein: Number(item.protein) || 0,
    carbs: Number(item.carbs) || 0,
    fat: Number(item.fat) || 0,
    fiber: Number(item.fiber) || 0,
    sugar: Number(item.sugar) || 0,
    confidence: Math.min(1, Math.max(0, Number(item.confidence) || 0.5)),
  }));

  const nutrition = normalizeNutrition(
    raw.nutrition ?? {
      calories: items.reduce((s, i) => s + i.calories, 0),
      protein: items.reduce((s, i) => s + i.protein, 0),
      carbs: items.reduce((s, i) => s + i.carbs, 0),
      fat: items.reduce((s, i) => s + i.fat, 0),
      fiber: items.reduce((s, i) => s + (i.fiber ?? 0), 0),
      sugar: items.reduce((s, i) => s + (i.sugar ?? 0), 0),
      estimatedWeightGrams: 0,
      fruitServings: 0,
      vegServings: 0,
    },
  );

  const confidence = Math.min(1, Math.max(0, Number(raw.confidence) || 0.55));
  const needsClarification =
    Boolean(raw.needsClarification) || confidence < 0.72 || items.length === 0;

  return {
    items,
    nutrition,
    confidence,
    needsClarification,
    questions: Array.isArray(raw.questions) ? raw.questions.slice(0, 2) : [],
    detectedCuisine: raw.detectedCuisine || "",
    summary: raw.summary || "Meal estimate from photo.",
    summaryLocal: raw.summaryLocal || raw.summary || "",
    language: raw.language || "en",
  };
}

export async function analyzeWithOpenAI(
  imageDataUrl: string,
  preferredLanguage?: string,
): Promise<{ result: AnalysisResult | null; error?: string }> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return { result: null, error: "missing_api_key" };
  }

  const lang = preferredLanguage || "en";
  const system = `You are Bite, a warm family nutrition assistant for Indian and global home cooking.
Never use judgmental words like bad food, cheat meal, or failed goal.

TASK: Identify every distinct edible item on the plate/bowl/packaging visible in the photo.
Estimate cooked/ready-to-eat portions and nutrition for what was actually served.

RULES FOR ACCURACY:
1. Name specific dishes when possible (e.g. "Aloo paratha", "Dal tadka", "Jeera rice") — not just "Indian food".
2. Separate sides (dal, sabzi, roti, rice, curd, pickle, papad, salad, fruit). Never merge two foods into one item.
3. Count visible pieces carefully (rotis, idlis, eggs). Put the count in portion text.
4. Estimate portion in familiar units AND grams: "2 rotis (~80g)", "1 katori dal (~150g)", "1 bowl rice (~180g)".
5. Account for oil/ghee if visible (shine, frying) — note uncertainty if unclear.
6. Use realistic Indian home-cooking macros (not restaurant deep-fried defaults unless the photo looks like that).
7. If packaging/label text is readable, prefer labeled nutrition when present.
8. confidence is 0–1 for overall identification. Per-item confidence too. Be honest — unclear photos should be <0.65.
9. If dish identity, count, oil, or milk fat % is unclear, set needsClarification=true and ask 1–2 short questions with options.
10. Prefer language "${lang}" for summaryLocal and questionLocal (Hinglish/Hindi OK).
11. Values are estimates — never claim lab precision. Focus first on correct food names + counts; macros second.

Return STRICT JSON only:
{
  "items":[{"name":"","portion":"","calories":0,"protein":0,"carbs":0,"fat":0,"fiber":0,"sugar":0,"confidence":0}],
  "nutrition":{"calories":0,"protein":0,"carbs":0,"fat":0,"fiber":0,"sugar":0,"estimatedWeightGrams":0,"fruitServings":0,"vegServings":0},
  "confidence":0,
  "needsClarification":false,
  "questions":[{"id":"q1","question":"","questionLocal":"","options":[""]}],
  "detectedCuisine":"",
  "summary":"",
  "summaryLocal":"",
  "language":"${lang}"
}
nutrition must equal the sum of items (approx).`;

  const userText = `Analyze this meal photo for family nutrition logging.
Look carefully at: dish types, count of pieces (roti/idli/egg), bowl fullness, visible oil/ghee, sides, and any packaging.
Return the JSON schema from your instructions.`;

  async function callOnce(): Promise<AnalysisResult | null> {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: visionModel(),
        temperature: 0.1,
        max_tokens: 2200,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: [
              { type: "text", text: userText },
              {
                type: "image_url",
                image_url: { url: imageDataUrl, detail: "high" },
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("OpenAI analyze failed", res.status, errText);
      if (
        errText.includes("insufficient_quota") ||
        errText.includes("credit_balance_exhausted")
      ) {
        throw new Error("insufficient_quota");
      }
      throw new Error(`openai_${res.status}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content) as AnalysisResult;
    return coerceAnalysis(parsed);
  }

  try {
    let result = await callOnce();
    if (!result || result.items.length === 0) {
      result = await callOnce();
    }
    if (!result) return { result: null, error: "empty_response" };
    return { result: groundAnalysis(result) };
  } catch (e) {
    const message = e instanceof Error ? e.message : "openai_error";
    return { result: null, error: message };
  }
}

export async function clarifyWithOpenAI(
  currentItems: FoodItem[],
  currentNutrition: Nutrition,
  userText: string,
  preferredLanguage?: string,
): Promise<{ result: ClarifyResult | null; error?: string }> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { result: null, error: "missing_api_key" };

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
Respond in ${preferredLanguage || lang.code}. Values are estimates. Warm supportive tone.
nutrition must match sum of items.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: visionModel(),
        temperature: 0.15,
        max_tokens: 1600,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: userText },
        ],
      }),
    });

    if (!res.ok) {
      console.error("OpenAI clarify failed", await res.text());
      return { result: null, error: `openai_${res.status}` };
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return { result: null, error: "empty_response" };
    const parsed = JSON.parse(content) as ClarifyResult;
    parsed.nutrition = normalizeNutrition(parsed.nutrition ?? emptyNutrition());
    return { result: parsed };
  } catch (e) {
    const message = e instanceof Error ? e.message : "openai_error";
    return { result: null, error: message };
  }
}
