const { getRegionProfile, normalizeCountry } = require("../data/regionProfiles");
const { getStoreById, getStoreByApiCredentials, getStore } = require("./storeRegistry");

function normalizeMarketplace(value, fallback = "shopify") {
  if (!value || typeof value !== "string") {
    return fallback;
  }

  return value.trim().toLowerCase();
}

function cleanString(value, fallback = "") {
  if (!value || typeof value !== "string") {
    return fallback;
  }

  return value.trim();
}

function extractHeaders(headers = {}) {
  return {
    storeId:
      headers["x-zeus-store-id"] ||
      headers["storeid"] ||
      headers["x-store-id"] ||
      null,

    apiKey:
      headers["x-zeus-api-key"] ||
      headers["apikey"] ||
      headers["x-api-key"] ||
      null,

    shopDomain:
      headers["x-shopify-shop-domain"] ||
      headers["x-shop-domain"] ||
      null
  };
}

function mergeProfile(baseProfile, overrideProfile = {}) {
  return {
    ...baseProfile,
    ...(overrideProfile.country
      ? { country: normalizeCountry(overrideProfile.country) }
      : {}),
    ...(overrideProfile.language
      ? { language: cleanString(overrideProfile.language, baseProfile.language) }
      : {}),
    ...(overrideProfile.currency
      ? { currency: cleanString(overrideProfile.currency, baseProfile.currency) }
      : {}),
    ...(overrideProfile.marketplace
      ? { marketplace: normalizeMarketplace(overrideProfile.marketplace, baseProfile.marketplace) }
      : {}),
    ...(overrideProfile.catalogOrigin
      ? { catalogOrigin: cleanString(overrideProfile.catalogOrigin, baseProfile.catalogOrigin) }
      : {}),
    ...(overrideProfile.translationMode
      ? { translationMode: cleanString(overrideProfile.translationMode, baseProfile.translationMode) }
      : {}),
    ...(overrideProfile.marketSignalMode
      ? { marketSignalMode: cleanString(overrideProfile.marketSignalMode, baseProfile.marketSignalMode) }
      : {}),
    ...(overrideProfile.seoLocale
      ? { seoLocale: cleanString(overrideProfile.seoLocale, baseProfile.seoLocale) }
      : {}),
    ...(overrideProfile.titleStyle
      ? { titleStyle: cleanString(overrideProfile.titleStyle, baseProfile.titleStyle) }
      : {}),
    ...(overrideProfile.descriptionStyle
      ? { descriptionStyle: cleanString(overrideProfile.descriptionStyle, baseProfile.descriptionStyle) }
      : {}),
    ...(overrideProfile.tagStyle
      ? { tagStyle: cleanString(overrideProfile.tagStyle, baseProfile.tagStyle) }
      : {}),
    ...(overrideProfile.categoryLocale
      ? { categoryLocale: cleanString(overrideProfile.categoryLocale, baseProfile.categoryLocale) }
      : {})
  };
}

function resolveRegisteredStore(context = {}) {
  const headers = extractHeaders(context.headers);
  const payload = context.payload || {};

  if (headers.storeId) {
    const storeById = getStoreById(headers.storeId);
    if (storeById) return storeById;
  }

  if (headers.apiKey) {
    const storeByApi = getStoreByApiCredentials(headers.storeId, headers.apiKey);
    if (storeByApi) return storeByApi;
  }

  if (headers.shopDomain) {
    const shopStore = getStore(headers.shopDomain);
    if (shopStore) return shopStore;
  }

  if (payload.storeId) {
    const storeByPayload = getStoreById(payload.storeId);
    if (storeByPayload) return storeByPayload;
  }

  return null;
}

function resolveStoreProfile(context = {}) {

  const payload = context.payload || {};
  const headers = extractHeaders(context.headers);
  const registeredStore = resolveRegisteredStore(context);

  const requestedCountry =
    (registeredStore && registeredStore.profile && registeredStore.profile.country) ||
    payload.country ||
    (payload.storeProfile && payload.storeProfile.country) ||
    "DEFAULT";

  const baseProfile = getRegionProfile(requestedCountry);

  const registeredProfile =
    registeredStore && registeredStore.profile
      ? registeredStore.profile
      : {};

  const payloadProfile =
    payload.storeProfile && typeof payload.storeProfile === "object"
      ? payload.storeProfile
      : {};

  const finalProfile = mergeProfile(
    mergeProfile(baseProfile, registeredProfile),
    mergeProfile(payloadProfile, payload)
  );

  let storeContext;

  if (registeredStore) {

    storeContext = {
      storeId: registeredStore.storeId || null,
      clientId: registeredStore.clientId || null,
      platform: registeredStore.platform || payload.platform || null,
      shop: registeredStore.shop || registeredStore.storeDomain || null,
      storeDomain: registeredStore.storeDomain || registeredStore.shop || null,
      accessToken: registeredStore.accessToken || null,
      productId: payload.store?.productId || null,
      source: "registry"
    };

  } else {

    const payloadStore = payload.store || {};

    storeContext = {
      storeId: headers.storeId || payload.storeId || null,
      clientId: payload.clientId || null,
      platform: payload.platform || null,
      shop: payloadStore.shopDomain || headers.shopDomain || null,
      storeDomain: payloadStore.shopDomain || headers.shopDomain || null,
      accessToken: payloadStore.accessToken || null,
      productId: payloadStore.productId || null,
      source: "request"
    };

  }

  return {
    store: storeContext,
    profile: finalProfile,
    resolution: {
      source: registeredStore ? "registry" : "fallback",
      matchedBy: registeredStore
        ? "registry"
        : "payload",
      hasApiKey: Boolean(headers.apiKey),
      hasStoreId: Boolean(headers.storeId),
      hasShopDomain: Boolean(headers.shopDomain)
    }
  };

}

module.exports = {
  resolveStoreProfile
};
