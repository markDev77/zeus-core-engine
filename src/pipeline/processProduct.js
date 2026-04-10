// src/pipeline/processProduct.js

const { buildFinalTitle } = require("../engines/title.engine");
const { buildFinalDescription } = require("../engines/description.engine");
const { buildSEOIntro } = require("../engines/seo.engine");
const { resolvePolicy } = require("../policies/policy.engine");

async function processProduct({ source, product, store, policyContext }) {
  if (!product) {
    throw new Error("processProduct: product is required");
  }

  console.log("🧠 ZEUS PIPELINE START", {
    source,
    productId: product.id || null
  });

  /**
   * =========================
   * 🔍 RESOLVE POLICY
   * =========================
   */
  const policy = resolvePolicy({
    source,
    platform: store?.platform,
    store
  });

  /**
   * =========================
   * 🔧 NORMALIZE INPUT
   * =========================
   */
  const base = normalizeProduct(product);

  /**
   * =========================
   * 🧠 ENGINES
   * =========================
   */
  const title = await buildFinalTitle({
    aiTitle: null,
    originalTitle: base.title,
    language: store?.language
  });

  const description_html = await buildFinalDescription({
    title,
    originalHtml: base.description_html,
    language: store?.language,
    policy
  });

  const short_description = buildSEOIntro({
    title,
    description: description_html
  });

  const tags = buildTags({ title, short_description, policy });

  /**
   * =========================
   * 📦 BASE OUTPUT
   * =========================
   */
  let result = {
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

  /**
   * =========================
   * 🔥 APPLY POLICY (NUEVO)
   * =========================
   */
  if (typeof policy === "function") {
    // (por si en el futuro alguna policy regresa función directa)
    result = await policy({
      input: result,
      store,
      context: policyContext
    });

  } else if (policy?.name) {
    // si policy es objeto con métodos
    if (policy?.apply) {
      result = await policy.apply({
        input: result,
        store,
        context: policyContext
      });
    }
  }

  console.log("✅ ZEUS PIPELINE DONE", {
    productId: product.id || null,
    title: result.title,
    policy: result?._policy?.applied || policy?.name
  });

  return result;
}

/**
 * =========================
 * NORMALIZE
 * =========================
 */
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

/**
 * =========================
 * TAGS
 * =========================
 */
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
