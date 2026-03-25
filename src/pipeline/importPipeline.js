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

  /*
  ==========================================
  STORE DETECTION + COMMERCIAL GATE
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
    console.warn("ZEUS ACCESS BLOCKED BEFORE PIPELINE:", {
      shopDomain,
      code: error.code,
      message: error.message
    });

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
  PLATFORM DETECTION
  ==========================================
  */

  const platform =
    input.platform ||
    input.store?.platform ||
    registeredStore.platform ||
    "shopify";

  /*
  ==========================================
  CATEGORY BRAIN V2
  CLASIFICA SOBRE EL CONTENIDO TRANSFORMADO
  ANTES DE REESCRITURA SEO
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
  REGIONAL CATEGORY MAPPING
  ==========================================
  */

  const regionalCategory = mapRegionalCategory({
    baseCategory,
    storeProfile: effectiveStoreProfile
  });

  /*
  ==========================================
  AI SEO OPTIMIZER
  CORRE DESPUÉS DE CATEGORY BRAIN
  PARA NO DEGRADAR CLASIFICACIÓN
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
      existing: duplicateCheck.existing,
      shopDomain,
      productId
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
  STORE CONTEXT
  ==========================================
  */

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
  SECOND COMMERCIAL GATE
  ==========================================
  */

  let preSyncAccessSnapshot = null;

  try {
    preSyncAccessSnapshot = assertStoreCanProcess(shopDomain);
  } catch (error) {
    console.warn("ZEUS ACCESS BLOCKED BEFORE SYNC:", {
      shopDomain,
      code: error.code,
      message: error.message
    });

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
SYNC ENGINE
==========================================
*/

let syncCompleted = false;
let usageSnapshot = null;
let chargeable = false;

try {
  console.log("ZEUS SYNC ENGINE START", productId);

  await syncProduct({
    platform,
    store,
    product
  });

  chargeable = true;
  syncCompleted = true;

  console.log("ZEUS SYNC ENGINE COMPLETE", productId);

  // ✅ RETURN DE ÉXITO (CLAVE)
  return {
    status: "ok",
    success: syncCompleted,
    chargeable,
    usageSnapshot,
    shopDomain,
    productId
  };

} catch (error) {
  console.error(
    "ZEUS PIPELINE SYNC ERROR:",
    error.message
  );

  return {
    status: "error",
    reason: "sync_failed",
    message: error.message,
    shopDomain,
    productId,
    product,
    baseCategory,
    regionalCategory,
    confidence,
    signatureRegistry,
    syncCompleted,
    chargeable,
    usageSnapshot
  };
}
  /*
  ==========================================
  CONSUME QUOTA ONLY AFTER SUCCESSFUL SYNC
  ==========================================
  */

  if (syncCompleted) {
    try {
      usageSnapshot = await consumeStoreQuota(
        shopDomain,
        1
      );

      console.log("ZEUS STORE USAGE UPDATED:", usageSnapshot);
    } catch (error) {
      console.error(
        "ZEUS STORE USAGE UPDATE ERROR:",
        error.message
      );
    }
  }

  /*
  ==========================================
  RETURN RESULT
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
