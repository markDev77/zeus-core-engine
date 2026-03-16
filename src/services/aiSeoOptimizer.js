/*
========================================
ZEUS AI SEO OPTIMIZER
========================================
IA SEO enrichment sin depender
del SDK de OpenAI
========================================
*/

function stripUnsafeTagsFromHtml(html = "") {
  return String(html || "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe\b[\s\S]*?<\/iframe>/gi, "")
    .trim();
}

function stripHtmlForPrompt(html = "") {
  return String(html || "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<iframe\b[\s\S]*?<\/iframe>/gi, " ")
    .replace(/<img\b[^>]*>/gi, " ")
    .replace(/<picture\b[\s\S]*?<\/picture>/gi, " ")
    .replace(/<video\b[\s\S]*?<\/video>/gi, " ")
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
  originalHTML,
  seoDescription
}) {
  const cleanSupplierHtml = stripUnsafeTagsFromHtml(originalHTML);

  if (cleanSupplierHtml) {
    return `
${seoDescription || ""}

<hr>

${cleanSupplierHtml}
    `.trim();
  }

  return String(seoDescription || originalHTML || "").trim();
}

function resolveOptimizationLocale(storeProfile = {}, product = {}) {
  const shopDomain =
    storeProfile.shopDomain ||
    product.shopDomain ||
    "";

  if (shopDomain === "eawi7g-hj.myshopify.com") {
    return {
      region: "MX",
      language: "es"
    };
  }

  return {
    region:
      storeProfile.region ||
      storeProfile.country ||
      "GLOBAL",
    language:
      storeProfile.language ||
      "en"
  };
}

async function aiSeoOptimizer(product = {}, storeProfile = {}) {

  if (!product.title) {
    return product;
  }

  const locale = resolveOptimizationLocale(storeProfile, product);

  const region = locale.region;
  const language = locale.language;

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
- When target language is Spanish, write in neutral Spanish optimized for Mexico
- Preserve supplier HTML for final output, but do not include raw HTML wrappers in the generated SEO block

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
