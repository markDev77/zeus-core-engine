// /src/engines/ai.engine.js

const axios = require("axios");

// ==========================
// LANGUAGE HELPERS (INLINE SAFE)
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

// DESCRIPTION + TITLE (AI STRUCTURED - ZEUS B)
// ==========================
async function generateAIContent({ title, category, language }) {
  try {
    const langInstruction = getLanguageInstruction(language);

    const prompt = `
${langInstruction}

You are optimizing a product for ecommerce.

Product:
${title}

Category:
${category}

Return STRICT JSON with this structure:

{
  "title": "...",
  "bullets": [
    "...",
    "...",
    "...",
    "...",
    "..."
  ]
}

RULES:

TITLE:
- Max 60 characters
- High conversion intent
- Clear and natural
- Do NOT exaggerate
- Do NOT invent features
- Keep original meaning

BULLETS:
- Exactly 5 bullets
- Each bullet between 6 and 12 words
- Focus on benefits (not generic phrases)
- Avoid repetition
- No fluff or filler text
- No technical specs unless obvious from title

IMPORTANT:
- DO NOT return HTML
- DO NOT explain anything
- RETURN ONLY VALID JSON
`;

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        temperature: 0.5,
        messages: [{ role: "user", content: prompt }]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );

    const raw = response.data.choices[0].message.content;

    // 🔒 SAFE PARSE
    let parsed = null;

    try {
      parsed = JSON.parse(raw);
    } catch (parseErr) {
      console.log("AI JSON PARSE ERROR:", parseErr.message);
      return null;
    }

    // 🔒 VALIDATION
    if (
      !parsed ||
      !parsed.title ||
      !Array.isArray(parsed.bullets) ||
      parsed.bullets.length === 0
    ) {
      return null;
    }

    return parsed;

  } catch (err) {
    console.log("AI STRUCTURED ERROR:", err.message);
    return null;
  }
}

// ==========================
// TITLE (IA ENHANCEMENT CONTROLADO)
// ==========================
async function improveTitleWithAI({ title, language }) {
  try {
    const langInstruction = getLanguageInstruction(language);

    const prompt = `
${langInstruction}

Improve this ecommerce product title.

Rules:
- Maximum 60 characters
- High conversion focus
- Clear, natural, and readable
- Do NOT add fake features
- Do NOT exaggerate
- Keep original meaning
- Avoid spammy or keyword stuffing
- Make it attractive but realistic

Original title:
${title}

Return ONLY the improved title.
`;

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        temperature: 0.5,
        messages: [{ role: "user", content: prompt }]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );

    const aiTitle = response.data.choices[0].message.content.trim();

    // 🔒 SAFETY FILTER
    if (!aiTitle || aiTitle.length < 8) {
      return title;
    }

    if (aiTitle.length > 70) {
      return title;
    }

    return aiTitle;

  } catch (err) {
    console.log("AI TITLE ERROR:", err.message);
    return title; // fallback crítico
  }
}

// ==========================
// EXPORTS
// ==========================
module.exports = {
  generateAIContent,
  improveTitleWithAI
};
