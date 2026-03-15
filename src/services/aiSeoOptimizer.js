/*
========================================
ZEUS AI SEO OPTIMIZER
========================================
Enriquece SEO usando IA controlada
sin reemplazar el motor base de ZEUS
========================================
*/

const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function aiSeoOptimizer(product = {}, storeProfile = {}) {

  if (!product.title) {
    return product;
  }

  const region =
    storeProfile.region ||
    storeProfile.country ||
    "GLOBAL";

  const language =
    storeProfile.language ||
    "en";

  const prompt = `
You are an ecommerce SEO optimizer.

Product title:
${product.title}

Product description:
${product.description}

Generate:

1) Improved SEO title
2) Long ecommerce SEO description (300-500 words)
3) Additional keyword tags

Language: ${language}
Market region: ${region}

Return JSON only:

{
"title":"",
"description":"",
"keywords":[]
}
`;

  try {

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const text = completion.choices[0].message.content;

    let result;

    try {
      result = JSON.parse(text);
    } catch {
      return product;
    }

    return {
      ...product,
      title: result.title || product.title,
      description: result.description || product.description,
      tags: [
        ...(product.tags || []),
        ...(result.keywords || [])
      ]
    };

  } catch (error) {

    console.error(
      "ZEUS AI SEO ERROR:",
      error.message
    );

    return product;

  }

}

module.exports = {
  aiSeoOptimizer
};
