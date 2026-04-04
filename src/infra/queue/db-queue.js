// src/infra/queue/db-queue.js

const { Pool } = require("pg");

// 🔥 pool independiente (NO depende de server)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function enqueueJobDB({ shop, productId, payload }) {
  try {
    if (!shop) {
      throw new Error("enqueueJobDB: shop requerido");
    }

    // 🔥 NUEVO ZEUS: soporta payload completo
    let finalPayload = null;

    if (payload) {
      finalPayload = payload;
    } else if (productId) {
      // 🔒 compatibilidad legacy (Shopify)
      finalPayload = { productId };
    } else {
      throw new Error("enqueueJobDB: payload o productId requerido");
    }

    await pool.query(
      `
      INSERT INTO zeus_jobs (
        job_type,
        shop,
        payload,
        status
      )
      VALUES ($1, $2, $3::jsonb, 'queued')
      `,
      [
        "product_create",
        shop,
        JSON.stringify(finalPayload)
      ]
    );

    console.log("📦 DB QUEUE INSERT OK", {
      shop,
      hasPayload: !!payload,
      productId: productId || null
    });

  } catch (err) {
    console.error("❌ DB QUEUE INSERT ERROR:", err.message);
  }
}

module.exports = { enqueueJobDB };
