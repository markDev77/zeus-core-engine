// src/infra/worker/zeus-worker.js

const { Pool } = require("pg");
const { processProduct } = require("../../pipeline/processProduct");
const { writeWooProduct } = require("../../connectors/woo/woo.connector");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// CONFIG
const WORKER_INTERVAL = 3000;
const MAX_JOBS_PER_CYCLE = 2;

// ==========================
// FETCH JOBS
// ==========================
async function fetchQueuedJobs() {
  const res = await pool.query(
    `
    SELECT *
    FROM zeus_jobs
    WHERE status = 'queued'
    ORDER BY created_at ASC
    LIMIT $1
    `,
    [MAX_JOBS_PER_CYCLE]
  );

  return res.rows;
}

// ==========================
// STATE MANAGEMENT
// ==========================
async function markProcessing(id) {
  await pool.query(
    `
    UPDATE zeus_jobs
    SET status = 'processing'
    WHERE id = $1
    `,
    [id]
  );
}

async function markDone(id) {
  await pool.query(
    `
    UPDATE zeus_jobs
    SET status = 'done'
    WHERE id = $1
    `,
    [id]
  );
}

async function markFailed(id, error) {
  await pool.query(
    `
    UPDATE zeus_jobs
    SET status = 'failed'
    WHERE id = $1
    `,
    [id]
  );

  console.error("❌ JOB FAILED", { id, error: error.message });
}

// ==========================
// PROCESSOR (PIPELINE + WRITE)
// ==========================
async function processJob(job) {
  const { id, shop, payload } = job;

  console.log("⚙️ WORKER PROCESSING", { id, shop });

  try {
    await markProcessing(id);

    if (!payload) {
      throw new Error("Missing payload in job");
    }

    const result = await processProduct({
      source: payload.source,
      product: payload.product,
      store: payload.store,
      policyContext: payload.policyContext
    });

    console.log("🧠 ZEUS RESULT", {
      jobId: id,
      title: result.title,
      tags: result.tags?.length || 0
    });

    // 🔥 WRITE (SIMULADO)
    const writeResult = await writeWooProduct({
      store: payload.store,
      product: payload.product,
      zeusResult: result
    });

    console.log("🛒 WOO WRITE RESULT", {
      jobId: id,
      success: writeResult.success
    });

    await markDone(id);

    console.log("✅ WORKER DONE", { id });

  } catch (err) {
    await markFailed(id, err);
  }
}

// ==========================
// WORKER LOOP
// ==========================
async function runWorkerCycle() {
  try {
    const jobs = await fetchQueuedJobs();

    if (!jobs.length) return;

    console.log(`⚙️ WORKER FOUND ${jobs.length} jobs`);

    for (const job of jobs) {
      await processJob(job);
    }

  } catch (err) {
    console.error("❌ WORKER LOOP ERROR", err.message);
  }
}

// LOOP
setInterval(runWorkerCycle, WORKER_INTERVAL);

console.log("🚀 ZEUS WORKER STARTED (PIPELINE + WRITE MODE)");
