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
async function generateAIContent({ title, description, language }) {
  try {
    const langInstruction = getLanguageInstruction(language);

    const prompt = `
${langInstruction}

You are an ecommerce copywriter.

Write a PRODUCT DESCRIPTION optimized for conversion and SEO.

RULES:
- Return ONLY clean HTML
- Keep supplier content at the END
- Use persuasive storytelling (vary tone, avoid templates)
- Avoid generic openings like "Este producto", "Descubre"
- No exaggeration or fake claims
- Include 2–3 natural SEO keywords from the product title

STRUCTURE:
1. Context + use case
2. Benefits
3. Bullet points
4. Closing
5. Supplier content at the end

INPUT:
Title: ${title}
Description: ${description}

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

    const aiDescription = response.data.choices[0].message.content.trim();

const cleanDescription = aiDescription
  .replace(/```html|```/g, "")
  .replace(/\n+/g, " ")
  .trim();

if (!cleanDescription || cleanDescription.length < 50) {
  return description || "";
}

// evitar undefined
const safeSupplier = description ? description : "";

const finalDescription = cleanDescription + "\n" + safeSupplier;

return finalDescription;
    

// ==========================
// TITLE (IA ENHANCEMENT CONTROLADO)
// ==========================
async function improveTitleWithAI({ title, language }) {
  try {
    const langInstruction = getLanguageInstruction(language);

    const prompt = `
${langInstruction}

You are an ecommerce SEO title generator.

Generate a HIGH-CONVERTING product title.

MANDATORY STRUCTURE:
Brand (if exists) + Product Type + Key Feature + Variant

RULES:
- Max 70 characters
- No symbols like "-", "|", "/"
- Do NOT translate literally
- Rewrite commercially
- Prioritize search intent
- Use real ecommerce keywords
- Avoid filler words

EXAMPLES:
- Rodilleras deportivas silicona antideslizante negras
- Conjunto lencería malla bordado floral negro S
- Pulsera LED fluorescente ajustable para eventos

INPUT:
${title}

OUTPUT:
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
    let cleanTitle = aiTitle
  .replace(/[-|/*]+/g, "")
  .replace(/\s+/g, " ")
  .trim();

if (!cleanTitle || cleanTitle.length < 10) {
  return title;
}

if (cleanTitle.length > 60) {
  cleanTitle = cleanTitle.substring(0, 60).trim();
}

return cleanTitle;

} catch (error) {
  console.error("AI TITLE ERROR:", error?.response?.data || error.message);
  return title; // fallback seguro
}
  
}

// ==========================
// EXPORTS
// ==========================
module.exports = {
  generateAIContent,
  improveTitleWithAI
};
