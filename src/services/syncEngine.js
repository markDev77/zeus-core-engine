/*
========================================
ZEUS SYNC ENGINE
========================================
Motor de sincronización de productos
según plataforma destino
========================================
*/

const { updateShopifyProduct } = require("./shopifySync");
const { checkBillingAccess } = require("./billingLimiter");

/*
LOOP PROTECTION (HARDENED)
*/
const loopProtection = require("./loopProtection");

const checkZeusProcessed = loopProtection.checkZeusProcessed;
const markZeusProcessed = loopProtection.markZeusProcessed;

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

      /*
      ========================================
      BILLING CHECK
      ========================================
      */

      const billingCheck = checkBillingAccess(shopDomain);

      if (!billingCheck.allowed) {
        console.log("ZEUS ACCESS BLOCKED BEFORE SYNC", shopDomain);
        return;
      }

      /*
      ========================================
      LOOP PROTECTION (SAFE MODE)
      ========================================
      */

      if (typeof checkZeusProcessed === "function") {

        const alreadyProcessed = await checkZeusProcessed(
          shopDomain,
          accessToken,
          productId
        );

        if (alreadyProcessed) {
          console.log("LOOP SKIPPED", productId);
          return;
        }

      } else {
        console.error("LOOP PROTECTION NOT AVAILABLE (checkZeusProcessed)");
      }

      /*
      ========================================
      SYNC START
      ========================================
      */

      console.log("SYNC START", productId);

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
          product.baseCategory ||
          product.category ||
          "general",

        baseCategory:
          product.baseCategory ||
          product.category ||
          "general",

        categorySearch:
          product.platformCategoryPath ||
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

      /*
      ========================================
      MARK AS PROCESSED (SAFE MODE)
      ========================================
      */

      if (typeof markZeusProcessed === "function") {

        await markZeusProcessed(
          shopDomain,
          accessToken,
          productId
        );

      } else {
        console.error("LOOP PROTECTION NOT AVAILABLE (markZeusProcessed)");
      }

      /*
      ========================================
      SUCCESS LOG
      ========================================
      */

      console.log("SHOPIFY UPDATE SUCCESS", productId);

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
