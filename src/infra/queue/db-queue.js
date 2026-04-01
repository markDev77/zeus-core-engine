const { Pool } = require("pg");

// 🔥 pool independiente (NO depende de server)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function enqueueJobDB({ shop, productId }) {
  try {
    if (!shop) {
      throw new Error("enqueueJobDB: shop requerido");
    }

    if (!productId) {
      throw new Error("enqueueJobDB: productId requerido");
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
        JSON.stringify({ productId })
      ]
    );

  } catch (err) {
    console.error("❌ DB QUEUE INSERT ERROR:", err.message);
  }
}

module.exports = { enqueueJobDB };
