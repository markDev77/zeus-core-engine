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
// 🔥 SINGLE AI CORE (MEJORADO)
// ==========================
async function generateAIContent({ title, category, language }) {
  try {
    const langInstruction = getLanguageInstruction(language);

    const prompt = `
${langInstruction}

You are ZEUS, an ecommerce product optimizer.

INPUT:
Raw title: ${title}
Category: ${category}

TASK:
1. Understand the REAL product from the raw title
2. Translate correctly (DO NOT cut text)
3. Extract SPECIFIC attributes (shape, function, use, structure)
4. Generate a SEO title

TITLE RULES (CRITICAL):
- Structure: [product type] + [specific attribute] + [usage context]
- MUST use real attributes from the product
- DO NOT use generic words like:
  - moderno
  - cómodo
  - elegante
  - premium
- DO NOT invent features
- DO NOT exaggerate
- MUST be useful for search intent

BAD EXAMPLE:
"Traje de baño moderno y cómodo"

GOOD EXAMPLE:
"Traje de baño con tirantes ajustables para playa"

DESCRIPTION RULES:
- 1 natural intro
- 4–6 benefit bullets
- No generic phrases
- No repetition

CRITICAL:
- Do NOT shorten the original meaning
- Do NOT lose product attributes

RETURN STRICT JSON:

{
  "title": "...",
  "intro": "...",
  "bullets": ["...", "...", "..."]
}
`;

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [{ role: "user", content: prompt }]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );

    const raw = response.data.choices[0].message.content;

    function safeParse(raw) {
      try {
        const cleaned = String(raw)
          .replace(/```json/gi, "")
          .replace(/```/g, "")
          .trim();

        return JSON.parse(cleaned);
      } catch (e) {
        console.log("AI JSON ERROR:", e.message);
        return null;
      }
    }

    const parsed = safeParse(raw);

    if (!parsed) return null;

    if (!parsed.title || !parsed.intro || !parsed.bullets) {
      return null;
    }

    return parsed;

  } catch (err) {
    console.log("AI ENGINE ERROR:", err.message);
    return null;
  }
}

// ==========================
// TITLE IMPROVER (OFF)
// ==========================
async function improveTitleWithAI({ title }) {
  return title;
}

// ==========================
// EXPORTS
// ==========================
module.exports = {
  generateAIContent,
  improveTitleWithAI
};
