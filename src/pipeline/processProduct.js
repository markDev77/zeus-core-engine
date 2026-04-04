// src/pipeline/processProduct.js

const { buildFinalTitle } = require("../engines/title.engine");
const { buildFinalDescription } = require("../engines/description.engine");
const { buildSEOIntro } = require("../engines/seo.engine"); // 🔥 FIX
const { resolvePolicy } = require("../policies/policy.engine");

async function processProduct({ source, product, store, policyContext }) {
  if (!product) {
    throw new Error("processProduct: product is required");
  }

  console.log("🧠 ZEUS PIPELINE START", {
    source,
    productId: product.id || null
  });

  const policy = resolvePolicy({
    source,
    platform: store?.platform,
    context: policyContext
  });

  const base = normalizeProduct(product);

  const title = await buildFinalTitle({
    title: base.title,
    language: store?.language,
    policy
  });

  const description_html = await buildFinalDescription({
    title,
    originalHtml: base.description_html,
    language: store?.language,
    policy
  });

  // 🔥 SEO SIMPLE (SIN generateSEO)
  const short_description = buildSEOIntro({
    title,
    description: description_html
  });

  const tags = buildTags({ title, short_description, policy });

  const result = {
    title,
    description_html,
    short_description,
    tags,
    category: base.category || null,
    images: base.images || [],
    variants: base.variants || [],
    meta: {
      source,
      policy: policy?.name || "default"
    }
  };

  console.log("✅ ZEUS PIPELINE DONE", {
    productId: product.id || null,
    title: result.title
  });

  return result;
}

function normalizeProduct(product) {
  return {
    id: product.id || null,
    title: product.title || "",
    description_html:
      product.body_html ||
      product.description ||
      "",
    category: product.category || null,
    images: product.images || [],
    variants: product.variants || []
  };
}

function buildTags({ title, short_description, policy }) {
  const baseTags = [];

  if (title) baseTags.push(title);
  if (short_description) baseTags.push(short_description);

  if (policy?.tag_prefix) {
    baseTags.push(policy.tag_prefix);
  }

  return [...new Set(baseTags)];
}

module.exports = {
  processProduct
};
