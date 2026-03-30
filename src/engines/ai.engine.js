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
// VALIDATORS
// ==========================
function isBadTitle(original, generated) {
  if (!generated) return true;

  const o = original.toLowerCase().trim();
  const g = generated.toLowerCase().trim();

  return (
    g === o ||
    g.length < 10 ||
    g.includes(",") ||
    g.includes(" -") ||
    g.endsWith("para") ||
    g.endsWith("con")
  );
}

// ==========================
// AI STRUCTURED CONTENT
// ==========================
async function generateAIContent({ title, category, language }) {
  try {
    const langInstruction = getLanguageInstruction(language);

    const prompt = `
${langInstruction}

You are a senior ecommerce copywriter.

INPUT:
Title: ${title}
Category: ${category}

GOALS:
- Improve clarity and usability
- Add real-life context

STRICT RULES:
- DO NOT rewrite the title structure
- DO NOT change product meaning
- NO generic phrases like "ideal para"
- NO emotional exaggeration

DESCRIPTION:
- 1 short intro (2–3 lines)
- 4–6 benefit bullets (real benefits, not features)

RETURN STRICT JSON:
{
  "title": "${title}",
  "intro": "...",
  "bullets": ["...", "...", "..."]
}
`;

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        temperature: 0.4,
        messages: [{ role: "user", content: prompt }]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );

    const raw = response.data.choices[0].message.content;

    function safeParseAIResponse(raw) {
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

    const parsed = safeParseAIResponse(raw);

    if (!parsed || !parsed.intro || !parsed.bullets) {
      return null;
    }

    return parsed;

  } catch (err) {
    console.log("AI ENGINE ERROR:", err.message);
    return null;
  }
}

// ==========================
// TITLE IMPROVER (CRÍTICO)
// ==========================
async function improveTitleWithAI({ title, language }) {
  try {
    const langInstruction = getLanguageInstruction(language);

    const prompt = `
${langInstruction}

You are an ecommerce SEO optimizer.

TASK:
Refine the following product title WITHOUT changing its structure.

RULES:
- KEEP the same structure
- DO NOT rewrite completely
- DO NOT add phrases like "ideal para", "perfecto"
- DO NOT change meaning
- ONLY improve clarity and readability
- Max 60 characters

TITLE:
${title}

Return ONLY the refined title.
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

    const aiTitle = response.data.choices[0].message.content.trim();

    // 🔒 VALIDACIÓN FUERTE
    if (isBadTitle(title, aiTitle)) {
      return title;
    }

    return aiTitle;

  } catch (err) {
    console.log("AI TITLE ERROR:", err.message);
    return title;
  }
}

// ==========================
// EXPORTS
// ==========================
module.exports = {
  generateAIContent,
  improveTitleWithAI
};
