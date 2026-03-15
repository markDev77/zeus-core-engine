/*
========================================
ZEUS AI SEO OPTIMIZER
========================================
IA SEO enrichment sin depender
del SDK de OpenAI
========================================
*/

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
You are an ecommerce SEO optimizer.

Product title:
${product.title}

Product description:
${product.description}

Generate:

1 Improved SEO title
2 Long SEO description
3 Keyword tags

Language: ${language}
Market: ${region}

Return JSON only:

{
"title":"",
"description":"",
"seoTitle":"",
"seoDescription":"",
"keywords":[]
}
`;

  try {

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.35,
          max_tokens: 700,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!data.choices) {
      return product;
    }

    const text = data.choices[0].message.content;

    let result;

    try {
      result = JSON.parse(text);
    } catch {
      return product;
    }

    let finalDescription = result.description || originalHTML;

    if (originalHTML.includes("<img")) {

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
