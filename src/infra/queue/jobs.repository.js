const os = require("os");
const { pool } = require("../../db"); // ajusta al path real de tu pool

const WORKER_ID = `${os.hostname()}:${process.pid}`;

async function enqueueJob({
  jobType,
  shop,
  payload,
  priority = 100,
  maxAttempts = 4,
  dedupeKey = null,
  runAt = null
}) {
  const query = `
    INSERT INTO zeus_jobs (
      job_type, shop, payload, priority, max_attempts, dedupe_key, run_at, status
    )
    VALUES ($1, $2, $3::jsonb, $4, $5, $6, COALESCE($7, NOW()), 'queued')
    ON CONFLICT (dedupe_key) WHERE dedupe_key IS NOT NULL AND dedupe_key <> ''
    DO NOTHING
    RETURNING *;
  `;

  const values = [
    jobType,
    shop,
    JSON.stringify(payload || {}),
    priority,
    maxAttempts,
    dedupeKey,
    runAt
  ];

  const { rows } = await pool.query(query, values);
  return rows[0] || null;
}

async function claimAvailableJobs(limit = 20, leaseSeconds = 120) {
  const query = `
    WITH candidates AS (
      SELECT id
      FROM zeus_jobs
      WHERE status IN ('queued', 'retry')
        AND run_at <= NOW()
        AND (
          locked_at IS NULL
          OR locked_at < NOW() - ($2::text || ' seconds')::interval
        )
      ORDER BY priority ASC, created_at ASC
      LIMIT $1
      FOR UPDATE SKIP LOCKED
    )
    UPDATE zeus_jobs j
    SET
      status = 'processing',
      locked_by = $3,
      locked_at = NOW(),
      updated_at = NOW()
    FROM candidates c
    WHERE j.id = c.id
    RETURNING j.*;
  `;

  const { rows } = await pool.query(query, [limit, leaseSeconds, WORKER_ID]);
  return rows;
}

async function markDone(jobId) {
  await pool.query(
    `
    UPDATE zeus_jobs
    SET status = 'done',
        updated_at = NOW(),
        locked_at = NULL,
        locked_by = NULL
    WHERE id = $1
    `,
    [jobId]
  );
}

async function markFailed(jobId, errorMessage) {
  await pool.query(
    `
    UPDATE zeus_jobs
    SET status = 'failed',
        last_error = LEFT($2, 4000),
        updated_at = NOW(),
        locked_at = NULL,
        locked_by = NULL
    WHERE id = $1
    `,
    [jobId, String(errorMessage || "unknown error")]
  );
}

async function requeueWithDelay(jobId, delayMs, errorMessage) {
  await pool.query(
    `
    UPDATE zeus_jobs
    SET status = 'retry',
        attempts = attempts + 1,
        last_error = LEFT($3, 4000),
        run_at = NOW() + ($2::text || ' milliseconds')::interval,
        updated_at = NOW(),
        locked_at = NULL,
        locked_by = NULL
    WHERE id = $1
    `,
    [jobId, delayMs, String(errorMessage || "retry")]
  );
}

async function incrementAttemptsOnly(jobId) {
  await pool.query(
    `
    UPDATE zeus_jobs
    SET attempts = attempts + 1,
        updated_at = NOW()
    WHERE id = $1
    `,
    [jobId]
  );
}

async function getQueueStats() {
  const { rows } = await pool.query(`
    SELECT
      status,
      COUNT(*)::int AS count
    FROM zeus_jobs
    GROUP BY status
  `);
  return rows;
}

async function getOldestQueuedAgeSeconds() {
  const { rows } = await pool.query(`
    SELECT
      EXTRACT(EPOCH FROM (NOW() - MIN(created_at)))::int AS age_seconds
    FROM zeus_jobs
    WHERE status IN ('queued', 'retry')
  `);
  return rows[0]?.age_seconds || 0;
}

module.exports = {
  WORKER_ID,
  enqueueJob,
  claimAvailableJobs,
  markDone,
  markFailed,
  requeueWithDelay,
  incrementAttemptsOnly,
  getQueueStats,
  getOldestQueuedAgeSeconds
};
