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
// DESCRIPTION ENGINE
// ==========================
async function generateAIContent({ title, description, language }) {
  try {
    const langInstruction = getLanguageInstruction(language);

    const safeInput =
      typeof description === "string" ? description : "";

    const cleanInput = safeInput
      .replace(/<[^>]*>/g, "")
      .substring(0, 800);

    const prompt = `
${langInstruction}

You are an ecommerce optimizer.

Generate BOTH:

1. Product title (SEO optimized)
2. Product description (conversion focused)

RULES TITLE:
- Max 70 characters
- No symbols
- Do NOT translate literally
- Use real ecommerce search keywords
- Structure: Product Type + Key Feature + Variant

RULES DESCRIPTION:
- Return clean HTML
- Use persuasive storytelling (non-repetitive)
- No supplier mention
- Include 2–3 SEO keywords naturally

OUTPUT FORMAT (STRICT JSON):
{
  "title": "...",
  "description": "..."
}

INPUT:
Title: ${title}
Description: ${cleanInput}
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

    const aiRaw = response.data.choices[0].message.content.trim();

    let parsed;

    try {
      parsed = JSON.parse(aiRaw);
    } catch (e) {
      console.error("AI PARSE ERROR:", aiRaw);
      return {
        title,
        description: safeInput
      };
    }

    // ==========================
    // TITLE CLEAN
    // ==========================
    let cleanTitle =
      typeof parsed.title === "string" ? parsed.title : "";

    cleanTitle = cleanTitle
      .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanTitle || cleanTitle.length < 10) {
      cleanTitle = title;
    }

    if (cleanTitle.length > 70) {
      cleanTitle = cleanTitle.substring(0, 70).trim();
    }

    // ==========================
    // DESCRIPTION CLEAN
    // ==========================
    let cleanDescription =
      typeof parsed.description === "string"
        ? parsed.description
        : "";

    cleanDescription = cleanDescription
      .replace(/```html|```/g, "")
      .replace(/\n+/g, " ")
      .trim();

    if (!cleanDescription || cleanDescription.length < 50) {
      throw new Error("AI DESCRIPTION EMPTY");
    }

    // ==========================
    // FINAL OUTPUT (SIN PROVEEDOR)
    // ==========================
    return {
      title: cleanTitle,
      description: cleanDescription
    };

  } catch (error) {
    console.error(
      "AI ENGINE ERROR:",
      error?.response?.data || error.message
    );

    return {
      title,
      description:
        typeof description === "string" ? description : ""
    };
  }
}
// ==========================
// TITLE ENGINE (DEPRECATED - NOT IN USE)
// ==========================
async function improveTitleWithAI({ title, language }) {
  // ⚠️ NO USAR
  // ZEUS ahora usa generateAIContent() para título + descripción en una sola llamada

  return title;
}

// ==========================
// EXPORTS
// ==========================
module.exports = {
  generateAIContent,
  improveTitleWithAI
};
