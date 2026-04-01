const axios = require("axios");

class RetryableShopifyError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "RetryableShopifyError";
    this.status = options.status || 500;
    this.retryAfterMs = options.retryAfterMs || null;
    this.responseData = options.responseData || null;
  }
}

class NonRetryableShopifyError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "NonRetryableShopifyError";
    this.status = options.status || 400;
    this.responseData = options.responseData || null;
  }
}

function computeBackoffMs(attempt, base = 1200, max = 15000) {
  const jitter = Math.floor(Math.random() * 250);
  const value = Math.min(max, base * Math.pow(2, attempt - 1) + jitter);
  return value;
}

function parseRetryAfterMs(headers = {}) {
  const value = headers["retry-after"];
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  return null;
}

class ShopifyClient {
  constructor({
    limiter,
    timeoutMs = 30000,
    maxRetries = 4,
    baseBackoffMs = 1200,
    maxBackoffMs = 15000
  }) {
    this.limiter = limiter;
    this.timeoutMs = timeoutMs;
    this.maxRetries = maxRetries;
    this.baseBackoffMs = baseBackoffMs;
    this.maxBackoffMs = maxBackoffMs;
  }

  async graphql({ shop, accessToken, query, variables = {}, estimatedCost = 50 }) {
    let attempt = 0;

    while (attempt < this.maxRetries) {
      attempt += 1;

      await this.limiter.waitForBudget(shop, estimatedCost);

      try {
        const response = await axios.post(
          `https://${shop}/admin/api/2026-01/graphql.json`,
          { query, variables },
          {
            timeout: this.timeoutMs,
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Access-Token": accessToken
            }
          }
        );

        const throttleStatus = response.data?.extensions?.cost?.throttleStatus;
        if (throttleStatus) {
          this.limiter.updateFromGraphQLThrottle(shop, throttleStatus);
        }

        if (response.data?.errors?.length) {
          throw new NonRetryableShopifyError("GraphQL errors", {
            status: 400,
            responseData: response.data
          });
        }

        return response.data;
      } catch (err) {
        const status = err.response?.status || 500;
        const retryAfterMs =
          parseRetryAfterMs(err.response?.headers) ||
          computeBackoffMs(attempt, this.baseBackoffMs, this.maxBackoffMs);

        if (status === 429 || status >= 500) {
          this.limiter.penalize(shop);

          if (attempt >= this.maxRetries) {
            throw new RetryableShopifyError(`Shopify temporary failure: ${status}`, {
              status,
              retryAfterMs,
              responseData: err.response?.data
            });
          }

          await new Promise((resolve) => setTimeout(resolve, retryAfterMs));
          continue;
        }

        throw new NonRetryableShopifyError(`Shopify non-retryable error: ${status}`, {
          status,
          responseData: err.response?.data
        });
      }
    }

    throw new RetryableShopifyError("Shopify max retries exceeded");
  }
}

module.exports = {
  ShopifyClient,
  RetryableShopifyError,
  NonRetryableShopifyError,
  computeBackoffMs
};
