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
// 🔥 SINGLE AI CORE (CONTROL SEMÁNTICO)
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
1. Translate the title correctly (DO NOT cut or shorten)
2. Identify ONLY explicit attributes from the original text
3. Build a SEO title using ONLY real information

CRITICAL RULES (MANDATORY):

- DO NOT invent attributes
- DO NOT assume features
- DO NOT guess product type beyond text
- DO NOT add context not present in title
- DO NOT use generic words:
  moderno, cómodo, elegante, premium

- ONLY use what is explicitly written in the original title
- If information is unclear → KEEP IT SIMPLE, DO NOT GUESS

TITLE STRUCTURE:
[product type] + [real attribute] + [optional context if explicitly present]

BAD:
"Traje de baño tropical para piscina" (if "tropical" is not in input)

GOOD:
"Traje de baño con tirantes y abertura frontal"

---

DESCRIPTION RULES:
- 1 short intro (natural, not generic)
- 4–6 benefit bullets
- NO repetition
- NO generic phrases
- DO NOT invent specs

---

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
        temperature: 0.1,
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
