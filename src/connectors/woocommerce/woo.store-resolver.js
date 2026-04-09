const { getStore } = require("../../services/storeService"); // 🔥 USAR LO QUE YA EXISTE

async function resolveWooStoreContext(req) {
  try {
    // ========================================
    // 🔥 PRIORIDAD 1: HEADERS (NO TOCAR)
    // ========================================

    const baseUrl =
      req.headers["x-woo-store-url"] ||
      req.headers["x-store-url"] ||
      null;

    const consumerKey =
      req.headers["x-woo-key"] ||
      null;

    const consumerSecret =
      req.headers["x-woo-secret"] ||
      null;

    // ========================================
    // 🔥 NORMALIZACIÓN
    // ========================================

    const normalizedShop = baseUrl
      ? String(baseUrl)
          .replace(/^https?:\/\//, "")
          .replace(/\/$/, "")
          .toLowerCase()
      : null;

    // ========================================
    // 🔥 STORE LOOKUP (ZEUS REAL)
    // ========================================

    let store = null;

    if (normalizedShop) {
      try {
        store = await getStore(normalizedShop);
      } catch (err) {
        console.error("⚠️ STORE LOOKUP ERROR", err.message);
      }
    }

    // ========================================
    // 🔥 CASO 1: HEADERS (NO ROMPER)
    // ========================================

    if (baseUrl && consumerKey && consumerSecret) {
      return {
        baseUrl: normalizedShop || baseUrl,
        consumerKey,
        consumerSecret,
        source: "headers",

        // 🔥 ZEUS CONTEXT REAL (SI EXISTE)
        storeId: store?.id || normalizedShop,
        tokens: store?.tokens || null,
        tokens_used: store?.tokens_used || null,
        tokens_balance: store?.tokens_balance || null,
        status: store?.status || "active"
      };
    }

    // ========================================
    // 🔥 FALLBACK ENV (NO TOCAR)
    // ========================================

    const fallbackBase = process.env.WOO_BASE_URL;

    const normalizedFallback = fallbackBase
      ? String(fallbackBase)
          .replace(/^https?:\/\//, "")
          .replace(/\/$/, "")
          .toLowerCase()
      : null;

    if (!store && normalizedFallback) {
      try {
        store = await getStore(normalizedFallback);
      } catch (err) {
        console.error("⚠️ STORE LOOKUP ERROR (fallback)", err.message);
      }
    }

    return {
      baseUrl: normalizedFallback,
      consumerKey: process.env.WOO_KEY,
      consumerSecret: process.env.WOO_SECRET,
      source: "env_fallback",

      // 🔥 ZEUS CONTEXT REAL
      storeId: store?.id || normalizedFallback,
      tokens: store?.tokens || null,
      tokens_used: store?.tokens_used || null,
      tokens_balance: store?.tokens_balance || null,
      status: store?.status || "active"
    };

  } catch (error) {
    console.error("❌ STORE RESOLVER ERROR", error.message);
    return null;
  }
}

module.exports = {
  resolveWooStoreContext
};
