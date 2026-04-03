// /src/engines/title-v2/title.ai.js

const { normalizeTitleContract } = require("./title.contract");
const { generateAIContent } = require("../ai.engine");

function safeJSONParse(text) {
  try {
    return JSON.parse(text);
  } catch (err) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (_) {}

    return null;
  }
}

async function generateStructuredTitle(input) {
  try {
    const {
      title,
      description,
      language = "en",
      country = "GLOBAL"
    } = input;

    const prompt = `
Return ONLY a valid JSON object.

STRICT RULES:
- No explanations
- No text before or after JSON
- No markdown
- No comments
- Only pure JSON
- All fields must be filled with meaningful values (no empty strings)

OBJECTIVE:
Build a structured representation for high-quality ecommerce titles.

FIELDS:
- product_type: specific product type
- primary_intent: main use or context
- key_modifiers: max 3 attributes that impact purchase
- variant_signal: distinguishing detail if relevant
- candidate_titles: 2 clean, natural ecommerce titles

INSTRUCTIONS:
- No generic words like "item" or "product"
- Avoid repetition
- Avoid keyword stuffing
- Avoid excessive "for"
- Titles must feel like real ecommerce listings

OUTPUT FORMAT:
{
  "product_type": { "value": "" },
  "primary_intent": { "value": "" },
  "key_modifiers": [
    { "value": "" }
  ],
  "variant_signal": { "value": "" },
  "candidate_titles": [
    { "value": "" },
    { "value": "" }
  ]
}

INPUT:
Title: ${title}
Description: ${description || ""}
Language: ${language}
Country: ${country}

RETURN ONLY JSON.
`;

    const aiRaw = await generateAIContent({
      prompt,
      temperature: 0.2,
      mode: "json"
    });

    const parsed = safeJSONParse(aiRaw);

    if (!parsed) {
      console.error("❌ AI JSON PARSE ERROR:", aiRaw);
      return normalizeTitleContract({});
    }

    return normalizeTitleContract({
      ...parsed,
      locale_context: {
        language,
        region: country
      }
    });

  } catch (error) {
    console.error("❌ STRUCTURED TITLE ERROR:", error.message);
    return normalizeTitleContract({});
  }
}

module.exports = {
  generateStructuredTitle
};
