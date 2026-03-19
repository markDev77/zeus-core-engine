const { transformProduct } = require("../services/productTransformer");
const categoryBrain = require("../services/categoryBrain");
const { mapRegionalCategory } = require("../services/regionalCategoryMapper");
const { syncProduct } = require("../services/syncEngine");
const { getStore } = require("../services/storeRegistry");

const {
  assertStoreCanProcess,
  consumeStoreQuota,
  getStoreAccessSnapshot
} = require("../services/storeAccessControl");

const { aiSeoOptimizer } = require("../services/aiSeoOptimizer");
const { seoStructureBuilder } = require("../services/seoStructureBuilder");

const { generateProductSignature } = require("../services/productSignatureEngine");
const { registerProductSignature } = require("../services/productSignatureRegistry");
const { checkDuplicateProduct } = require("../services/duplicateProductBlocker");

const RECENT_PRODUCTS_TTL_MS = 120000;
const recentProductRuns = new Map();

/*
==========================================
LOOP PROTECTION
==========================================
*/
function shouldSkipRecentRun(shopDomain, productId) {
  if (!shopDomain || !productId) return false;

  const key = `${shopDomain}:${productId}`;
  const now = Date.now();
  const lastRun = recentProductRuns.get(key);

  if (lastRun && now - lastRun < RECENT_PRODUCTS_TTL_MS) {
    return true;
  }

  recentProductRuns.set(key, now);

  for (const [k, v] of recentProductRuns.entries()) {
    if (now - v > RECENT_PRODUCTS_TTL_MS) {
      recentProductRuns.delete(k);
    }
  }

  return false;
}

/*
==========================================
STORE PROFILE BUILDER
==========================================
*/
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

/*
==========================================
MAIN PIPELINE
==========================================
*/
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

  /*
  ==========================================
  IDENTIFIERS
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
  LOOP GUARD
  ==========================================
  */
  if (shouldSkipRecentRun(shopDomain, productId)) {
    console.log("ZEUS LOOP GUARD SKIP:", { shopDomain, productId });

    return {
      status: "skipped",
      reason: "loop_guard_recent_product",
      productId,
      shopDomain
    };
  }

  /*
  ==========================================
  STORE VALIDATION
  ==========================================
  */
  const registeredStore = shopDomain
    ? getStore(shopDomain)
    : null;

  if (!registeredStore) {
    console.warn("ZEUS STORE NOT REGISTERED:", shopDomain);

    return {
      status: "blocked",
      reason: "store_not_registered",
      productId,
      shopDomain
    };
  }

  let initialAccessSnapshot = null;

  try {
    initialAccessSnapshot = assertStoreCanProcess(shopDomain);
  } catch (error) {
    return {
      status: "blocked",
      reason: error.code || "store_access_denied",
      message: error.message,
      shopDomain,
      productId,
      access: error.details || null
    };
  }

  const effectiveStoreProfile = buildEffectiveStoreProfile(
    input,
    shopDomain
  );

  /*
  ==========================================
  TRANSFORM
  ==========================================
  */
  const transformed = transformProduct({
    ...input,
    source,
    storeProfile: effectiveStoreProfile
  });

  /*
  ==========================================
  PLATFORM
  ==========================================
  */
  const platform =
    input.platform ||
    input.store?.platform ||
    registeredStore.platform ||
    "shopify";

  /*
  ==========================================
  CATEGORY BRAIN
  ==========================================
  */
  const classification = await categoryBrain.suggestCategory({
    title: transformed.title,
    description: transformed.description,
    tags: transformed.tags,
    platform,
    storeDomain: shopDomain
  });

  const baseCategory = classification.category;
  const confidence = classification.confidence;

  /*
  ==========================================
  REGIONAL CATEGORY
  ==========================================
  */
  const regionalCategory = mapRegionalCategory({
    baseCategory,
    storeProfile: effectiveStoreProfile
  });

  /*
  ==========================================
  SEO OPTIMIZER
  ==========================================
  */
  let aiOptimized;

  try {
    aiOptimized = await aiSeoOptimizer(
      {
        ...transformed,
        source,
        shopDomain,
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
        categoryLearningSource: classification.learningSource || null
      },
      effectiveStoreProfile,
      { source }
    );
  } catch (err) {
    aiOptimized = transformed;
  }

  /*
  ==========================================
  SEO STRUCTURE
  ==========================================
  */
  const seoStructured = seoStructureBuilder(aiOptimized);

  /*
  ==========================================
  SIGNATURE
  ==========================================
  */
  const signatureData = generateProductSignature(seoStructured);

  /*
  ==========================================
  DUPLICATE CHECK
  ==========================================
  */
  const duplicateCheck = checkDuplicateProduct({
    signature: signatureData.signature,
    shopDomain,
    productId
  });

  if (duplicateCheck.status === "BLOCK") {
    return {
      status: "blocked",
      reason: duplicateCheck.reason,
      signature: signatureData.signature,
      existing: duplicateCheck.existing,
      shopDomain,
      productId
    };
  }

  /*
  ==========================================
  SIGNATURE REGISTRY
  ==========================================
  */
  const signatureRegistry = registerProductSignature({
    signature: signatureData.signature,
    shopDomain,
    productId
  });

  /*
  ==========================================
  FINAL PRODUCT
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
    productSignature: signatureData.signature,
    shopDomain
  };

  /*
  ==========================================
  STORE CONTEXT
  ==========================================
  */
  const store = {
    shopDomain,
    accessToken:
      registeredStore?.accessToken ||
      input.store?.accessToken ||
      null,
    productId
  };

  if (!store.accessToken) {
    return {
      status: "blocked",
      reason: "store_token_missing",
      shopDomain,
      productId
    };
  }

  /*
  ==========================================
  SECOND GATE
  ==========================================
  */
  let preSyncAccessSnapshot = null;

  try {
    preSyncAccessSnapshot = assertStoreCanProcess(shopDomain);
  } catch (error) {
    return {
      status: "blocked",
      reason: error.code || "store_access_denied",
      message: error.message,
      shopDomain,
      productId,
      access: error.details || null
    };
  }

  /*
  ==========================================
  SYNC
  ==========================================
  */
  let syncCompleted = false;
  let usageSnapshot = null;

  try {
    await syncProduct({
      platform,
      store,
      product
    });

    syncCompleted = true;
  } catch (error) {
    return {
      status: "error",
      reason: "sync_failed",
      message: error.message,
      shopDomain,
      productId,
      product
    };
  }

  /*
  ==========================================
  QUOTA
  ==========================================
  */
  if (syncCompleted) {
    try {
      usageSnapshot = await consumeStoreQuota(shopDomain, 1);
    } catch (error) {}
  }

  /*
  ==========================================
  RETURN
  ==========================================
  */
  return {
    status: "processed",
    product,
    baseCategory,
    regionalCategory,
    confidence,
    signatureRegistry,
    access: {
      initial: initialAccessSnapshot,
      preSync:
        preSyncAccessSnapshot ||
        getStoreAccessSnapshot(shopDomain)
    },
    usage: usageSnapshot
  };
}

module.exports = {
  runImportPipeline
};
