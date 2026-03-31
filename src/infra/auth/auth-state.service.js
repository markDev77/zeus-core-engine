"use strict";

const logger = require("../logging/zeus-logger");
const { Pool } = require("pg");

// ==========================
// DB CONNECTION (LOCAL POOL)
// ==========================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const DEFAULT_RETRY_MINUTES = Number(process.env.ZEUS_AUTH_RETRY_MINUTES || 15);

// ==========================
// HELPERS
// ==========================
function normalizeBoolean(value) {
  return value === true || value === "t" || value === 1 || value === "1";
}

// ==========================
// GET STATE
// ==========================
async function getStoreAuthState(shop) {
  const query = `
    SELECT
      shop,
      status,
      auth_error,
      auth_error_code,
      auth_error_count,
      auth_retry_after
    FROM stores
    WHERE shop = $1
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [shop]);
  return rows[0] || null;
}

// ==========================
// CAN PROCESS (QUEUE GATE)
// ==========================
async function canProcessStore(shop) {
  const state = await getStoreAuthState(shop);

  if (!state) {
    logger.warning("STORE_NOT_FOUND", { shop });
    return { allowed: false, reason: "store_not_found", state: null };
  }

  if (String(state.status || "").toLowerCase() !== "active") {
    logger.warning("STORE_INACTIVE", { shop, status: state.status });
    return { allowed: false, reason: "store_inactive", state };
  }

  const hasAuthError = normalizeBoolean(state.auth_error);

  if (hasAuthError && state.auth_retry_after) {
    const retryAfterMs = new Date(state.auth_retry_after).getTime();

    if (Number.isFinite(retryAfterMs) && Date.now() < retryAfterMs) {
      logger.warning("STORE_BLOCKED_BY_AUTH_RETRY", {
        shop,
        retry_after: state.auth_retry_after,
        auth_error_code: state.auth_error_code,
        auth_error_count: state.auth_error_count
      });

      return {
        allowed: false,
        reason: "auth_retry_window_active",
        state
      };
    }
  }

  return { allowed: true, reason: null, state };
}

// ==========================
// MARK AUTH ERROR
// ==========================
async function markStoreAuthError({
  shop,
  code,
  message,
  source,
  retryAfterMinutes = DEFAULT_RETRY_MINUTES,
  context = {}
}) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const currentQuery = `
      SELECT
        shop,
        auth_error,
        auth_error_code,
        auth_error_count,
        auth_retry_after
      FROM stores
      WHERE shop = $1
      FOR UPDATE
    `;

    const currentRes = await client.query(currentQuery, [shop]);
    const state = currentRes.rows[0];

    if (!state) {
      await client.query("ROLLBACK");
      logger.warning("STORE_AUTH_ERROR_STORE_NOT_FOUND", { shop, code, source });
      return {
        ok: false,
        shouldNotify: false,
        reason: "store_not_found"
      };
    }

    const now = Date.now();
    const hasAuthError = normalizeBoolean(state.auth_error);
    const currentRetryAfterMs = state.auth_retry_after
      ? new Date(state.auth_retry_after).getTime()
      : null;

    const retryWindowActive =
      hasAuthError &&
      Number.isFinite(currentRetryAfterMs) &&
      now < currentRetryAfterMs;

    const nextCount = Number(state.auth_error_count || 0) + 1;

    const updateQuery = `
      UPDATE stores
      SET
        auth_error = TRUE,
        auth_error_code = $2,
        auth_error_count = $3,
        auth_retry_after = NOW() + ($4 || ' minutes')::interval
      WHERE shop = $1
      RETURNING
        shop,
        auth_error,
        auth_error_code,
        auth_error_count,
        auth_retry_after
    `;

    const updateRes = await client.query(updateQuery, [
      shop,
      code || "SHOPIFY_AUTH_ERROR",
      nextCount,
      String(retryAfterMinutes)
    ]);

    await client.query("COMMIT");

    const updated = updateRes.rows[0];

    logger.error("STORE_AUTH_ERROR_MARKED", {
      shop,
      code: code || "SHOPIFY_AUTH_ERROR",
      message,
      source,
      retry_after: updated?.auth_retry_after || null,
      auth_error_count: updated?.auth_error_count || nextCount,
      should_notify: !retryWindowActive,
      context
    });

    return {
      ok: true,
      shouldNotify: !retryWindowActive,
      state: updated
    };
  } catch (err) {
    await client.query("ROLLBACK");

    logger.error("STORE_AUTH_ERROR_FAILED", {
      shop,
      code,
      source,
      error: err.message
    });

    return {
      ok: false,
      shouldNotify: false,
      error: err.message
    };
  } finally {
    client.release();
  }
}

// ==========================
// MARK AUTH HEALTHY
// ==========================
async function markStoreAuthHealthy(shop, context = {}) {
  try {
    const query = `
      UPDATE stores
      SET
        auth_error = FALSE,
        auth_error_code = NULL,
        auth_retry_after = NULL
      WHERE shop = $1
      RETURNING shop
    `;

    const result = await pool.query(query, [shop]);

    if (result.rowCount > 0) {
      logger.info("STORE_AUTH_HEALTHY", { shop, context });
    }

    return { ok: true, changed: result.rowCount > 0 };
  } catch (err) {
    logger.error("STORE_AUTH_HEALTHY_FAILED", {
      shop,
      error: err.message,
      context
    });

    return { ok: false, error: err.message };
  }
}

module.exports = {
  getStoreAuthState,
  canProcessStore,
  markStoreAuthError,
  markStoreAuthHealthy
};
