const axios = require("axios");

// ==========================
// LANGUAGE HELPERS
// ==========================
function normalizeLanguage(lang) {
  if (!lang) return "en";

  return String(lang)
    .toLowerCase()
    .split("-")[0]
    .split("_")[0];
}

function getLanguageInstruction(language) {
  const lang = normalizeLanguage(language);

  const map = {
    es: "Responde en español.",
    en: "Respond in English.",
    pt: "Responda em português."
  };

  return map[lang] || map.en;
}

// ==========================
// HELPERS
// ==========================
function safeJsonParse(raw) {
  try {
    const cleaned = String(raw || "")
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch (e) {
    console.log("AI JSON ERROR:", e.message);
    return null;
  }
}

function cleanArray(arr, limit = 6) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((x) => String(x || "").trim())
    .filter(Boolean)
    .slice(0, limit);
}

// 🔥 LIMPIADOR FINAL DE TÍTULO (CRÍTICO)
function cleanFinalTitle(title = "") {
  return String(title)
    // quitar símbolos
    .replace(/[:\-–—,/|%&]+/g, " ")

    // quitar duplicados
    .replace(/\b(\w+)( \1\b)+/gi, "$1")

    // limpiar espacios
    .replace(/\s{2,}/g, " ")

    // limpiar bordes
    .replace(/^[\s\-]+|[\s\-]+$/g, "")

    // capitalizar
    .replace(/\b\w/g, l => l.toUpperCase())

    // limitar SEO
    .slice(0, 140)
    .trim();
}

// ==========================
// 🔥 MAIN AI FUNCTION
// ==========================
async function generateAIContent({ title, description, language }) {
  try {
    const langInstruction = getLanguageInstruction(language);

    const prompt = `
${langInstruction}

You are ZEUS, a senior ecommerce catalog optimizer.

INPUT
Raw title: ${title || ""}
Raw description: ${description || ""}

OBJECTIVE
Generate high-converting ecommerce content based ONLY on real data.

CRITICAL RULES
- Do NOT invent attributes
- Do NOT invent brand
- Do NOT invent specs
- Prioritize purchase intent
- Be clear in under 40 seconds

STEP 1 — IDENTIFY PRODUCT
First determine clearly what the product is.
Example: "Drawing Pen", "Paint Brush Set", "Wireless Headphones"

STEP 2 — BUILD TITLE
TITLE STRUCTURE:
[Product Type] + [1–2 Key Attributes] + [Optional Detail]

RULES:
- Must sound like a real ecommerce product
- Max 70 characters
- No symbols
- No filler words (e.g. "best", "new", "hot")

STEP 3 — BUILD DESCRIPTION

STRUCTURE:
1. intro (1 strong sentence, benefit-driven)
2. benefits (3–5 real use-case benefits, NOT specs)
3. specs (3–6 real technical details)
4. trust (optional)

IMPORTANT:
- Benefits must NOT include sizes, cm, mm, model numbers
- Specs must contain only factual data

RETURN JSON:
{
  "title": "...",
  "intro": "...",
  "bullets": ["..."],
  "specs": ["..."],
  "trust": ["..."]
}
`;

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        temperature: 0.15,
        messages: [{ role: "user", content: prompt }]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );

    const raw = response?.data?.choices?.[0]?.message?.content || "";
    const parsed = safeJsonParse(raw);

    if (!parsed || !parsed.title || !parsed.intro) {
      console.log("AI FALLBACK TRIGGERED");
      return null;
    }

    const finalTitle = cleanFinalTitle(parsed.title);

    return {
      title: finalTitle,
      intro: String(parsed.intro || "").trim(),
      bullets: cleanArray(parsed.bullets, 6),
      specs: cleanArray(parsed.specs, 8),
      trust: cleanArray(parsed.trust, 3)
    };

  } catch (err) {
    console.log("AI ENGINE ERROR:", err.message);
    return null;
  }
}

// ==========================
async function improveTitleWithAI({ title }) {
  return title;
}

module.exports = {
  generateAIContent,
  improveTitleWithAI
};
