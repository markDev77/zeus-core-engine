const { normalizeWooProductInput } = require("./woo.input.normalizer");
const { buildWooWriteHash } = require("./woo.writer");
const { isRecentZeusSelfWrite } = require("./woo.loop-guard");
const { resolveWooStoreContext } = require("./woo.store-resolver");
const { writeWooProduct } = require("./woo.writer");
const { processProduct } = require("../../pipeline/processProduct");

/* ========================================
   WOO WEBHOOK CONTROLLER
======================================== */

async function handleWooProductUpdateWebhook(req, res) {
  try {
    const payload = req.body || {};
    const product = normalizeWooProductInput(payload);

    if (!product || !product.id) {
      console.log("⛔ INVALID WOO PAYLOAD");
      return res.status(400).send("invalid_payload");
    }

    console.log("🟢 WOO WEBHOOK RECEIVED", {
      productId: product.id
    });

    // 🔥 BREAKPOINT REAL (NO DEBUG)
    throw new Error("🔥 ZEUS BREAKPOINT WEBHOOK");

    /* ========================================
       LOOP PROTECTION
    ======================================== */

    const currentHash = buildWooWriteHash({
      name: product.title || "",
      description: product.description || "",
      short_description: product.short_description || "",
      tags: product.tags || []
    });

    const loopCheck = isRecentZeusSelfWrite({
      metaData: product.meta_data || [],
      currentHash
    });

    if (loopCheck.blocked) {
      console.log("🔁 LOOP BLOCKED (ZEUS WRITE DETECTED)", {
        productId: product.id,
        ...loopCheck.debug
      });

      return res.status(200).send("loop_blocked");
    }

    /* ========================================
       STORE CONTEXT
    ======================================== */

    const storeContext = await resolveWooStoreContext(req);

    if (!storeContext?.baseUrl || !storeContext?.consumerKey || !storeContext?.consumerSecret) {
      console.log("⛔ WOO STORE CONTEXT NOT RESOLVED", {
        productId: product.id,
        storeContext
      });

      return res.status(500).send("store_context_not_resolved");
    }

    /* ========================================
       CORE PIPELINE
    ======================================== */

    const zeusOutput = await processProduct({
      source: "woocommerce",
      product: {
        id: product.id,
        title: product.title || "",
        description: product.description || "",
        short_description: product.short_description || "",
        images: product.images || [],
        variants: product.variants || [],
        category: product.categories || [],
        tags: product.tags || [],
        meta_data: product.meta_data || []
      },
      store: {
        platform: "woocommerce",
        language: "es"
      },
      policyContext: {
        channel: "woocommerce",
        sourceContext: "webhook"
      }
    });

    /* ========================================
       WRITE
    ======================================== */

    const writeResult = await writeWooProduct({
      productId: product.id,
      data: zeusOutput,
      storeContext
    });

    if (!writeResult?.success) {
      console.log("❌ WOO WRITE FAILED", {
        productId: product.id,
        writeResult
      });

      return res.status(500).send("write_failed");
    }

    return res.status(200).send("ok");

  } catch (error) {
    console.error("❌ WOO WEBHOOK ERROR", error.message);
    return res.status(500).send("error");
  }
}

module.exports = handleWooProductUpdateWebhook;
module.exports.handleWooProductUpdateWebhook = handleWooProductUpdateWebhook;
