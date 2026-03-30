async function applyShopifyCategory({
  shop,
  accessToken,
  productId,
  productCategory,
  apiVersion
}) {
  // 🔴 TEMPORALMENTE DESACTIVADO (Shopify no acepta productCategory)
  console.log("⚠️ CATEGORY SKIPPED (unsupported by Shopify API)", {
    shop,
    productId,
    productCategory
  });

  return null;
}

module.exports = {
  applyShopifyCategory
};
