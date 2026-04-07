const { buildWooWriteHash, writeWooProduct } = require("./woo.writer");
const { normalizeWooProductInput } = require("./woo.input.normalizer");
const { isRecentZeusSelfWrite } = require("./woo.loop-guard");

// ⚠️ IMPORTANTE: usa tu export real (ajusta si es default)
const processProduct = require("../../pipeline/processProduct");

async function handleWooProductUpdateWebhook(req, res) {
  try {
    console.log("🔥 WOO WEBHOOK RECEIVED");

    const payload = req.body || {};
    const normalizedProduct = normalizeWooProductInput(payload);
    const productId = normalizedProduct.id;

    // 🔴 RESPONDER SIEMPRE A WOO (UNA SOLA VEZ)
    res.status(200).send("ok");

    if (!productId) {
      console.log("⚠️ VALIDATION CALL OR EMPTY PAYLOAD");
      return;
    }

    // 🔥 HASH DESDE PAYLOAD (NO GET)
    const currentHash = buildWooWriteHash({
      name: normalizedProduct.title,
      description: normalizedProduct.description,
      short_description: normalizedProduct.short_description,
      tags: normalizedProduct.tags || []
    });

    // 🔥 LOOP PROTECTION DESDE PAYLOAD
    const loopCheck = isRecentZeusSelfWrite({
      metaData: normalizedProduct.meta_data || [],
      currentHash
    });

    if (loopCheck.blocked) {
      console.log("⛔ LOOP BLOCKED (SELF WRITE)", {
        productId,
        ...loopCheck.debug
      });
      return;
    }

    console.log("📦 NORMALIZED PRODUCT:", {
      id: productId,
      title: normalizedProduct.title
    });

    // 🔥 ZEUS CORE (SIN DEPENDER DE WOO GET)
    const result = await processProduct({
      source: "woo",
      product: {
        id: normalizedProduct.id,
        title: normalizedProduct.title || "",
        description: normalizedProduct.description || "",
        short_description: normalizedProduct.short_description || "",
        images: normalizedProduct.images || [],
        variants: normalizedProduct.variants || [],
        category: normalizedProduct.categories || [],
        tags: normalizedProduct.tags || [],
        meta_data: normalizedProduct.meta_data || []
      },
      store: {
        platform: "woo",
        language: "es"
      },
      policyContext: {
        channel: "woocommerce",
        sourceContext: "webhook"
      }
    });

    console.log("🧠 ZEUS RESULT:", {
      productId,
      title: result.title
    });

    await writeWooProduct({
      productId,
      data: result
    });

  } catch (error) {
    console.error("❌ WEBHOOK ERROR:", error.message);
  }
}

module.exports = {
  handleWooProductUpdateWebhook
};
