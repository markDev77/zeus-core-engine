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
    // 🔥 CASO 1: HEADERS (ACTUAL PRODUCCIÓN)
    // ========================================

    if (baseUrl && consumerKey && consumerSecret) {
      return {
        baseUrl: normalizedShop || baseUrl,
        consumerKey,
        consumerSecret,
        source: "headers",

        // 🔥 PREPARADO PARA ZEUS (SIN DB AÚN)
        storeId: normalizedShop || baseUrl,
        tokens: null,
        tokens_used: null,
        tokens_balance: null,
        status: "active"
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

    return {
      baseUrl: normalizedFallback,
      consumerKey: process.env.WOO_KEY,
      consumerSecret: process.env.WOO_SECRET,
      source: "env_fallback",

      // 🔥 PREPARADO PARA ZEUS
      storeId: normalizedFallback,
      tokens: null,
      tokens_used: null,
      tokens_balance: null,
      status: "active"
    };

  } catch (error) {
    console.error("❌ STORE RESOLVER ERROR", error.message);
    return null;
  }
}

module.exports = {
  resolveWooStoreContext
};
