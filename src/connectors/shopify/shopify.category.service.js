async function applyShopifyCategory({
  shop,
  accessToken,
  productId,
  productCategory,
  apiVersion
}) {
  if (!productCategory) return;

  const url = `https://${shop}/admin/api/${apiVersion}/graphql.json`;

  const query = `
    mutation {
      productUpdate(input: {
        id: "gid://shopify/Product/${productId}",
        productCategory: {
          productTaxonomyNodeId: "${productCategory}"
        }
      }) {
        product {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken
    },
    body: JSON.stringify({ query })
  });

  const json = await res.json();

  console.log("🧩 CATEGORY GRAPHQL RESULT:", JSON.stringify(json, null, 2));

  return json;
}

module.exports = {
  applyShopifyCategory
};
