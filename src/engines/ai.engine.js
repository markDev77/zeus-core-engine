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

    const cleanInput = (description || "")
      .replace(/<[^>]*>/g, "")
      .substring(0, 800);

    const prompt = `
${langInstruction}

You are an ecommerce copywriter.

Write a PRODUCT DESCRIPTION optimized for conversion and SEO.

RULES:
- Return ONLY clean HTML
- Do NOT mention supplier, manufacturer, or origin
- Use persuasive storytelling (vary tone)
- Avoid generic openings
- No exaggeration
- Include 2–3 natural SEO keywords based on the product title

STRUCTURE:
1. Context + use case
2. Benefits
3. Bullet points
4. Closing

INPUT:
Title: ${title}
Description: ${cleanInput}

OUTPUT:
`;

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        temperature: 0.8,
        messages: [{ role: "user", content: prompt }]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );

    const aiDescription = response.data.choices[0].message.content.trim();

    const cleanDescription = aiDescription
      .replace(/```html|```/g, "")
      .replace(/\n+/g, " ")
      .trim();

    if (!cleanDescription || cleanDescription.length < 50) {
      return description || "";
    }

    const safeSupplier =
      typeof description === "string"
        ? description.replace(/<html[\s\S]*<\/html>/gi, "")
        : "";

    const finalDescription =
      cleanDescription + (safeSupplier ? "\n" + safeSupplier : "");

    return finalDescription;

  } catch (error) {
    console.error(
      "AI DESCRIPTION ERROR:",
      error?.response?.data || error.message
    );
    return description || "";
  }
}
  
// ==========================
// TITLE ENGINE
// ==========================
async function improveTitleWithAI({ title, language }) {
  try {
    const langInstruction = getLanguageInstruction(language);

    const baseTitle = (title || "")
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s]/g, "")
      .toLowerCase()
      .trim();

    const prompt = `
${langInstruction}

You are an ecommerce SEO title generator.

Generate a HIGH-CONVERTING product title.

MANDATORY STRUCTURE:
Product Type + Key Feature + Variant

RULES:
- Max 70 characters
- No symbols
- Do NOT translate literally
- Rewrite for ecommerce search intent
- Use real keywords customers search
- Avoid filler words

EXAMPLES:
- Rodilleras deportivas silicona antideslizante negras
- Conjunto lencería malla bordado floral negro S
- Pulsera LED fluorescente ajustable para eventos

INPUT:
${baseTitle}

OUTPUT:
`;

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        temperature: 0.95,
        messages: [{ role: "user", content: prompt }]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );

    const aiTitle = response.data.choices[0].message.content.trim();

    let cleanTitle = aiTitle
      .replace(/[-|/*]+/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanTitle || cleanTitle.length < 10) {
      return title;
    }

    if (cleanTitle.length > 70) {
      cleanTitle = cleanTitle.substring(0, 70).trim();
    }

    return cleanTitle;

  } catch (error) {
    console.error("AI TITLE ERROR:", error?.response?.data || error.message);
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
