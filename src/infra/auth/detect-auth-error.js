"use strict";

function detectAuthError(err) {
  const status =
    err?.response?.status ||
    err?.status ||
    err?.statusCode ||
    null;

  const rawData = err?.response?.data || err?.data || null;

  const parts = [
    err?.message,
    err?.code,
    typeof rawData === "string" ? rawData : null,
    rawData?.error,
    rawData?.errors,
    rawData?.message
  ]
    .filter(Boolean)
    .map(String);

  const haystack = parts.join(" | ").toLowerCase();

  const invalidToken =
    haystack.includes("invalid api key or access token") ||
    haystack.includes("access token is invalid") ||
    haystack.includes("invalid access token") ||
    haystack.includes("token invalid");

  const revoked =
    haystack.includes("revoked") ||
    haystack.includes("app revoked") ||
    haystack.includes("token revoked");

  const unauthorized =
    status === 401 ||
    haystack.includes("unauthorized");

  const forbiddenAuth =
    status === 403 &&
    (
      invalidToken ||
      revoked ||
      haystack.includes("forbidden")
    );

  const isAuthError = Boolean(
    unauthorized || invalidToken || revoked || forbiddenAuth
  );

  if (!isAuthError) {
    return {
      isAuthError: false,
      code: null,
      reason: null,
      status,
      message: haystack || null
    };
  }

  if (status === 401) {
    return {
      isAuthError: true,
      code: "SHOPIFY_401",
      reason: "HTTP 401 Unauthorized from Shopify",
      status,
      message: haystack || null
    };
  }

  if (revoked) {
    return {
      isAuthError: true,
      code: "SHOPIFY_APP_REVOKED",
      reason: "Shopify app/token revoked",
      status,
      message: haystack || null
    };
  }

  if (invalidToken) {
    return {
      isAuthError: true,
      code: "SHOPIFY_INVALID_TOKEN",
      reason: "Shopify access token invalid",
      status,
      message: haystack || null
    };
  }

  return {
    isAuthError: true,
    code: "SHOPIFY_AUTH_ERROR",
    reason: "Generic Shopify auth error",
    status,
    message: haystack || null
  };
}

module.exports = {
  detectAuthError
};
