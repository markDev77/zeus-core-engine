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
// VALIDATORS (CLAVE)
// ==========================
function isBadTitle(original, generated) {
  if (!generated) return true;

  const o = original.toLowerCase().trim();
  const g = generated.toLowerCase().trim();

  return (
    g === o ||
    g.length < 20 ||
    g.includes(",") ||
    g.includes(" -") ||
    g.endsWith("para") ||
    g.endsWith("con")
  );
}

// ==========================
// AI STRUCTURED (ZEUS GTM)
// ==========================
async function generateAIContent({ title, category, language }) {
  try {
    const langInstruction = getLanguageInstruction(language);

    const prompt = `
${langInstruction}

You are a senior ecommerce conversion copywriter.

Rewrite this product to maximize conversion and SEO.

INPUT:
Title: ${title}
Category: ${category}

GOALS:
- Make it attractive and sellable
- Improve clarity and intent
- Add real-life usage context

TITLE RULES:
- Max 70 characters
- Must be DIFFERENT from original
- No symbols like "-" or "," at the end
- Include main keyword + benefit
- Natural, not robotic

DESCRIPTION RULES:
- Start with a persuasive paragraph (2–3 lines)
- Then 4–6 benefit-driven bullet points
- Avoid generic phrases like "ideal para uso diario"
- Focus on real benefits
- Do NOT invent specs

RETURN STRICT JSON:
{
  "title": "...",
  "intro": "...",
  "bullets": ["...", "...", "...", "..."]
}
`;

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [{ role: "user", content: prompt }]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );

    const raw = response.data.choices[0].message.content;

    let parsed = null;

    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.log("AI JSON ERROR:", e.message);
      return null;
    }

    if (!parsed || !parsed.title || !parsed.intro || !parsed.bullets) {
      return null;
    }

    // 🔥 VALIDACIÓN DE TÍTULO
    if (isBadTitle(title, parsed.title)) {
      parsed.title = title;
    }

    return parsed;

  } catch (err) {
    console.log("AI ENGINE ERROR:", err.message);
    return null;
  }
}

// ==========================
// TITLE IMPROVER (fallback)
// ==========================
async function improveTitleWithAI({ title, language }) {
  try {
    const langInstruction = getLanguageInstruction(language);

    const prompt = `
${langInstruction}

Improve this product title for ecommerce conversion.

Rules:
- Max 60 characters
- Must be clearer and more attractive
- Must be different from original
- No symbols like "-" or ","

Title:
${title}

Return ONLY the improved title.
`;

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [{ role: "user", content: prompt }]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );

    const aiTitle = response.data.choices[0].message.content.trim();

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
