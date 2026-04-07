async function resolveWooStoreContext(req) {
  try {
    // 🔥 PRIORIDAD 1: HEADERS (recomendado)
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

    if (baseUrl && consumerKey && consumerSecret) {
      return {
        baseUrl,
        consumerKey,
        consumerSecret,
        source: "headers"
      };
    }

    // 🔥 FALLBACK (solo para pruebas actuales)
    return {
      baseUrl: process.env.WOO_BASE_URL,
      consumerKey: process.env.WOO_KEY,
      consumerSecret: process.env.WOO_SECRET,
      source: "env_fallback"
    };

  } catch (error) {
    console.error("❌ STORE RESOLVER ERROR", error.message);

    return null;
  }
}

module.exports = {
  resolveWooStoreContext
};
