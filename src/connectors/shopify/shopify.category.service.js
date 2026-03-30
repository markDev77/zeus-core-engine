async function applyShopifyCategory({
  shop,
  accessToken,
  productId,
  productCategory,
  apiVersion
}) {
  try {
    console.log("⚠️ CATEGORY SKIPPED (unsupported Shopify API)", {
      shop,
      productId,
      productCategory
    });

    return null;

  } catch (e) {
    console.log("⚠️ CATEGORY ERROR IGNORED", e.message);
    return null;
  }
}

module.exports = {
  applyShopifyCategory
};
