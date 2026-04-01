const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 🔒 CONFIG SAFE
const WORKER_INTERVAL = 3000; // cada 3 seg
const MAX_JOBS_PER_CYCLE = 2; // ultra conservador

async function fetchQueuedJobs() {
  const res = await pool.query(`
    SELECT *
    FROM zeus_jobs
    WHERE status = 'queued'
    ORDER BY created_at ASC
    LIMIT $1
  `, [MAX_JOBS_PER_CYCLE]);

  return res.rows;
}

async function markProcessing(id) {
  await pool.query(`
    UPDATE zeus_jobs
    SET status = 'processing'
    WHERE id = $1
  `, [id]);
}

async function markDone(id) {
  await pool.query(`
    UPDATE zeus_jobs
    SET status = 'done'
    WHERE id = $1
  `, [id]);
}

async function processJob(job) {
  const { id, shop, payload } = job;

  console.log("🧠 WORKER PROCESSING", { id, shop, payload });

  try {
    await markProcessing(id);

    // 🔥 SAFE MODE:
    // NO ejecutamos lógica real todavía
    // solo simulamos procesamiento

    await new Promise(res => setTimeout(res, 500));

    await markDone(id);

    console.log("✅ WORKER DONE", { id });

  } catch (err) {
    console.error("❌ WORKER ERROR", err.message);
  }
}

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

// 🔁 LOOP
setInterval(runWorkerCycle, WORKER_INTERVAL);

console.log("🚀 ZEUS WORKER STARTED (SAFE MODE)");
