/*
========================================
ZEUS SYNC ENGINE
========================================
Motor de sincronización de productos
según plataforma destino
========================================
*/

const { updateShopifyProduct } = require("./shopifySync")

async function syncProduct({
  platform,
  store,
  product
}) {

  if (!platform) {
    throw new Error("SYNC ENGINE: platform missing")
  }

  if (!store) {
    throw new Error("SYNC ENGINE: store missing")
  }

  if (!product) {
    throw new Error("SYNC ENGINE: product missing")
  }

  const {
    shopDomain,
    accessToken,
    productId
  } = store

  if (!shopDomain) {
    throw new Error("SYNC ENGINE: shopDomain missing")
  }

  if (!accessToken) {
    throw new Error("SYNC ENGINE: accessToken missing")
  }

  if (!productId) {
    throw new Error("SYNC ENGINE: productId missing")
  }

  /*
  ========================================
  PLATFORM ROUTING
  ========================================
  */

  switch (platform) {

    case "shopify":

      console.log("ZEUS SHOPIFY SYNC START:", productId)

      await updateShopifyProduct({

        shopDomain,
        accessToken,
        productId,

        title: product.title,
        description: product.description,

        tags: product.tags,

        /*
        IMPORTANT:
        Shopify product_type debe ser STRING
        */
        productType: product.regionalCategory || product.category || "general"

      })

      console.log("ZEUS SHOPIFY SYNC COMPLETE:", productId)

      break

    default:

      console.warn(
        "ZEUS SYNC ENGINE: unsupported platform",
        platform
      )

      break

  }

}

module.exports = {
  syncProduct
}
