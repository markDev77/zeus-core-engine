const { writeWooProduct } = require("./woo.writer");

/* ========================================
   RESOLVER STORE CONTEXT (MULTI-STORE)
======================================== */
function resolveWooStoreContext(product = {}) {
  const meta = product.meta_data || [];

  const getMeta = (key) => {
    const found = meta.find((m) => m.key === key);
    return found ? found.value : null;
  };

  const baseUrl =
    getMeta("_zeus_store_base_url") ||
    process.env.WOO_DEFAULT_BASE_URL ||
    null;

  const consumerKey =
    getMeta("_zeus_consumer_key") ||
    process.env.WOO_DEFAULT_CONSUMER_KEY ||
    null;

  const consumerSecret =
    getMeta("_zeus_consumer_secret") ||
    process.env.WOO_DEFAULT_CONSUMER_SECRET ||
    null;

  const storeId =
    getMeta("_zeus_store_id") ||
    "default";

  return {
    baseUrl,
    consumerKey,
    consumerSecret,
    storeId,
    source: "woo"
  };
}

/* ========================================
   CONTROLLER WOO → ZEUS → WRITE
======================================== */
async function handleWooProductUpdate({ product, zeusOutput }) {
  try {
    const storeContext = resolveWooStoreContext(product);

    if (!storeContext.baseUrl || !storeContext.consumerKey || !storeContext.consumerSecret) {
      console.log("⛔ WOO STORE CONTEXT NOT RESOLVED", {
        productId: product?.id,
        storeContext
      });

      return {
        success: false,
        reason: "store_context_not_resolved"
      };
    }

    const writeResult = await writeWooProduct({
      productId: product.id,
      data: zeusOutput,
      storeContext
    });

    return writeResult;

  } catch (error) {
    console.error("❌ WOO CONTROLLER ERROR", error.message);

    return {
      success: false,
      reason: error.message
    };
  }
}

module.exports = {
  handleWooProductUpdate,
  resolveWooStoreContext
};
