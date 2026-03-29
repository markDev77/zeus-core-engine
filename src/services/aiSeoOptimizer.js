/*
========================================
ZEUS AI SEO OPTIMIZER
========================================
Estable para producción:
- siempre devuelve title string
- siempre devuelve description string
- nunca devuelve [object Object]
- no rompe payload
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
    .replace(/<picture\b[\s\S]*?<\/picture>/gi, " ")
    .replace(/<video\b[\s\S]*?<\/video>/gi, " ")
    .replace(/<img\b[^>]*>/gi, " ")
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
    .replace(/[,:;\-–—/|]+/g, " ")
    .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (clean.length > 70) {
    clean = clean.substring(0, 70).trim();
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
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe\b[\s\S]*?<\/iframe>/gi, "")
    .replace(/\[object Object\]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildFinalDescription({ originalHTML, seoDescription }) {
  const cleanSeo = String(seoDescription || "").trim();
  const cleanHtml = cleanSupplierHtml(stripUnsafeTagsFromHtml(originalHTML));

  if (!cleanSeo) {
    return cleanHtml;
  }

  return `
<div class="zeus-seo-block">
${cleanSeo}
</div>
<hr>
<div class="zeus-supplier-content">
${cleanHtml}
</div>
`.trim();
}

function resolveOptimizationLocale(storeProfile = {}, product = {}) {
  return {
    region: storeProfile.region || storeProfile.country || "GLOBAL",
    language: storeProfile.language || "en"
  };
}

function extractJsonObject(text = "") {
  const raw = String(text || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");

  if (first === -1 || last === -1 || last <= first) {
    return null;
  }

  return raw.substring(first, last + 1);
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
  ).substring(0, 700);

  const category =
    product.baseCategory ||
    product.category ||
    "general";

  const tags = (product.tags || []).slice(0, 10).join(", ");

  const prompt = `
You are a senior ecommerce SEO copywriter.

Return ONLY valid JSON.

{
  "title": "",
  "description": "",
  "seoTitle": "",
  "seoDescription": "",
  "keywords": []
}

RULES FOR TITLE:
- Max 70 characters
- No commas
- No hyphens
- No separators
- No literal translation
- Rewrite commercially for ecommerce

RULES FOR DESCRIPTION:
- HTML only
- Natural ecommerce tone
- Conversion focused
- No supplier mention

Language: ${language}
Region: ${region}
Category: ${category}
Tags: ${tags}

Product Title:
${normalizedTitle}

Product Description:
${promptDescription}
`;

  try {
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + process.env.OPENAI_API_KEY
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.55,
          max_tokens: 700,
          messages: [
            { role: "user", content: prompt }
          ]
        })
      }
    );

    const data = await response.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      return product;
    }

    const text = data.choices[0].message.content;
    const jsonText = extractJsonObject(text);

    if (!jsonText) {
      return product;
    }

    let result;
    try {
      result = JSON.parse(jsonText);
    } catch {
      return product;
    }

    const rawTitle =
      typeof result.seoTitle === "string" && result.seoTitle.trim()
        ? result.seoTitle
        : typeof result.title === "string" && result.title.trim()
          ? result.title
          : normalizedTitle;

    const cleanTitle = cleanSeoTitle(rawTitle) || normalizedTitle;

    const rawDescription =
      typeof result.description === "string"
        ? result.description
        : typeof result.seoDescription === "string"
          ? result.seoDescription
          : "";

    const cleanSeoDescription = String(rawDescription || "")
      .replace(/\[object Object\]/gi, "")
      .trim();

    const finalDescription = buildFinalDescription({
      originalHTML,
      seoDescription: cleanSeoDescription
    });

    // 🔥 HARD FALLBACK FINAL (ESTABILIDAD)
    let forcedTitle = cleanTitle;
    let forcedDescription = finalDescription;

    if (!forcedTitle || forcedTitle === normalizedTitle) {
      forcedTitle = normalizedTitle;
    }

    if (
      !forcedDescription ||
      forcedDescription.includes("[object Object]") ||
      forcedDescription.length < 50
    ) {
      forcedDescription = originalHTML || `<div>${forcedTitle}</div>`;
    }

    return {
      ...product,
      title: forcedTitle,
      description: forcedDescription,
      seoTitle: forcedTitle,
      seoDescription: cleanSeoDescription,
      tags: dedupeTags([
        ...(product.tags || []),
        ...((result.keywords || []).map((k) =>
          String(k || "").trim()
        ))
      ])
    };
  } catch (error) {
    console.error("ZEUS AI SEO ERROR:", error.message);
    return product;
  }
}

module.exports = {
  aiSeoOptimizer
};
