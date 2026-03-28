/*
========================================
ZEUS AI SEO OPTIMIZER
========================================
Optimiza títulos, descripción SEO y keywords
usando señales del Category Brain.
========================================
*/

function stripUnsafeTagsFromHtml(html = "") {
  return String(html || "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe\b[\s\S]*?<\/iframe>/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripHtmlForPrompt(html = "") {
  return String(html || "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<iframe\b[\s\S]*?<\/iframe>/gi, " ")
    .replace(/<picture\b[\s\S]*?<\/picture>/gi, " ")
    .replace(/<video\b[\s\S]*?<\/video>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeIncomingTitle(title = "") {
  return String(title || "")
    .replace(/^title\s*:/i, "")
    .replace(/^product\s*title\s*:/i, "")
    .replace(/^name\s*:/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanSeoTitle(title = "") {
  let clean = String(title || "")
    .replace(/^title\s*:/i, "")
    .replace(/[,:;\-–—]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (clean.length > 90) {
    clean = clean.substring(0, 90).trim();
  }

  return clean;
}

function dedupeTags(tags = []) {
  return Array.from(
    new Set(
      (tags || [])
        .map((tag) =>
          String(tag || "")
            .replace(/^title\s*:/i, "")
            .trim()
        )
        .filter(Boolean)
    )
  );
}

function cleanSupplierHtml(html = "") {
  return String(html || "")
    .replace(/<p>\s*<p>/gi, "<p>")
    .replace(/<\/p>\s*<\/p>/gi, "</p>")
    .replace(/<p>\s*<\/p>/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildFinalDescription({ originalHTML, seoDescription }) {

  const cleanHtml = cleanSupplierHtml(
    stripUnsafeTagsFromHtml(originalHTML)
  );

  return `
<div class="zeus-seo-block">

${seoDescription}

</div>

<hr>

<div class="zeus-supplier-content">

${cleanHtml}

</div>
`.trim();
}

function resolveOptimizationLocale(storeProfile = {}, product = {}) {

  const shopDomain =
    storeProfile.shopDomain ||
    product.shopDomain ||
    "";

  if (shopDomain === "eawi7g-hj.myshopify.com") {
    return {
      region: "MX",
      language: "es",
    };
  }

  return {
    region: storeProfile.region || storeProfile.country || "GLOBAL",
    language: storeProfile.language || "en",
  };
}

async function aiSeoOptimizer(product = {}, storeProfile = {}) {

  if (!product.title) {
    return product;
  }

  const normalizedTitle = normalizeIncomingTitle(product.title);

  const locale = resolveOptimizationLocale(storeProfile, product);

  const region = locale.region;
  const language = locale.language;

  const originalHTML = product.description || "";

  const promptDescription = stripHtmlForPrompt(
    originalHTML + " " + (product.originalDescription || "")
  ).substring(0, 500);

  const category =
    product.baseCategory ||
    product.category ||
    "general";

  const tags =
    (product.tags || []).slice(0, 10).join(", ");

  const prompt = `
You are a senior ecommerce SEO copywriter.

Create an optimized ecommerce product listing.

Requirements:

SEO Title
60 to 90 characters
Main keyword first
Natural ecommerce format

CRITICAL TITLE RULES:
- Do NOT use hyphens (-), commas, or separators
- Do NOT translate literally
- Avoid explicit or sensitive wording depending on region
- Use natural ecommerce language
- Keep titles clean, readable, and conversion-focused
- Rewrite the title completely, do NOT reuse original structure
- You MUST transform the title into a completely new commercial version
- Do NOT reuse original words directly
- Structure:
  Product type + key benefit + main feature + target use

DIVERSITY RULES:
- Each description must use a different narrative style
- NEVER start with "Descubre" or "Imagina"
- If you do, the output is invalid and must be regenerated
- Vary openings: question, benefit-first, direct, scenario

STRICT ENFORCEMENT RULES:
- If the description starts with "Descubre" or "Imagina", the output is invalid
- You must vary structure across products
- Repetition will invalidate the result

SEO Description
150 to 250 words

Opening Hook (IMPORTANT)
- Start with a short emotional or relatable scenario
- Make the user imagine using the product
- Keep it natural, not exaggerated or overly dramatic

Benefits
- Focus on real user outcomes

Key Features
- Clear, scannable points

Recommended Use
- Practical usage scenarios

Who This Product Is For
- Target user clearly defined

CRITICAL:
- Do NOT include generic filler text
- Do NOT repeat information
- Keep a persuasive ecommerce tone
- Replace explicit or sensitive terms with neutral ecommerce wording

REWRITE LEVEL:
- Do NOT paraphrase
- Completely reinterpret the product for ecommerce conversion

Avoid generic phrases.

Language: ${language}
Region: ${region}

Category:
${category}

Tags:
${tags}

Product Title:
${normalizedTitle}

Product Description:
${promptDescription}

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
          Authorization: "Bearer " + process.env.OPENAI_API_KEY,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.85,
          max_tokens: 700,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      return product;
    }

    const text = data.choices[0].message.content;
    console.log("AI RAW RESPONSE:", text);

    let result;

    try {
    try {
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  result = JSON.parse(cleaned);

} catch (err) {
  console.error("JSON PARSE ERROR:", text);
  return product;
}

    const cleanTitle = cleanSeoTitle(
      result.seoTitle || result.title || normalizedTitle
    );

    const finalDescription = buildFinalDescription({
      originalHTML,
      seoDescription: result.description || "",
    });

    return {
      ...product,
      title: cleanTitle,
      description: finalDescription || originalHTML,
      seoTitle: cleanSeoTitle(result.seoTitle || cleanTitle),
      seoDescription: String(result.seoDescription || "").trim(),
      tags: dedupeTags([
        ...(product.tags || []),
        ...((result.keywords || []).map((k) =>
          String(k || "").trim()
        )),
      ]),
    };

  } catch (error) {

    console.error("ZEUS AI SEO ERROR:", error.message);

    return product;
  }
}

module.exports = {
  aiSeoOptimizer,
};
