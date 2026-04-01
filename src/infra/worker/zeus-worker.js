const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 🔒 CONFIG SAFE
const WORKER_INTERVAL = 3000; // cada 3 seg
const MAX_JOBS_PER_CYCLE = 2; // ultra conservador

// ==========================
// FETCH JOBS (SAFE)
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

// ==========================
// SAFE PROCESSOR (NO BUSINESS LOGIC)
// ==========================
async function processJob(job) {
  const { id, shop, payload } = job;

  console.log("🧠 WORKER (SAFE) PROCESSING", { id, shop, payload });

  try {
    await markProcessing(id);

    // 🔒 SAFE MODE REAL
    // NO ejecutar:
    // - transformProductById
    // - generateAIContent
    // - shopifyRequest
    // - consumeToken

    // solo simulación controlada
    await new Promise((res) => setTimeout(res, 300));

    await markDone(id);

    console.log("✅ WORKER (SAFE) DONE", { id });

  } catch (err) {
    console.error("❌ WORKER ERROR", err.message);
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

// 🔁 LOOP (NO BLOQUEANTE)
setInterval(runWorkerCycle, WORKER_INTERVAL);

console.log("🚀 ZEUS WORKER STARTED (SAFE MODE)");
