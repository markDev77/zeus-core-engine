/* ========================================
   WOO WEBHOOK CONTROLLER (ALINEADO A PIPELINE REAL)
======================================== */

async function handleWooProductUpdateWebhook(req, res) {
  try {
    const product = req.body;

    if (!product || !product.id) {
      console.log("⛔ INVALID WOO PAYLOAD");
      return res.status(400).send("invalid_payload");
    }

    console.log("🟢 WOO WEBHOOK RECEIVED", {
      productId: product.id
    });

    // ✅ IMPORT CORRECTO
    const { runImportPipeline } = require("../../pipeline/importPipeline");

    await runImportPipeline({
      source: "woocommerce",
      productId: product.id,
      product,
      platform: "woocommerce",
      store: {
        shopDomain:
          (product.meta_data || []).find(m => m.key === "_zeus_store_id")?.value ||
          null
      }
    });

    return res.status(200).send("ok");

  } catch (error) {
    console.error("❌ WOO WEBHOOK ERROR", error.message);
    return res.status(500).send("error");
  }
}

/* ========================================
   EXPORT
======================================== */

module.exports = handleWooProductUpdateWebhook;
module.exports.handleWooProductUpdateWebhook = handleWooProductUpdateWebhook;
