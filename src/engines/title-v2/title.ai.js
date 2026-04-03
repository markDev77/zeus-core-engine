// /engines/title-v2/title.ai.js

const { normalizeTitleContract } = require("./title.contract");
const { generateAIContent } = require("../ai.engine"); // usa tu engine actual

async function generateStructuredTitle(input) {
  try {
    const {
      title,
      description,
      language = "en",
      country = "GLOBAL"
    } = input;

    // PROMPT BASE (temporal, luego lo mejoramos)
    const prompt = `
You are an ecommerce semantic extraction engine.

Analyze the product and return a JSON object with:

- product_type
- key_modifiers (max 3)
- primary_intent
- variant_signal
- candidate_titles (2 options)

RULES:
- No marketing words
- No repetition
- Be precise and short
- Output ONLY JSON

Product title: ${title}
Product description: ${description || ""}
Language: ${language}
Country: ${country}
`;

    const aiRaw = await generateAIContent({
      prompt,
      temperature: 0.2
    });

    let parsed;

    try {
      parsed = JSON.parse(aiRaw);
    } catch (e) {
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
