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
  if (!language) {
    return "Write ALL output strictly in English.";
  }
  const lang = String(language).toLowerCase();

  // Idiomas críticos validados (los que ya probaste)
  if (lang.startsWith("es")) return "Responde TODO en español.";
  if (lang.startsWith("pt")) return "Responda TODO em português.";
  if (lang.startsWith("en")) return "Write ALL output strictly in English.";

  // 🔥 NUEVO: soporte dinámico
  return `Write ALL output strictly in ${lang}. Do NOT use any other language.`;
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

PRIORITY RULE
Always prioritize:
1. What the product is used for
2. Then what the product is
3. Then key attributes

CRITICAL RULES
- Do NOT invent attributes
- You CAN reorganize and prioritize information to improve purchase intent
- You MUST infer the main use case when obvious (e.g. fitness, drawing, office)
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

STRUCTURE (MANDATORY):

1. intro (STORYTELLING)
- 3–4 sentences
- Must start with a real-life scenario
- Must describe how the product improves the user's situation
- Must include 6–10 relevant SEO keywords naturally integrated

2. benefits (BENEFITS + USAGE AND FUNCTIONALITY)
- 3–5 bullet points
- Each bullet MUST explain:
  → what it does
  → how it is used
  → why it matters

3. specs (FEATURES / CHARACTERISTICS)
- 3–6 real technical details
- Only factual attributes

IMPORTANT:
- Write ALL content in the target language
- Do NOT use English unless the language is English
- Keep structure consistent across all languages

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
