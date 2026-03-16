const { transformProduct } = require("../services/productTransformer");
const categoryBrain = require("../services/categoryBrain");
const { mapRegionalCategory } = require("../services/regionalCategoryMapper");
const { syncProduct } = require("../services/syncEngine");
const { getStore } = require("../services/storeRegistry");
const { aiSeoOptimizer } = require("../services/aiSeoOptimizer");
const { seoStructureBuilder } = require("../services/seoStructureBuilder");
const { generateProductSignature } = require("../services/productSignatureEngine");
const { registerProductSignature } = require("../services/productSignatureRegistry");
const { checkDuplicateProduct } = require("../services/duplicateProductBlocker");

const RECENT_PRODUCTS_TTL_MS = 120000;
const recentProductRuns = new Map();

function shouldSkipRecentRun(shopDomain, productId) {
  if (!shopDomain || !productId) {
    return false;
  }

  const key = `${shopDomain}:${productId}`;
  const now = Date.now();
  const lastRun = recentProductRuns.get(key);

  if (lastRun && now - lastRun < RECENT_PRODUCTS_TTL_MS) {
    return true;
  }

  recentProductRuns.set(key, now);

  for (const [mapKey, value] of recentProductRuns.entries()) {
    if (now - value > RECENT_PRODUCTS_TTL_MS) {
      recentProductRuns.delete(mapKey);
    }
  }

  return false;
}

function buildEffectiveStoreProfile(input = {}, shopDomain = "") {
  const base = {
    ...(input.storeProfile || {})
  };

  if (shopDomain === "eawi7g-hj.myshopify.com") {
    return {
      ...base,
      region: "MX",
      country: "MX",
      language: "es",
      currency: "MXN",
      shopDomain
    };
  }

  return {
    ...base,
    shopDomain
  };
}

async function runImportPipeline(input) {
  if (!input) {
    throw new Error("ZEUS PIPELINE: input missing");
  }

  console.log("ZEUS PIPELINE RAW INPUT:");
  console.log(JSON.stringify(input, null, 2));

  /*
  ==========================================
  SOURCE DETECTION
  ==========================================
  */

  const source =
    input.source ||
    input.origin ||
    "shopify";

  console.log("ZEUS SOURCE DETECTED:", source);

  /*
  ==========================================
  PRODUCT IDENTIFIERS
  ==========================================
  */

  const productId =
    input.productId ||
    input.shopifyProductId ||
    input.id ||
    input.payload?.id ||
    input.data?.id ||
    input.product?.id ||
    input.store?.productId ||
    null;

  const shopDomain =
    input.shopDomain ||
    input.store?.shopDomain ||
    input.store?.shop ||
    null;

  /*
  ==========================================
  LOOP PROTECTION
  ==========================================
  */

  if (shouldSkipRecentRun(shopDomain, productId)) {
    console.log("ZEUS LOOP GUARD SKIP:", {
      shopDomain,
      productId
    });

    return {
      status: "skipped",
      reason: "loop_guard_recent_product",
      productId,
      shopDomain
    };
  }

  const effectiveStoreProfile = buildEffectiveStoreProfile(
    input,
    shopDomain
  );

  /*
  ==========================================
  TRANSFORM PRODUCT
  ==========================================
  */

  const transformed = transformProduct({
    ...input,
    source,
    storeProfile: effectiveStoreProfile
  });

  /*
  ==========================================
  AI SEO OPTIMIZER
  ==========================================
  */

  let aiOptimized;

  try {
    aiOptimized = await aiSeoOptimizer(
      {
        ...transformed,
        source,
        shopDomain
      },
      effectiveStoreProfile,
      { source }
    );
  } catch (err) {
    console.warn("ZEUS SEO OPTIMIZER ERROR:", err.message);
    aiOptimized = transformed;
  }

  /*
  ==========================================
  SEO STRUCTURE BUILDER
  ==========================================
  */

  const seoStructured = seoStructureBuilder(
    aiOptimized
  );

  /*
  ==========================================
  PRODUCT SIGNATURE ENGINE
  ==========================================
  */

  const signatureData = generateProductSignature(
    seoStructured
  );

  console.log("ZEUS PRODUCT SIGNATURE:", signatureData.signature);

  /*
  ==========================================
  DUPLICATE PRODUCT CHECK
  ==========================================
  */

  const duplicateCheck = checkDuplicateProduct({
    signature: signatureData.signature,
    shopDomain,
    productId
  });

  console.log("ZEUS DUPLICATE CHECK:", duplicateCheck);

  if (duplicateCheck.status === "BLOCK") {
    console.log("ZEUS DUPLICATE PRODUCT BLOCKED");

    return {
      status: "blocked",
      reason: duplicateCheck.reason,
      signature: signatureData.signature,
      existing: duplicateCheck.existing
    };
  }

  /*
  ==========================================
  PRODUCT SIGNATURE REGISTRY
  ==========================================
  */

  const signatureRegistry = registerProductSignature({
    signature: signatureData.signature,
    shopDomain,
    productId
  });

  /*
  ==========================================
  PLATFORM DETECTION
  ==========================================
  */

  const platform =
    input.platform ||
    input.store?.platform ||
    "shopify";

  /*
  ==========================================
  CATEGORY BRAIN V2
  ==========================================
  */

  const classification = await categoryBrain.suggestCategory({
    title: seoStructured.title,
    description: seoStructured.description,
    tags: seoStructured.tags,
    platform,
    storeDomain: shopDomain
  });

  const baseCategory = classification.category;
  const confidence = classification.confidence;

  /*
  ==========================================
  REGIONAL CATEGORY MAPPING
  ==========================================
  */

  const regionalCategory = mapRegionalCategory({
    baseCategory,
    storeProfile: effectiveStoreProfile
  });

  /*
  ==========================================
  FINAL PRODUCT STRUCTURE
  ==========================================
  */

  const product = {
    ...seoStructured,
    source,
    baseCategory,
    regionalCategory,
    category: baseCategory,
    categoryConfidence: confidence,
    categoryDecision: classification.decision,
    categoryMatchedTerms: classification.matchedTerms || [],
    googleTaxonomyPath: classification.googleTaxonomyPath || null,
    platformCategory: classification.platformCategory || null,
    platformCategoryPath: classification.platformPath || null,
    categoryLearned: classification.learned || false,
    categoryLearningSource: classification.learningSource || null,
    productSignature: signatureData.signature,
    shopDomain
  };

  /*
  ==========================================
  STORE DETECTION
  ==========================================
  */

  const registeredStore = shopDomain
    ? getStore(shopDomain)
    : null;

  if (input.accessToken) {
    console.warn(
      "ZEUS WARNING: top-level accessToken ignored in favor of OAuth store token"
    );
  }

  if (
    registeredStore?.accessToken &&
    input.store?.accessToken &&
    registeredStore.accessToken !== input.store.accessToken
  ) {
    console.warn(
      "ZEUS WARNING: incoming store token mismatch, using storeRegistry token for",
      shopDomain
    );
  }

  const store = {
    shopDomain,
    accessToken:
      registeredStore?.accessToken ||
      input.store?.accessToken ||
      null,
    productId
  };

  console.log("ZEUS STORE CONTEXT:", {
    shopDomain: store.shopDomain,
    accessToken: store.accessToken ? "[REDACTED_PRESENT]" : null,
    productId: store.productId
  });

  /*
  ==========================================
  SYNC ENGINE
  ==========================================
  */

  try {
    console.log("ZEUS SYNC ENGINE START", productId);

    await syncProduct({
      platform,
      store,
      product
    });

    console.log("ZEUS SYNC ENGINE COMPLETE", productId);
  } catch (error) {
    console.error(
      "ZEUS PIPELINE SYNC ERROR:",
      error.message
    );
  }

  /*
  ==========================================
  RETURN RESULT
  ==========================================
  */

  return {
    product,
    baseCategory,
    regionalCategory,
    confidence,
    signatureRegistry
  };
}

module.exports = {
  runImportPipeline
};
