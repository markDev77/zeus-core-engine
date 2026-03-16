/*
========================================
ZEUS AI SEO OPTIMIZER
========================================
IA SEO enrichment sin depender
del SDK de OpenAI
========================================
*/

function stripMediaTagsFromHtml(html = "") {
  return String(html || "")
    .replace(/<img\b[^>]*>/gi, "")
    .replace(/<picture\b[\s\S]*?<\/picture>/gi, "")
    .replace(/<video\b[\s\S]*?<\/video>/gi, "")
    .replace(/<iframe\b[\s\S]*?<\/iframe>/gi, "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .trim();
}

function stripHtmlForPrompt(html = "") {
  return String(html || "")
    .replace(/<img\b[^>]*>/gi, " ")
    .replace(/<picture\b[\s\S]*?<\/picture>/gi, " ")
    .replace(/<video\b[\s\S]*?<\/video>/gi, " ")
    .replace(/<iframe\b[\s\S]*?<\/iframe>/gi, " ")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanSeoTitle(title = "") {
  return String(title || "")
    .replace(/[,:;\-–—]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupeTags(tags = []) {
  return Array.from(
    new Set(
      (tags || [])
        .map((tag) => String(tag || "").trim())
        .filter(Boolean)
    )
  );
}

function buildFinalDescription({
  source,
  originalHTML,
  seoDescription
}) {
  const normalizedSource = String(source || "").toLowerCase();
  const cleanSupplierHtml = stripMediaTagsFromHtml(originalHTML);

  if (normalizedSource === "usadrop") {
    if (cleanSupplierHtml) {
      return `
${seoDescription || ""}

<hr>

${cleanSupplierHtml}
      `.trim();
    }

    return String(seoDescription || "").trim();
  }

  if (cleanSupplierHtml && cleanSupplierHtml !== originalHTML) {
    return `
${seoDescription || ""}

<hr>

${cleanSupplierHtml}
    `.trim();
  }

  return String(seoDescription || originalHTML || "").trim();
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

  const source =
    product.source ||
    storeProfile.source ||
    "native";

  const originalHTML = product.description || "";
  const promptDescription = stripHtmlForPrompt(originalHTML);

  const prompt = `
You are an ecommerce SEO optimizer specialized in high-conversion marketplace catalogs.

RULES
- Write in the target language only
- Return JSON only
- Create a clean ecommerce SEO title
- Do not use commas, hyphens, semicolons, or decorative punctuation in the title
- Create a long SEO description in HTML
- Keep the description commercially strong but natural
- Avoid exaggerated claims
- The SEO description must be significantly richer than the original
- Generate relevant ecommerce keyword tags
- Focus on clarity, search intent, and conversion

TARGET LANGUAGE:
${language}

TARGET REGION:
${region}

SOURCE:
${source}

PRODUCT TITLE:
${product.title}

PRODUCT DESCRIPTION:
${promptDescription}

RETURN JSON ONLY

{
  "title": "",
  "description": "",
  "seoTitle": "",
  "seoDescription": "",
  "keywords": []
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
          max_tokens: 900,
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

    if (!data.choices || !data.choices[0]?.message?.content) {
      return product;
    }

    const text = data.choices[0].message.content;

    let result;

    try {
      result = JSON.parse(text);
    } catch {
      return product;
    }

    const cleanTitle = cleanSeoTitle(
      result.title || product.title
    );

    const finalDescription = buildFinalDescription({
      source,
      originalHTML,
      seoDescription: result.description || ""
    });

    return {
      ...product,
      title: cleanTitle,
      description: finalDescription || originalHTML,
      seoTitle: cleanSeoTitle(result.seoTitle || cleanTitle),
      seoDescription: String(result.seoDescription || "").trim(),
      tags: dedupeTags([
        ...(product.tags || []),
        ...((result.keywords || []).map((k) => String(k || "").trim()))
      ])
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
