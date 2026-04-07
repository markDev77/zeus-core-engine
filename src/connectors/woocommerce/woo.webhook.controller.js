/* ========================================
   WOO WEBHOOK CONTROLLER (SAFE EXPORT)
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

    const { processProductJob } = require("../../core/processProduct");

    await processProductJob({
      job: {
        shop:
          (product.meta_data || []).find(m => m.key === "_zeus_store_id")?.value ||
          "default",
        payload: {
          productId: product.id
        }
      },
      services: req.app.locals?.services || {}
    });

    return res.status(200).send("ok");

  } catch (error) {
    console.error("❌ WOO WEBHOOK ERROR", error.message);
    return res.status(500).send("error");
  }
}

/* ========================================
   🔴 EXPORT DOBLE (ANTI-UNDEFINED)
======================================== */

// 👇 SOPORTA AMBAS FORMAS DE IMPORT
module.exports = handleWooProductUpdateWebhook;
module.exports.handleWooProductUpdateWebhook = handleWooProductUpdateWebhook;
