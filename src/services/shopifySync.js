/*
========================================
ZEUS SHOPIFY SYNC
========================================
Servicio unificado de sincronización
de productos Shopify desde ZEUS
========================================
*/

const axios = require("axios")

async function updateShopifyProduct({
  shopDomain,
  accessToken,
  productId,
  title,
  description,
  tags,
  productType
}) {

  /*
  ========================================
  VALIDATION
  ========================================
  */

  if (!shopDomain || !productId) {
    throw new Error("ZEUS SYNC: shopDomain or productId missing")
  }

  /*
  ========================================
  TEST MODE
  ========================================
  */

  if (!accessToken || accessToken === "TEST") {

    console.log("ZEUS TEST MODE — Shopify sync skipped")

    return {
      status: "test-mode",
      shopDomain,
      productId,
      preview: {
        title,
        description,
        tags,
        productType
      }
    }

  }

  /*
  ========================================
  NORMALIZE product_type
  Shopify requires STRING
  ========================================
  */

  let normalizedType = "general"

  if (typeof productType === "string") {
    normalizedType = productType
  }

  if (typeof productType === "object" && productType !== null) {

    if (productType.regionalCategory)
      normalizedType = productType.regionalCategory

    else if (productType.baseCategory)
      normalizedType = productType.baseCategory

    else if (productType.name)
      normalizedType = productType.name

  }

  /*
  ========================================
  SHOPIFY URL
  ========================================
  */

  const url =
    `https://${shopDomain}/admin/api/2024-01/products/${productId}.json`

  /*
  ========================================
  PAYLOAD
  ========================================
  */

  const payload = {

    product: {

      id: productId,

      title: title || "",

      body_html: description || "",

      tags: Array.isArray(tags)
        ? tags.join(", ")
        : "",

      product_type: normalizedType,

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

  /*
  ========================================
  REQUEST
  ========================================
  */

  try {

    console.log("ZEUS SHOPIFY SYNC START:", productId)

    console.log(
      "ZEUS SHOPIFY PAYLOAD:",
      JSON.stringify(payload, null, 2)
    )

    const response = await axios.put(
      url,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken
        }
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
