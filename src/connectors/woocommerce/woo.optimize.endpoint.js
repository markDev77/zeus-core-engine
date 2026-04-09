// ==========================================
// ZEUS — WOO OPTIMIZE ENDPOINT (REAL ENGINE)
// ==========================================

async function handleWooOptimize(req, res) {
  try {
    const { input } = req.body;

    if (!input || !input.title) {
      return res.status(400).json({
        ok: false,
        error: "invalid_input"
      });
    }

    // 🔥 IMPORTANTE: usar services del server (NO require directo)
    const services = req.app.locals?.services;

    if (!services || !services.runZeusProductPipeline) {
      console.error("❌ ZEUS SERVICES NOT AVAILABLE");
      return res.status(500).json({
        ok: false,
        error: "services_unavailable"
      });
    }

    // ==========================================
    // 🔥 EJECUTAR CORE ENGINE REAL
    // ==========================================

    const result = await services.runZeusProductPipeline({
      source: "woocommerce",
      productId: null,
      payload: {
        title: input.title,
        description: input.description || ""
      }
    });

    // ==========================================
    // RESPONSE NORMALIZADO
    // ==========================================

    return res.json({
      ok: true,
      requestId: null,
      output: {
        title: result?.title || input.title,
        description: result?.description || input.description || "",
        tags: result?.tags || []
      }
    });

  } catch (err) {
    console.error("❌ WOO OPTIMIZE ERROR", err);

    return res.status(500).json({
      ok: false,
      error: "internal_error"
    });
  }
}

module.exports = {
  handleWooOptimize
};
