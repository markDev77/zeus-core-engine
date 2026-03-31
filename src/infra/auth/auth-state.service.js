const logger = require("../logging/zeus-logger");

// AJUSTA ESTA RUTA a tu conexión real
const pool = require("../../db");

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

module.exports = {
  getStoreAuthState,
  canProcessStore
};
