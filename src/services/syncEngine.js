/*
========================================
ZEUS SYNC ENGINE
========================================
Motor de sincronización de productos
según plataforma destino
========================================
*/

const { updateShopifyProduct } = require("./shopifySync");

async function syncProduct({
  platform,
  store,
  product
}) {

  /*
  ========================================
  VALIDACIONES
  ========================================
  */

  if (!platform) {
    throw new Error("SYNC ENGINE: platform missing");
  }

  if (!store) {
    throw new Error("SYNC ENGINE: store missing");
  }

  if (!product) {
    throw new Error("SYNC ENGINE: product missing");
  }

  const {
    shopDomain,
    accessToken,
    productId
  } = store;

  if (!shopDomain) {
    throw new Error("SYNC ENGINE: shopDomain missing");
  }

  if (!accessToken) {
    throw new Error("SYNC ENGINE: accessToken missing");
  }

  if (!productId) {
    throw new Error("SYNC ENGINE: productId missing");
  }

  /*
  ========================================
  PLATFORM ROUTING
  ========================================
  */

  switch (platform) {

    case "shopify":

      console.log("ZEUS SYNC ENGINE START", productId);

      await updateShopifyProduct({
        shopDomain,
        accessToken,
        productId,
        title: product.title,
        description:
          product.description ||
          product.body_html ||
          "",
        tags:
          product.tags ||
          [],
        productType:
          product.regionalCategory ||
          product.category ||
          "general",
        baseCategory:
          product.baseCategory ||
          product.category ||
          "general",
        categorySearch:
          product.regionalCategory?.shopifyTaxonomyQuery ||
          product.shopifyTaxonomyQuery ||
          product.baseCategory ||
          product.category ||
          "general",
        source:
          product.source ||
          product.origin ||
          "native",
        searchKeywords:
          product.searchKeywords ||
          [],
        seoTitle:
          product.seoTitle ||
          product.title ||
          "",
        seoDescription:
          product.seoDescription ||
          "",
        productSignature:
          product.productSignature ||
          ""
      });

      console.log("ZEUS SYNC ENGINE COMPLETE", productId);

      break;

    default:

      console.warn(
        "ZEUS SYNC ENGINE: unsupported platform",
        platform
      );

      break;

  }

}

module.exports = {
  syncProduct
};
