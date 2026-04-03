// src/engines/title-v2/title.ai.raw.js

const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateStructuredTitleRaw({ prompt }) {
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: "You ONLY return valid JSON. No text, no explanation."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });

    return response.choices[0].message.content;

  } catch (err) {
    console.error("❌ RAW AI ERROR:", err.message);
    return null;
  }
}

module.exports = {
  generateStructuredTitleRaw
};
