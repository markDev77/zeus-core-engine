// /src/engines/ai.engine.js

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
// 🔥 SINGLE AI CALL (TODO EN UNO)
// ==========================
async function generateAIContent({ title, category, language }) {
  try {
    const langInstruction = getLanguageInstruction(language);

    const prompt = `
${langInstruction}

You are ZEUS, an ecommerce optimizer.

INPUT:
Raw title: ${title}
Category: ${category}

TASK:
- Translate correctly (DO NOT cut text)
- Generate SEO title
- Create intro
- Create benefits

TITLE RULES:
- Structure: product + attribute + context
- No "ideal para", "perfecto"
- No exaggeration
- Clear and natural

DESCRIPTION RULES:
- 1 intro (natural)
- 4–6 benefit bullets
- No duplication
- No generic phrases

CRITICAL:
- Do NOT shorten the title
- Do NOT remove meaning

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
        temperature: 0.3,
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
// 🔴 DESACTIVADO (NO MÁS IA EXTRA)
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
