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

  const originalHTML = product.description || "";

  const prompt = `
You are an ecommerce SEO optimizer specialized in marketplace catalogs.

IMPORTANT RULES

1 Preserve any existing HTML from supplier descriptions
2 If the description already contains HTML do NOT remove images or layout
3 Expand the text around the HTML but keep supplier blocks intact
4 Generate a high quality ecommerce description
5 Optimize for SEO for the target market

INPUT

TITLE:
${product.title}

DESCRIPTION:
${product.description}

TARGET LANGUAGE:
${language}

MARKET:
${region}

OUTPUT JSON ONLY

{
"title":"",
"description":"",
"seoTitle":"",
"seoDescription":"",
"keywords":[]
}
`;

  try {

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.35,
      max_tokens: 700,
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

    let finalDescription = result.description || originalHTML;

    if (originalHTML.includes("<img") || originalHTML.includes("<iframe")) {

      finalDescription =
        originalHTML +
        "\n\n" +
        (result.description || "");

    }

    return {
      ...product,
      title: result.title || product.title,
      description: finalDescription,
      seoTitle: result.seoTitle || product.title,
      seoDescription: result.seoDescription || "",
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
