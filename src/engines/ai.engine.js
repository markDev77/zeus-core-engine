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
Generate optimized ecommerce content ONLY using real data from input.

CRITICAL RULES
- DO NOT invent attributes
- DO NOT invent brand or specs
- DO NOT assume missing data
- High purchase intent
- Clear and scannable in <40 seconds

TITLE STRUCTURE
[Brand if exists] + [Product Name/Model] + [Main Attribute] + [Color/Size/Qty]
- If element doesn't exist → omit
- Max 140 chars

DESCRIPTION STRUCTURE
1. intro → short persuasive paragraph
2. bullets → 4–6 benefits
3. specs → 3–8 real technical details
4. trust → optional (only if exists)

RETURN STRICT JSON:

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

    return {
      title: String(parsed.title || "").trim(),
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
// OPTIONAL TITLE IMPROVER
// ==========================
async function improveTitleWithAI({ title }) {
  return title;
}

module.exports = {
  generateAIContent,
  improveTitleWithAI
};
