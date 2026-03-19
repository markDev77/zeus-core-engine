const { updateShopifyProduct } = require("./shopifySync");
const { checkBillingAccess } = require("./billingLimiter");

/*
========================================
LOOP PROTECTION (HARDENED)
========================================
*/
const loopProtection = require("./loopProtection");

const checkZeusProcessed = loopProtection.checkZeusProcessed;
const markZeusProcessed = loopProtection.markZeusProcessed;

/*
========================================
SYNC ENGINE
========================================
*/
async function syncProduct({
  platform,
  store,
  product
}) {

  /*
  ========================================
  VALIDACIONES BASE
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
  ROUTING POR PLATAFORMA
  ========================================
  */

  switch (platform) {

    /*
    ========================================
    SHOPIFY
    ========================================
    */
    case "shopify":

      /*
      ========================================
      BILLING GATE (CRÍTICO)
      ========================================
      */
      const billingCheck = checkBillingAccess(shopDomain);

      if (!billingCheck || billingCheck.allowed !== true) {
        console.log("ZEUS BILLING BLOCKED:", shopDomain);
        return;
      }

      /*
      ========================================
      LOOP PROTECTION (CRÍTICO)
      ========================================
      */
      if (typeof checkZeusProcessed === "function") {

        try {

          const alreadyProcessed = await checkZeusProcessed(
            shopDomain,
            accessToken,
            productId
          );

          if (alreadyProcessed) {
            console.log("ZEUS LOOP SKIPPED:", productId);
            return;
          }

        } catch (error) {
          console.error("LOOP CHECK ERROR:", error.message);
        }

      } else {
        console.error("LOOP PROTECTION NOT AVAILABLE (checkZeusProcessed)");
      }

      /*
      ========================================
      SYNC START
      ========================================
      */
      console.log("ZEUS SYNC START:", {
        shopDomain,
        productId
      });

      try {

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

      } catch (error) {

        console.error("ZEUS SHOPIFY UPDATE ERROR:", {
          productId,
          message: error.message
        });

        throw error;

      }

      /*
      ========================================
      MARK PROCESSED
      ========================================
      */
      if (typeof markZeusProcessed === "function") {

        try {

          await markZeusProcessed(
            shopDomain,
            accessToken,
            productId
          );

        } catch (error) {
          console.error("LOOP MARK ERROR:", error.message);
        }

      } else {
        console.error("LOOP PROTECTION NOT AVAILABLE (markZeusProcessed)");
      }

      /*
      ========================================
      SUCCESS
      ========================================
      */
      console.log("ZEUS SHOPIFY SYNC SUCCESS:", productId);

      break;

    /*
    ========================================
    DEFAULT
    ========================================
    */
    default:

      console.warn(
        "ZEUS SYNC ENGINE: unsupported platform",
        platform
      );

      break;

  }

}

/*
========================================
EXPORT
========================================
*/
module.exports = {
  syncProduct
};
