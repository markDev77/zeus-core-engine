const wooClient = require("./woo.client");
const { buildWooWriteHash } = require("./woo.writer");
const { writeWooProduct } = require("./woo.writer");

// ⚠️ IMPORTANTE: processProduct debe venir de tu ruta real
const processProduct = require("../../pipeline/processProduct");

async function handleWooProductUpdateWebhook(req, res) {
  try {
    console.log("🔥 WOO WEBHOOK RECEIVED");

    const product = req.body || {};
    const productId = product.id || product.ID || null;

    // 🔴 RESPONDER SIEMPRE A WOO (UNA SOLA VEZ)
    res.status(200).send("ok");

    if (!productId) {
      console.log("⚠️ VALIDATION CALL OR EMPTY PAYLOAD");
      return;
    }

    // 🔥 LEER PRODUCTO REAL DESDE WOO (se mantiene en este paso)
    const freshProduct = await wooClient.getProduct(productId);

    const metaData = Array.isArray(freshProduct.meta_data)
      ? freshProduct.meta_data
      : [];

    const getMeta = (key) => {
      const found = metaData.find((m) => m && m.key === key);
      return found ? found.value : null;
    };

    const lastOrigin = getMeta("_zeus_last_write_origin");
    const lastHash = getMeta("_zeus_last_write_hash");
    const lastWriteAt = getMeta("_zeus_last_write_at");

    const currentHash = buildWooWriteHash({
      name: freshProduct.name,
      description: freshProduct.description,
      short_description: freshProduct.short_description,
      tags: freshProduct.tags || []
    });

    const ageMs = lastWriteAt
      ? Date.now() - new Date(lastWriteAt).getTime()
      : null;

    const isRecentZeusWrite =
      lastOrigin === "zeus" &&
      lastHash &&
      lastHash === currentHash &&
      Number.isFinite(ageMs) &&
      ageMs >= 0 &&
      ageMs <= 5 * 60 * 1000;

    // 🔴 LOOP PROTECTION REAL
    if (isRecentZeusWrite) {
      console.log("⛔ LOOP BLOCKED (SELF WRITE)", {
        productId,
        currentHash
      });
      return;
    }

    console.log("📦 PRODUCT:", {
      id: productId,
      name: freshProduct.name
    });

    const result = await processProduct({
      source: "woo",
      product: {
        id: freshProduct.id,
        title: freshProduct.name || "",
        description:
          freshProduct.description ||
          freshProduct.short_description ||
          "",
        images: freshProduct.images || [],
        variants: freshProduct.variations || []
      },
      store: {
        platform: "woo",
        language: "es"
      }
    });

    console.log("🧠 ZEUS RESULT:", {
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
