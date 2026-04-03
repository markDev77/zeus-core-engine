// /src/engines/title-v2/title.ai.js

const { normalizeTitleContract } = require("./title.contract");
const { generateAIContent } = require("../ai.engine");

function safeJSONParse(text) {
  try {
    return JSON.parse(text);
  } catch (err) {
    // intento de limpieza básica si la IA mete texto extra
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

Expected format:
{
  "product_type": { "value": "specific product type" },
  "primary_intent": { "value": "main use or purpose" },
  "key_modifiers": [
    { "value": "key attribute 1" },
    { "value": "key attribute 2" }
  ],
  "variant_signal": { "value": "variant or distinguishing detail" },
  "candidate_titles": [
    { "value": "clean, natural ecommerce title" },
    { "value": "alternative optimized title" }
  ]
}

INSTRUCTIONS:
- Identify the real product type (not generic words like 'item' or 'product')
- Extract the main user intent (what it is used for)
- Extract up to 3 relevant modifiers (material, style, function, season, audience)
- Use natural language, not keyword stuffing
- Titles must be clear, readable, and purchase-oriented

Product title: ${title}
Product description: ${description || ""}
Language: ${language}
Country: ${country}
`;
OUTPUT STRICTLY JSON.

-------------------------
OBJECTIVE
-------------------------
Build a structured representation that allows generating high-converting product titles.

-------------------------
RULES
-------------------------
- Be precise, not verbose
- No marketing adjectives (premium, luxury, amazing, etc.)
- No repetition
- Max 3 key modifiers
- Prioritize purchase decision attributes
- Use natural ecommerce wording
- Avoid repeated "for"
- Titles must feel like real listings, not AI

-------------------------
FIELDS
-------------------------

product_type:
- What the product is (clear and specific)

primary_intent:
- Main use or context (e.g. "for travel", "for office")

key_modifiers:
- Max 3
- Must influence purchase decision

secondary_modifiers:
- Optional

compatibility:
- Only if critical

variant_signal:
- Only if relevant

candidate_titles:
- Generate 2 clean, natural, high-quality options
- No repetition
- No filler words

-------------------------
OUTPUT FORMAT (STRICT JSON)
-------------------------
{
  "product_type": { "value": "", "confidence": 0.9 },
  "brand": { "value": null, "priority": "none" },
  "primary_intent": { "value": "", "type": "contextual", "confidence": 0.8 },
  "key_modifiers": [],
  "secondary_modifiers": [],
  "compatibility": [],
  "variant_signal": { "value": null, "type": null, "priority": "low" },
  "semantic_priority_order": [],
  "candidate_titles": [
    {
      "value": "",
      "structure_type": "A",
      "clarity_score": 0.9,
      "semantic_score": 0.9,
      "natural_score": 0.9
    }
  ],
  "risk_flags": {
    "missing_product_type": false,
    "low_confidence": false,
    "overloaded_modifiers": false,
    "ambiguous_product": false
  },
  "anti_patterns": {
    "repetition_risk": false,
    "keyword_stuffing_risk": false,
    "empty_adjectives": false
  }
}

-------------------------
INPUT
-------------------------
Title: ${title}
Description: ${description || ""}
Language: ${language}
Country: ${country}

RETURN ONLY JSON.
`;

 const aiRaw = await generateAIContent({
  prompt,
  temperature: 0.2
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
