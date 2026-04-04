// src/connectors/woo/woo.connector.js

async function writeWooProduct({ store, product, zeusResult }) {
  if (!store) throw new Error("store is required");
  if (!product) throw new Error("product is required");
  if (!zeusResult) throw new Error("zeusResult is required");

  console.log("🛒 WOO WRITE START", {
    productId: product.id
  });

  // 🔒 SIMULACIÓN (NO WRITE REAL AÚN)
  // Aquí después irá API Woo o LTM

  const payload = buildWooPayload(product, zeusResult);

  console.log("📦 WOO PAYLOAD", {
    title: payload.name,
    tags: payload.tags?.length || 0
  });

  return {
    success: true,
    payload
  };
}

function buildWooPayload(product, zeusResult) {
  return {
    id: product.id,
    name: zeusResult.title,
    description: zeusResult.description_html,
    short_description: zeusResult.short_description,
    tags: formatTags(zeusResult.tags),
    images: product.images || [],
    variants: product.variants || []
  };
}

function formatTags(tags = []) {
  return tags.map((t) => ({
    name: t
  }));
}

module.exports = {
  writeWooProduct
};
