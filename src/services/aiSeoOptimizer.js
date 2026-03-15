/*
========================================
ZEUS AI SEO OPTIMIZER
========================================
Enriquece SEO usando IA controlada
sin reemplazar el motor base de ZEUS
Preserva HTML original del proveedor
========================================
*/

const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function extractSupplierHTML(description = "") {

  if (!description) return {
    cleanText: "",
    supplierHTML: ""
  };

  const hasHTML =
    description.includes("<img") ||
    description.includes("<picture") ||
    description.includes("<iframe") ||
    description.includes("<video");

  if (!hasHTML) {
    return {
      cleanText: description,
      supplierHTML: ""
    };
  }

  return {
    cleanText: description.replace(/<img[^>]*>/g, ""),
    supplierHTML: description
  };
}

function buildFinalDescription({
  seoDescription,
  supplierHTML
}) {

  let finalHTML = "";

  if (seoDescription) {
    finalHTML += seoDescription;
  }

  if (supplierHTML) {

    finalHTML += `

<!-- SUPPLIER MEDIA CONTENT PRESERVED -->

${supplierHTML}

`;

  }

  return finalHTML;
}

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

  const { cleanText, supplierHTML } =
    extractSupplierHTML(product.description || "");

  const prompt = `
You are an expert ecommerce SEO product copywriter.

Create a high quality ecommerce product listing.

Requirements:

- 600 to 900 words
- strong SEO structure
- HTML formatting
- sections for benefits, features, usage and buying reasons
- optimized for ecommerce search

Product title:
${product.title}

Product base description:
${cleanText}

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
      max_tokens: 900,
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

    const finalDescription = buildFinalDescription({
      seoDescription: result.description,
      supplierHTML
    });

    return {
      ...product,
      title: result.title || product.title,
      description: finalDescription || product.description,
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
