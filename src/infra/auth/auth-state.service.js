const logger = require("../logging/zeus-logger");
const { Pool } = require("pg");

// ==========================
// DB CONNECTION (LOCAL POOL)
// ==========================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

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

  // negocio
  if (state.status !== "active") {
    logger.warning("STORE_INACTIVE", { shop });
    return { allowed: false, reason: "store_inactive", state };
  }

  // bloqueo por auth
  if (state.auth_error && state.auth_retry_after) {
    const retryAfter = new Date(state.auth_retry_after).getTime();

    if (Date.now() < retryAfter) {
      logger.warning("STORE_BLOCKED_BY_AUTH_RETRY", {
        shop,
        retry_after: state.auth_retry_after
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
  retryAfterMinutes = 15,
  context = {}
}) {
  try {
    const query = `
      UPDATE stores
      SET
        auth_error = TRUE,
        auth_error_code = $2,
        auth_error_at = NOW(),
        auth_error_count = COALESCE(auth_error_count, 0) + 1,
        auth_retry_after = NOW() + ($3 || ' minutes')::interval
      WHERE shop = $1
    `;

    await pool.query(query, [
      shop,
      code || "AUTH_ERROR",
      String(retryAfterMinutes)
    ]);

    logger.error("STORE_AUTH_ERROR_MARKED", {
      shop,
      code,
      message,
      source,
      context
    });

  } catch (err) {
    logger.error("STORE_AUTH_ERROR_FAILED", {
      shop,
      error: err.message
    });
  }
}

// ==========================
// MARK AUTH HEALTHY
// ==========================
async function markStoreAuthHealthy(shop) {
  try {
    const query = `
      UPDATE stores
      SET
        auth_error = FALSE,
        auth_error_code = NULL,
        auth_error_at = NULL,
        auth_retry_after = NULL,
        auth_last_ok_at = NOW()
      WHERE shop = $1
    `;

    await pool.query(query, [shop]);

    logger.info("STORE_AUTH_HEALTHY", { shop });

  } catch (err) {
    logger.error("STORE_AUTH_HEALTHY_FAILED", {
      shop,
      error: err.message
    });
  }
}

// ==========================
// EXPORTS
// ==========================
module.exports = {
  getStoreAuthState,
  canProcessStore,
  markStoreAuthError,
  markStoreAuthHealthy
};
