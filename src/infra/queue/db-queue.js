const { pool } = require("../../server"); // usa tu pool real

async function enqueueJobDB({ shop, productId }) {
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
}

module.exports = { enqueueJobDB };
