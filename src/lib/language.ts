export interface LanguageHit {
  code: string;
  name: string;
  confidence: number;
}

const SCRIPT_HINTS: Array<{
  code: string;
  name: string;
  test: RegExp;
}> = [
  { code: "hi", name: "Hindi", test: /[\u0900-\u097F]/ },
  { code: "bn", name: "Bengali", test: /[\u0980-\u09FF]/ },
  { code: "ta", name: "Tamil", test: /[\u0B80-\u0BFF]/ },
  { code: "te", name: "Telugu", test: /[\u0C00-\u0C7F]/ },
  { code: "ml", name: "Malayalam", test: /[\u0D00-\u0D7F]/ },
  { code: "gu", name: "Gujarati", test: /[\u0A80-\u0AFF]/ },
  { code: "pa", name: "Punjabi", test: /[\u0A00-\u0A7F]/ },
  { code: "kn", name: "Kannada", test: /[\u0C80-\u0CFF]/ },
  { code: "ar", name: "Arabic", test: /[\u0600-\u06FF]/ },
  { code: "zh", name: "Chinese", test: /[\u4E00-\u9FFF]/ },
  { code: "ja", name: "Japanese", test: /[\u3040-\u30FF]/ },
  { code: "ko", name: "Korean", test: /[\uAC00-\uD7AF]/ },
  { code: "es", name: "Spanish", test: /\b(el|la|los|las|comida|arroz|pollo|poco|mucho)\b/i },
  { code: "fr", name: "French", test: /\b(le|la|les|du|des|repas|riz|poulet)\b/i },
];

const ROMANIZED_HINTS: Array<{ code: string; name: string; words: string[] }> = [
  {
    code: "hi",
    name: "Hindi",
    words: [
      "dal",
      "daal",
      "roti",
      "chawal",
      "sabzi",
      "sabji",
      "khichdi",
      "parantha",
      "paratha",
      "thoda",
      "zyada",
      "kam",
      "badi",
      "choti",
      "plate",
      "katori",
      "andaza",
      "hai",
      "tha",
      "nahi",
      "bhai",
      "beta",
      "dahi",
      "pani",
      "ghee",
      "masala",
    ],
  },
  {
    code: "es",
    name: "Spanish",
    words: ["arroz", "pollo", "frijoles", "poco", "mucho", "comida", "sopa", "tortilla"],
  },
];

export function detectLanguage(text: string): LanguageHit {
  const trimmed = text.trim();
  if (!trimmed) {
    return { code: "en", name: "English", confidence: 0.5 };
  }

  for (const hint of SCRIPT_HINTS) {
    if (hint.test.test(trimmed)) {
      return { code: hint.code, name: hint.name, confidence: 0.95 };
    }
  }

  const tokens = trimmed.toLowerCase().split(/[^a-zA-Z\u00C0-\u024F]+/).filter(Boolean);
  for (const hint of ROMANIZED_HINTS) {
    const hits = tokens.filter((t) => hint.words.includes(t)).length;
    if (hits >= 1) {
      return {
        code: hint.code,
        name: hint.name,
        confidence: Math.min(0.9, 0.55 + hits * 0.15),
      };
    }
  }

  return { code: "en", name: "English", confidence: 0.7 };
}

export function speechLocaleFor(code: string): string {
  const map: Record<string, string> = {
    en: "en-US",
    hi: "hi-IN",
    bn: "bn-IN",
    ta: "ta-IN",
    te: "te-IN",
    ml: "ml-IN",
    gu: "gu-IN",
    pa: "pa-IN",
    kn: "kn-IN",
    es: "es-ES",
    fr: "fr-FR",
    ar: "ar-SA",
    zh: "zh-CN",
    ja: "ja-JP",
    ko: "ko-KR",
  };
  return map[code] ?? "en-US";
}
