const { getStoreByShop } = require("../../db/stores"); // ajusta path si aplica

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
    // 🔥 ZEUS STORE (DB) — NO ROMPE SI NO EXISTE
    // ========================================

    let store = null;

    if (normalizedShop) {
      try {
        store = await getStoreByShop(normalizedShop);
      } catch (err) {
        console.error("⚠️ STORE DB LOOKUP ERROR", err.message);
      }
    }

    // ========================================
    // 🔥 CASO 1: HEADERS + STORE DB
    // ========================================

    if (baseUrl && consumerKey && consumerSecret) {
      return {
        baseUrl: normalizedShop || baseUrl,
        consumerKey,
        consumerSecret,
        source: "headers",

        // 🔥 ZEUS CONTEXT (si existe)
        storeId: store?.id || null,
        tokens: store?.tokens || null,
        tokens_used: store?.tokens_used || null,
        tokens_balance: store?.tokens_balance || null,
        status: store?.status || null
      };
    }

    // ========================================
    // 🔥 CASO 2: ENV FALLBACK + STORE DB
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
        store = await getStoreByShop(normalizedFallback);
      } catch (err) {
        console.error("⚠️ STORE DB LOOKUP ERROR (fallback)", err.message);
      }
    }

    return {
      baseUrl: normalizedFallback,
      consumerKey: process.env.WOO_KEY,
      consumerSecret: process.env.WOO_SECRET,
      source: "env_fallback",

      // 🔥 ZEUS CONTEXT
      storeId: store?.id || null,
      tokens: store?.tokens || null,
      tokens_used: store?.tokens_used || null,
      tokens_balance: store?.tokens_balance || null,
      status: store?.status || null
    };

  } catch (error) {
    console.error("❌ STORE RESOLVER ERROR", error.message);
    return null;
  }
}

module.exports = {
  resolveWooStoreContext
};
