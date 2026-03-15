/*
========================================
ZEUS SHOPIFY SYNC
========================================
Servicio único de sincronización
de productos Shopify desde ZEUS
========================================
*/

const axios = require("axios")

const SHOPIFY_API_VERSION = "2024-04"

function normalizeProductType(value) {
  if (!value) return "general"

  if (typeof value === "string") {
    return value
  }

  if (typeof value === "object" && value !== null) {
    if (typeof value.regionalCategory === "string" && value.regionalCategory.trim()) {
      return value.regionalCategory
    }

    if (typeof value.baseCategory === "string" && value.baseCategory.trim()) {
      return value.baseCategory
    }

    if (typeof value.category === "string" && value.category.trim()) {
      return value.category
    }

    if (typeof value.name === "string" && value.name.trim()) {
      return value.name
    }
  }

  return "general"
}

async function updateShopifyProduct({
  shopDomain,
  accessToken,
  productId,
  title,
  description,
  tags,
  productType
}) {
  if (!shopDomain || !productId) {
    throw new Error("Missing shopDomain or productId")
  }

  if (!accessToken) {
    throw new Error("Missing Shopify access token")
  }

  const url = `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/products/${productId}.json`

  const payload = {
    product: {
      id: productId,
      title: title || "",
      body_html: description || "",
      tags: Array.isArray(tags) ? tags.join(", ") : "",
      product_type: normalizeProductType(productType),
      metafields: [
        {
          namespace: "zeus",
          key: "optimized",
          type: "boolean",
          value: "true"
        }
      ]
    }
  }

  try {
    console.log("ZEUS SHOPIFY SYNC START:", productId)
    console.log("ZEUS SHOPIFY PAYLOAD:", JSON.stringify(payload, null, 2))

    const response = await axios.put(
      url,
      payload,
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json"
        },
        timeout: 15000
      }
    )

    console.log("ZEUS SHOPIFY SYNC COMPLETE:", productId)
    return response.data
  } catch (error) {
    console.error(
      "SHOPIFY UPDATE ERROR:",
      error.response?.data || error.message
    )
    throw error
  }
}

module.exports = {
  updateShopifyProduct
}
