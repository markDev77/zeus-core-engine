const { buildWooWriteHash, writeWooProduct } = require("./woo.writer");
const { normalizeWooProductInput } = require("./woo.input.normalizer");
const { isRecentZeusSelfWrite } = require("./woo.loop-guard");
const { resolveWooStoreContext } = require("./woo.store-resolver");

// ⚠️ Ajusta si tu export es distinto
const processProduct = require("../../pipeline/processProduct");

async function handleWooProductUpdateWebhook(req, res) {
  try {
    console.log("🔥 WOO WEBHOOK RECEIVED");

    const payload = req.body || {};
    const normalizedProduct = normalizeWooProductInput(payload);
    const productId = normalizedProduct.id;

    // 🔴 RESPUESTA INMEDIATA A WOO
    res.status(200).send("ok");

    if (!productId) {
      console.log("⚠️ VALIDATION CALL OR EMPTY PAYLOAD");
      return;
    }

    // 🔥 RESOLVER CONTEXTO DE TIENDA (MULTI-STORE)
    const storeContext = await resolveWooStoreContext(req);

    if (!storeContext) {
      console.log("⛔ STORE CONTEXT NOT RESOLVED");
      return;
    }

    console.log("🏪 STORE CONTEXT", storeContext);

    // 🔥 HASH DESDE PAYLOAD
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

    console.log("📦 NORMALIZED PRODUCT", {
      id: normalizedProduct.id,
      title: normalizedProduct.title
    });

    // 🔥 ZEUS CORE
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

    console.log("🧠 ZEUS RESULT", {
      productId,
      title: result.title
    });

    // 🔥 WRITE MULTI-STORE
    await writeWooProduct({
      productId,
      data: result,
      storeContext
    });

  } catch (error) {
    console.error("❌ WEBHOOK ERROR:", error.message);
  }
}

module.exports = {
  handleWooProductUpdateWebhook
};
