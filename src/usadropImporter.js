const fetch = require("node-fetch");

const DEFAULT_TIMEOUT_MS = Number(process.env.USADROP_TIMEOUT_MS || 30000);
const DEFAULT_PAGE_SIZE = Number(process.env.USADROP_PAGE_SIZE || 50);
const DEFAULT_IMPORT_URL = process.env.ZEUS_IMPORT_PRODUCT_URL || "http://localhost:10000/import/product";
const DEFAULT_USADROP_BASE_URL = (process.env.USADROP_BASE_URL || "").replace(/\/$/, "");

function buildUsadropHeaders(extraHeaders = {}) {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...extraHeaders
  };

  if (process.env.USADROP_API_KEY) {
    headers.apikey = process.env.USADROP_API_KEY;
    headers["x-api-key"] = process.env.USADROP_API_KEY;
  }

  if (process.env.USADROP_STORE_ID) {
    headers.storeId = process.env.USADROP_STORE_ID;
    headers["x-store-id"] = process.env.USADROP_STORE_ID;
  }

  if (process.env.USADROP_ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${process.env.USADROP_ACCESS_TOKEN}`;
  }

  return headers;
}

async function fetchJson(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    const text = await response.text();
    let data = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch (error) {
      throw new Error(`Invalid JSON response from ${url}`);
    }

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status} calling ${url}: ${JSON.stringify(data)}`
      );
    }

    return data;
  } finally {
    clearTimeout(timer);
  }
}

function pickFirst(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return null;
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [value];
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeImage(image) {
  if (!image) return null;

  if (typeof image === "string") {
    return {
      src: image,
      alt: null
    };
  }

  const src = pickFirst(
    image.src,
    image.url,
    image.image,
    image.imageUrl,
    image.image_url,
    image.original,
    image.originalUrl
  );

  if (!src) return null;

  return {
    src,
    alt: pickFirst(image.alt, image.name, image.title)
  };
}

function normalizeVariant(variant, fallbackProduct = {}) {
  if (!variant || typeof variant !== "object") {
    return null;
  }

  const sku = pickFirst(
    variant.sku,
    variant.variantSku,
    variant.productSku,
    variant.product_sku,
    variant.id,
    fallbackProduct.sku
  );

  return {
    sku: sku ? String(sku).trim() : null,
    title: pickFirst(
      variant.title,
      variant.name,
      variant.variantName,
      variant.variant_name,
      variant.spec,
      fallbackProduct.title
    ),
    price: toNumber(
      pickFirst(
        variant.price,
        variant.sellPrice,
        variant.sell_price,
        variant.salePrice,
        variant.sale_price,
        variant.costPrice,
        variant.cost_price,
        fallbackProduct.price
      ),
      0
    ),
    inventory: toNumber(
      pickFirst(
        variant.inventory,
        variant.stock,
        variant.stockQty,
        variant.stock_qty,
        variant.quantity,
        variant.qty,
        fallbackProduct.inventory
      ),
      0
    ),
    attributes: variant.attributes || variant.options || variant.specs || null,
    raw: variant
  };
}

function extractProductList(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  return (
    payload.products ||
    payload.productList ||
    payload.list ||
    payload.items ||
    payload.rows ||
    payload.data?.products ||
    payload.data?.productList ||
    payload.data?.list ||
    payload.data?.items ||
    payload.data?.rows ||
    payload.result?.products ||
    payload.result?.productList ||
    payload.result?.list ||
    []
  );
}

function normalizeUsadropProduct(rawProduct) {
  if (!rawProduct || typeof rawProduct !== "object") {
    return null;
  }

  const sku = pickFirst(
    rawProduct.sku,
    rawProduct.productSku,
    rawProduct.product_sku,
    rawProduct.id,
    rawProduct.productId,
    rawProduct.product_id
  );

  const title = pickFirst(
    rawProduct.title,
    rawProduct.productTitle,
    rawProduct.product_title,
    rawProduct.name,
    rawProduct.productName,
    rawProduct.product_name
  );

  const description = pickFirst(
    rawProduct.description,
    rawProduct.bodyHtml,
    rawProduct.body_html,
    rawProduct.htmlDescription,
    rawProduct.html_description,
    rawProduct.desc,
    rawProduct.productDescription,
    rawProduct.product_description,
    ""
  );

  const imageCandidates = [
    ...toArray(rawProduct.images),
    ...toArray(rawProduct.imageList),
    ...toArray(rawProduct.image_list),
    ...toArray(rawProduct.gallery),
    ...toArray(rawProduct.galleryImages),
    ...toArray(rawProduct.gallery_images),
    rawProduct.mainImage,
    rawProduct.main_image,
    rawProduct.image,
    rawProduct.imageUrl,
    rawProduct.image_url
  ]
    .map(normalizeImage)
    .filter(Boolean);

  const variantsSource =
    rawProduct.variants ||
    rawProduct.variantList ||
    rawProduct.variant_list ||
    rawProduct.skus ||
    rawProduct.skuList ||
    rawProduct.sku_list ||
    [];

  const variants = toArray(variantsSource)
    .map((variant) => normalizeVariant(variant, rawProduct))
    .filter(Boolean);

  return {
    source: "usadrop",
    supplier: "usadrop",
    vendor: "USAdrop",
    externalId: pickFirst(rawProduct.id, rawProduct.productId, rawProduct.product_id, sku),
    sku: sku ? String(sku).trim() : null,
    title: title ? String(title).trim() : "Untitled Product",
    description: String(description || "").trim(),
    price: toNumber(
      pickFirst(
        rawProduct.price,
        rawProduct.sellPrice,
        rawProduct.sell_price,
        rawProduct.salePrice,
        rawProduct.sale_price,
        rawProduct.costPrice,
        rawProduct.cost_price
      ),
      0
    ),
    inventory: toNumber(
      pickFirst(
        rawProduct.inventory,
        rawProduct.stock,
        rawProduct.stockQty,
        rawProduct.stock_qty,
        rawProduct.quantity,
        rawProduct.qty
      ),
      0
    ),
    images: imageCandidates,
    variants,
    raw: rawProduct
  };
}

async function fetchUsadropProducts(options = {}) {
  const {
    endpoint = process.env.USADROP_PRODUCTS_ENDPOINT || "/products",
    method = process.env.USADROP_PRODUCTS_METHOD || "GET",
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    body = null,
    query = {}
  } = options;

  if (!DEFAULT_USADROP_BASE_URL) {
    throw new Error("USADROP_BASE_URL is required");
  }

  const url = new URL(`${DEFAULT_USADROP_BASE_URL}${endpoint}`);
  url.searchParams.set("page", String(page));
  url.searchParams.set("pageSize", String(pageSize));

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const requestOptions = {
    method: method.toUpperCase(),
    headers: buildUsadropHeaders()
  };

  if (requestOptions.method !== "GET" && body) {
    requestOptions.body = JSON.stringify(body);
  }

  const response = await fetchJson(url.toString(), requestOptions);
  const rawProducts = extractProductList(response);
  const normalizedProducts = rawProducts
    .map(normalizeUsadropProduct)
    .filter(Boolean);

  return {
    page,
    pageSize,
    count: normalizedProducts.length,
    raw: response,
    products: normalizedProducts
  };
}

async function sendProductToImportPipeline(product, options = {}) {
  const targetUrl = options.importUrl || DEFAULT_IMPORT_URL;

  const response = await fetchJson(
    targetUrl,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(product)
    },
    Number(options.timeoutMs || DEFAULT_TIMEOUT_MS)
  );

  return response;
}

async function importUsadropProducts(options = {}) {
  const fetched = await fetchUsadropProducts(options);
  const results = [];

  for (const product of fetched.products) {
    try {
      const pipelineResult = await sendProductToImportPipeline(product, options);

      results.push({
        ok: true,
        sku: product.sku,
        title: product.title,
        pipelineResult
      });
    } catch (error) {
      results.push({
        ok: false,
        sku: product.sku,
        title: product.title,
        error: error.message
      });
    }
  }

  return {
    ok: true,
    fetched: fetched.count,
    processed: results.filter((item) => item.ok).length,
    failed: results.filter((item) => !item.ok).length,
    results
  };
}

module.exports = {
  buildUsadropHeaders,
  fetchUsadropProducts,
  normalizeUsadropProduct,
  sendProductToImportPipeline,
  importUsadropProducts
};
