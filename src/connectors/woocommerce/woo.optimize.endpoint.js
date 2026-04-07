/* ========================================
   WOO OPTIMIZE ENDPOINT (RESPONSE ONLY)
======================================== */

const { processProduct } = require("../../pipeline/processProduct");

async function handleWooOptimize(req, res) {
  try {
    const body = req.body || {};

    const input = body.input || {};
    const taxonomy = body.taxonomy || {};
    const requestId = body.requestId || null;

    const title = input.title || "";
    const description = input.description || "";

    if (!title && !description) {
      return res.status(400).json({
        ok: false,
        error: "missing_input"
      });
    }

    console.log("🟣 ZEUS WOO OPTIMIZE REQUEST", {
      requestId,
      hasTitle: !!title
    });

    const result = await processProduct({
      source: "woocommerce",
      product: {
        id: null,
        title,
        description,
        short_description: "",
        images: [],
        variants: [],
        category: [],
        tags: [],
        meta_data: []
      },
      store: {
        platform: "woocommerce",
        language: "es"
      },
      policyContext: {
        channel: "woocommerce",
        sourceContext: "wp_worker"
      }
    });

    return res.status(200).json({
      ok: true,
      requestId,
      output: {
        title: result.title || "",
        description: result.description_html || "",
        tags: result.tags || []
      }
    });

  } catch (error) {
    console.error("❌ WOO OPTIMIZE ERROR", error.message);

    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}

module.exports = {
  handleWooOptimize
};
