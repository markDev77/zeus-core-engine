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

// ==========================
// DESCRIPTION (CORE IA)
// ==========================
async function generateAIContent({ title, category, language }) {
  try {
    const langInstruction = getLanguageInstruction(language);

    const prompt = `
${langInstruction}

Optimize this product for ecommerce.

Product:
${title}

Category:
${category}

Rules:
- Do NOT repeat the title
- Focus on conversion
- Include real-life usage context (kitchen, home, office, beauty, etc.)
- 120 to 180 words
- Avoid generic descriptions
- Do NOT invent technical specifications
- Write naturally and clearly

Return ONLY clean HTML using <p> and <ul>
`;

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );

    return response.data.choices[0].message.content;

  } catch (err) {
    console.log("AI DESCRIPTION ERROR:", err.message);
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
