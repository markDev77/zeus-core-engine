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

Write a PRODUCT DESCRIPTION optimized for conversion and SEO.

RULES:
- Return ONLY clean HTML
- Keep supplier technical content at the END (do not remove it)
- Use light persuasive storytelling (vary tone, avoid templates)
- Avoid repeating openings across products
- Do NOT use generic phrases like "Este producto", "Descubre", "Imagina"
- No exaggeration or fake claims
- No emojis

STRUCTURE:
1. Opening (context + use case, varies per product)
2. Benefits (what problem it solves)
3. Bullet points (features with keywords)
4. Closing (use case or outcome)
5. Keep original supplier HTML AFTER your content

SEO:
- Naturally include keywords from title
- Avoid keyword stuffing

STYLE:
- Clear
- Direct
- Commercial
- Natural ecommerce language

FORMAT:
- Use <p> for paragraphs
- Use <ul><li> for features
- No inline styles

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

let cleanDescription = aiDescription
  .replace(/```html|```/g, "")
  .replace(/\n+/g, " ")
  .trim();

// fallback si IA falla
if (!cleanDescription || cleanDescription.length < 50) {
  return description;
}

// combinar IA + proveedor (proveedor siempre al final)
const finalDescription = `
${cleanDescription}
${description}
`;

return finalDescription;

} catch (error) {
  console.error("AI DESCRIPTION ERROR:", error?.response?.data || error.message);
  return description; // fallback seguro
}
    

// ==========================
// TITLE (IA ENHANCEMENT CONTROLADO)
// ==========================
async function improveTitleWithAI({ title, language }) {
  try {
    const langInstruction = getLanguageInstruction(language);

    const prompt = `
${langInstruction}

You are an ecommerce title optimizer.

Generate a HIGH-CONVERTING product title.

RULES:
- Return ONLY the final title
- Maximum 60 characters
- No symbols like "-", "|", "/", "*"
- No keyword stuffing
- No fake features
- No exaggeration
- Keep original meaning
- Do NOT translate literally
- Use natural ecommerce language
- Focus on product type + key benefit
- Make it clean, readable, and commercial

INPUT TITLE:
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
