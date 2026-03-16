/*
========================================
ZEUS SHOPIFY SYNC
========================================
Servicio único de sincronización
de productos Shopify desde ZEUS
========================================
*/

const axios = require("axios");

const SHOPIFY_API_VERSION = "2024-04";
const SHOPIFY_GRAPHQL_VERSION = "2026-01";

const USD_TO_MXN = 20;
const FIXED_STOCK = 11;
const DEFAULT_WEIGHT_VALUE = 1;
const DEFAULT_WEIGHT_UNIT = "kg";
const USADROP_SKU_REGEX = /^PD\.\d+$/i;

function normalizeProductType(value) {
  if (!value) return "general";

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && value !== null) {
    if (typeof value.regionalCategory === "string" && value.regionalCategory.trim()) {
      return value.regionalCategory;
    }

    if (typeof value.baseCategory === "string" && value.baseCategory.trim()) {
      return value.baseCategory;
    }

    if (typeof value.category === "string" && value.category.trim()) {
      return value.category;
    }

    if (typeof value.name === "string" && value.name.trim()) {
      return value.name;
    }
  }

  return "general";
}

function detectUsadropSource({ source, variants = [] }) {
  const normalizedSource = String(source || "").toLowerCase();

  if (normalizedSource === "usadrop") {
    return true;
  }

  if (Array.isArray(variants)) {
    return variants.some((variant) => {
      const sku = String(variant?.sku || "").trim();
      return USADROP_SKU_REGEX.test(sku);
    });
  }

  return false;
}

function calculatePrice(usdRaw) {
  const usd = Number(usdRaw);
  let adjustedUsd = Number.isFinite(usd) ? usd : 0;

  if (adjustedUsd <= 8) adjustedUsd *= 2.1;
  else if (adjustedUsd <= 20) adjustedUsd *= 1.9;
  else if (adjustedUsd <= 40) adjustedUsd *= 1.75;
  else if (adjustedUsd <= 80) adjustedUsd *= 1.65;
  else adjustedUsd *= 1.55;

  let mxn = adjustedUsd * USD_TO_MXN;
  mxn += 350;
  mxn *= 1.16;

  mxn = Math.ceil(mxn / 10) * 10 - 1;

  if ((mxn >= 300 && mxn <= 600) || (mxn >= 700 && mxn <= 740)) {
    mxn = 699;
  }

  return Math.max(599, mxn);
}

function extractFirstImageFromHtml(html = "") {
  const match = String(html || "").match(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/i);
  return match?.[1] || null;
}

async function shopifyGraphQL(shopDomain, accessToken, query, variables = {}) {
  const url = `https://${shopDomain}/admin/api/${SHOPIFY_GRAPHQL_VERSION}/graphql.json`;

  const response = await axios.post(
    url,
    {
      query,
      variables
    },
    {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json"
      },
      timeout: 15000
    }
  );

  if (response.data?.errors?.length) {
    throw new Error(JSON.stringify(response.data.errors));
  }

  return response.data?.data || {};
}

async function getShopifyProduct(shopDomain, accessToken, productId) {
  const url = `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/products/${productId}.json`;

  const response = await axios.get(url, {
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json"
    },
    timeout: 15000
  });

  return response.data?.product || null;
}

async function getShopifyLocationId(shopDomain, accessToken) {
  const url = `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/locations.json`;

  const response = await axios.get(url, {
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json"
    },
    timeout: 15000
  });

  return response.data?.locations?.[0]?.id || null;
}

async function attachFallbackMainImage({
  shopDomain,
  accessToken,
  productId
}) {
  const currentProduct = await getShopifyProduct(
    shopDomain,
    accessToken,
    productId
  );

  if (!currentProduct) {
    return;
  }

  if (Array.isArray(currentProduct.images) && currentProduct.images.length > 0) {
    return;
  }

  const fallbackSrc = extractFirstImageFromHtml(
    currentProduct.body_html || ""
  );

  if (!fallbackSrc) {
    return;
  }

  const url = `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/products/${productId}/images.json`;

  await axios.post(
    url,
    {
      image: {
        src: fallbackSrc
      }
    },
    {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json"
      },
      timeout: 15000
    }
  );
}

async function updateVariantUsadropPolicy({
  shopDomain,
  accessToken,
  variant
}) {
  const currentPrice = Number(variant?.price || 0);
  const priceToApply =
    currentPrice >= 599
      ? currentPrice
      : calculatePrice(currentPrice);

  const url = `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/variants/${variant.id}.json`;

  await axios.put(
    url,
    {
      variant: {
        id: variant.id,
        price: String(priceToApply),
        sku: variant.sku,
        weight: DEFAULT_WEIGHT_VALUE,
        weight_unit: DEFAULT_WEIGHT_UNIT
      }
    },
    {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json"
      },
      timeout: 15000
    }
  );
}

async function updateInventoryUsadropPolicy({
  shopDomain,
  accessToken,
  inventoryItemId,
  locationId
}) {
  const url = `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/inventory_levels/set.json`;

  await axios.post(
    url,
    {
      location_id: locationId,
      inventory_item_id: inventoryItemId,
      available: FIXED_STOCK
    },
    {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json"
      },
      timeout: 15000
    }
  );
}

async function applyUsadropVariantPolicy({
  shopDomain,
  accessToken,
  productId,
  source
}) {
  const currentProduct = await getShopifyProduct(
    shopDomain,
    accessToken,
    productId
  );

  if (!currentProduct) {
    return;
  }

  const variants = Array.isArray(currentProduct.variants)
    ? currentProduct.variants
    : [];

  const isUsadrop = detectUsadropSource({
    source,
    variants
  });

  if (!isUsadrop) {
    return;
  }

  const locationId = await getShopifyLocationId(
    shopDomain,
    accessToken
  );

  for (const variant of variants) {
    await updateVariantUsadropPolicy({
      shopDomain,
      accessToken,
      variant
    });

    if (locationId && variant?.inventory_item_id) {
      await updateInventoryUsadropPolicy({
        shopDomain,
        accessToken,
        inventoryItemId: variant.inventory_item_id,
        locationId
      });
    }
  }
}

async function searchShopifyTaxonomyCategory({
  shopDomain,
  accessToken,
  categorySearch
}) {
  const search = String(categorySearch || "").trim();

  if (!search) {
    return null;
  }

  const query = `
    query SearchTaxonomy($search: String!) {
      taxonomy {
        categories(first: 1, search: $search) {
          edges {
            node {
              id
              fullName
            }
          }
        }
      }
    }
  `;

  try {
    const data = await shopifyGraphQL(
      shopDomain,
      accessToken,
      query,
      { search }
    );

    return data?.taxonomy?.categories?.edges?.[0]?.node || null;
  } catch (error) {
    console.warn(
      "ZEUS TAXONOMY SEARCH WARNING:",
      error.message
    );
    return null;
  }
}

async function pushShopifyCategory({
  shopDomain,
  accessToken,
  productId,
  categorySearch
}) {
  const taxonomyCategory = await searchShopifyTaxonomyCategory({
    shopDomain,
    accessToken,
    categorySearch
  });

  if (!taxonomyCategory?.id) {
    return null;
  }

  const mutation = `
    mutation SetProductCategory($input: ProductSetInput!) {
      productSet(input: $input) {
        userErrors {
          field
          message
        }
      }
    }
  `;

  try {
    const data = await shopifyGraphQL(
      shopDomain,
      accessToken,
      mutation,
      {
        input: {
          id: \`gid://shopify/Product/\${productId}\`,
          category: taxonomyCategory.id
        }
      }
    );

    const userErrors = data?.productSet?.userErrors || [];

    if (userErrors.length) {
      console.warn(
        "ZEUS SHOPIFY CATEGORY WARNING:",
        JSON.stringify(userErrors)
      );
    }

    return taxonomyCategory;
  } catch (error) {
    console.warn(
      "ZEUS SHOPIFY CATEGORY WARNING:",
      error.message
    );
    return null;
  }
}

async function updateShopifyProduct({
  shopDomain,
  accessToken,
  productId,
  title,
  description,
  tags,
  productType,
  baseCategory,
  categorySearch,
  source,
  searchKeywords,
  seoTitle,
  seoDescription,
  productSignature
}) {
  if (!shopDomain || !productId) {
    throw new Error("Missing shopDomain or productId");
  }

  if (!accessToken) {
    throw new Error("Missing Shopify access token");
  }

  const url = `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/products/${productId}.json`;

  const normalizedProductType = normalizeProductType(productType);
  const dedupedTags = Array.from(
    new Set(
      [
        ...(Array.isArray(tags) ? tags : []),
        ...(Array.isArray(searchKeywords) ? searchKeywords : []),
        "ZEUS_OPTIMIZED",
        source ? `source_${String(source).toLowerCase()}` : "",
        productSignature ? `ZEUS_SIG_${productSignature}` : ""
      ]
        .map((tag) => String(tag || "").trim())
        .filter(Boolean)
    )
  );

  const payload = {
    product: {
      id: productId,
      title: title || "",
      body_html: description || "",
      tags: dedupedTags.join(", "),
      product_type: normalizedProductType,
      status: "active",
      metafields: [
        {
          namespace: "zeus",
          key: "optimized",
          type: "boolean",
          value: "true"
        },
        {
          namespace: "zeus",
          key: "origin",
          type: "single_line_text_field",
          value: String(source || "native")
        },
        {
          namespace: "zeus",
          key: "seo_title",
          type: "single_line_text_field",
          value: String(seoTitle || title || "").substring(0, 255)
        },
        {
          namespace: "zeus",
          key: "seo_description",
          type: "multi_line_text_field",
          value: String(seoDescription || "").substring(0, 5000)
        },
        {
          namespace: "zeus",
          key: "base_category",
          type: "single_line_text_field",
          value: String(baseCategory || "general")
        }
      ]
    }
  };

  try {
    console.log("ZEUS SHOPIFY SYNC START:", productId);
    console.log("ZEUS SHOPIFY PAYLOAD:", JSON.stringify(payload, null, 2));

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
    );

    await attachFallbackMainImage({
      shopDomain,
      accessToken,
      productId
    });

    await pushShopifyCategory({
      shopDomain,
      accessToken,
      productId,
      categorySearch:
        categorySearch ||
        baseCategory ||
        normalizedProductType
    });

    await applyUsadropVariantPolicy({
      shopDomain,
      accessToken,
      productId,
      source
    });

    console.log("ZEUS SHOPIFY SYNC COMPLETE:", productId);
    return response.data;
  } catch (error) {
    console.error(
      "SHOPIFY UPDATE ERROR:",
      error.response?.data || error.message
    );
    throw error;
  }
}

module.exports = {
  updateShopifyProduct
};
