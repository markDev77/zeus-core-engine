const axios = require("axios");
const crypto = require("crypto");

/* ========================================
   NORMALIZAR TAGS
======================================== */
function normalizeTags(tags = []) {
  if (!Array.isArray(tags)) return [];

  return tags
    .map((tag) => {
      if (!tag) return null;
      if (typeof tag === "string") return tag.trim();
      if (typeof tag === "object" && tag.name) return String(tag.name).trim();
      return null;
    })
    .filter(Boolean);
}

/* ========================================
   HASH PARA LOOP PROTECTION
======================================== */
function buildWooWriteHash({
  name,
  description,
  short_description,
  tags = []
}) {
  const normalizedTags = normalizeTags(tags).sort();

  const raw = JSON.stringify({
    name: name || "",
    description: description || "",
    short_description: short_description || "",
    tags: normalizedTags
  });

  return crypto.createHash("sha256").update(raw).digest("hex");
}

/* ========================================
   META DATA ZEUS
======================================== */
function buildWooMetaData({
  title,
  description_html,
  short_description,
  tags
}) {
  const writeHash = buildWooWriteHash({
    name: title,
    description: description_html,
    short_description,
    tags
  });

  return [
    {
      key: "_zeus_last_write_origin",
      value: "zeus"
    },
    {
      key: "_zeus_last_write_hash",
      value: writeHash
    },
    {
      key: "_zeus_last_write_at",
      value: new Date().toISOString()
    }
  ];
}

/* ========================================
   WRITE PRODUCT
======================================== */
async function writeWooProduct({ productId, data, storeContext }) {
  try {
    const baseUrl = storeContext?.baseUrl;
    const consumerKey = storeContext?.consumerKey;
    const consumerSecret = storeContext?.consumerSecret;

    if (!baseUrl || !consumerKey || !consumerSecret) {
      console.log("⛔ INVALID STORE CONTEXT", storeContext);
      return { success: false, reason: "invalid_store_context" };
    }

    if (!productId) {
      console.log("⛔ PRODUCT ID MISSING");
      return { success: false, reason: "missing_product_id" };
    }

    const payload = {
      name: data.title || "",
      description: data.description_html || "",
      short_description: data.short_description || "",
      tags: normalizeTags(data.tags).map((name) => ({ name })),
      meta_data: buildWooMetaData({
        title: data.title || "",
        description_html: data.description_html || "",
        short_description: data.short_description || "",
        tags: data.tags || []
      })
    };

    const url = `${baseUrl}/wp-json/wc/v3/products/${productId}`;

    const response = await axios.put(url, payload, {
      auth: {
        username: consumerKey,
        password: consumerSecret
      },
      headers: {
        "Content-Type": "application/json"
      },
      timeout: 20000
    });

    console.log("✅ WOO WRITE SUCCESS", {
      productId,
      status: response.status
    });

    return {
      success: true,
      status: response.status
    };

  } catch (error) {
    console.error(
      "❌ WOO WRITE ERROR",
      error.response?.data || error.message
    );

    return {
      success: false,
      reason: error.message
    };
  }
}

module.exports = {
  writeWooProduct,
  buildWooWriteHash
};
