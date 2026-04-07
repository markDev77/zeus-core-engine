const axios = require("axios");
const crypto = require("crypto");

/* ========================================
   NORMALIZAR TAGS
======================================== */
function normalizeTags(tags = []) {
  if (!Array.isArray(tags)) return [];

  return [...new Set(
    tags
      .map((tag) => {
        if (!tag) return null;
        if (typeof tag === "string") return tag.trim();
        if (typeof tag === "object" && tag.name) return String(tag.name).trim();
        return null;
      })
      .filter(Boolean)
  )];
}

/* ========================================
   NORMALIZAR BASE URL
======================================== */
function normalizeWooBaseUrl(baseUrl = "") {
  return String(baseUrl || "")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/wp-json\/wc\/v3$/i, "")
    .replace(/\/wp-json$/i, "");
}

/* ========================================
   AUTH HEADER
======================================== */
function buildBasicAuthHeader(consumerKey, consumerSecret) {
  const token = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
  return `Basic ${token}`;
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
   VALIDAR PERSISTENCIA
======================================== */
function validateWooWriteResponse({ responseData, expectedPayload }) {
  const responseTags = normalizeTags(responseData?.tags || []);
  const expectedTags = normalizeTags(expectedPayload?.tags || []).sort();

  const responseHash = buildWooWriteHash({
    name: responseData?.name || "",
    description: responseData?.description || "",
    short_description: responseData?.short_description || "",
    tags: responseTags
  });

  const expectedHash = buildWooWriteHash({
    name: expectedPayload?.name || "",
    description: expectedPayload?.description || "",
    short_description: expectedPayload?.short_description || "",
    tags: expectedTags
  });

  return {
    ok: responseHash === expectedHash,
    expectedHash,
    responseHash,
    responseName: responseData?.name || "",
    expectedName: expectedPayload?.name || "",
    responseTags,
    expectedTags
  };
}

/* ========================================
   WRITE PRODUCT
======================================== */
async function writeWooProduct({ productId, data, storeContext }) {
  try {
    const rawBaseUrl = storeContext?.baseUrl;
    const consumerKey = storeContext?.consumerKey;
    const consumerSecret = storeContext?.consumerSecret;

    if (!rawBaseUrl || !consumerKey || !consumerSecret) {
      console.log("⛔ INVALID STORE CONTEXT", storeContext);
      return { success: false, reason: "invalid_store_context" };
    }

    if (!productId) {
      console.log("⛔ PRODUCT ID MISSING");
      return { success: false, reason: "missing_product_id" };
    }

    const baseUrl = normalizeWooBaseUrl(rawBaseUrl);

    if (!baseUrl) {
      console.log("⛔ INVALID BASE URL", { rawBaseUrl });
      return { success: false, reason: "invalid_base_url" };
    }

    const normalizedTags = normalizeTags(data?.tags || []);

    const payload = {
      name: data?.title || "",
      description: data?.description_html || "",
      short_description: data?.short_description || "",
      tags: normalizedTags.map((name) => ({ name })),
      meta_data: buildWooMetaData({
        title: data?.title || "",
        description_html: data?.description_html || "",
        short_description: data?.short_description || "",
        tags: normalizedTags
      })
    };

    const url = `${baseUrl}/wp-json/wc/v3/products/${productId}`;

    console.log("🟡 WOO WRITE START", {
      productId,
      storeSource: storeContext?.source || "unknown",
      url
    });

    const response = await axios.put(url, payload, {
      params: {
        consumer_key: consumerKey,
        consumer_secret: consumerSecret
      },
      auth: {
        username: consumerKey,
        password: consumerSecret
      },
      headers: {
        Authorization: buildBasicAuthHeader(consumerKey, consumerSecret),
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      timeout: 30000,
      validateStatus: () => true
    });

    if (response.status < 200 || response.status >= 300) {
      console.error("❌ WOO WRITE HTTP ERROR", {
        productId,
        status: response.status,
        data: response.data
      });

      return {
        success: false,
        reason: "http_error",
        status: response.status,
        data: response.data
      };
    }

    const validation = validateWooWriteResponse({
      responseData: response.data || {},
      expectedPayload: payload
    });

    if (!validation.ok) {
      console.error("❌ WOO WRITE VALIDATION FAILED", {
        productId,
        status: response.status,
        validation
      });

      return {
        success: false,
        reason: "persistence_validation_failed",
        status: response.status,
        validation
      };
    }

    console.log("✅ WOO WRITE SUCCESS", {
      productId,
      status: response.status,
      validation
    });

    return {
      success: true,
      status: response.status,
      productId: response.data?.id || productId,
      validation
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
