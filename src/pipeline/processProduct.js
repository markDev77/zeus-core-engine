// src/pipeline/processProduct.js

const { buildFinalTitle } = require("../engines/title.engine");
const { buildFinalDescription } = require("../engines/description.engine");
const { generateSEO } = require("../engines/seo.engine");
const { resolvePolicy } = require("../policies/policy.engine");

async function processProduct({ source, product, store, policyContext }) {
  if (!product) {
    throw new Error("processProduct: product is required");
  }

  console.log("🧠 ZEUS PIPELINE START", {
    source,
    productId: product.id || null
  });

  // 1. Policy
  const policy = resolvePolicy({
    source,
    platform: store?.platform,
    context: policyContext
  });

  // 2. Normalize
  const base = normalizeProduct(product);

  // 3. Title
  const title = await buildFinalTitle({
    title: base.title,
    language: store?.language,
    policy
  });

  // 4. Description
  const description_html = await buildFinalDescription({
    title,
    originalHtml: base.description_html,
    language: store?.language,
    policy
  });

  // 5. SEO
  const seo = await generateSEO({
    title,
    description: description_html,
    language: store?.language
  });

  // 6. Tags
  const tags = buildTags({ title, seo, policy });

  // 7. Category (placeholder)
  const category = base.category || null;

  // 8. Variants / Images
  const variants = base.variants || [];
  const images = base.images || [];

  const result = {
    title,
    description_html,
    short_description: seo?.short_description || "",
    tags,
    category,
    images,
    variants,
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

function buildTags({ title, seo, policy }) {
  const baseTags = [];

  if (seo?.keywords) {
    baseTags.push(...seo.keywords);
  }

  if (policy?.tag_prefix) {
    baseTags.push(policy.tag_prefix);
  }

  return [...new Set(baseTags)];
}

module.exports = {
  processProduct
};
