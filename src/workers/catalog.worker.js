require("dotenv").config();

const { WorkerLoop } = require("../infra/queue/worker.loop");
const { ShopifyRateLimiter } = require("../infra/shopify/shopify-rate-limiter");
const { ShopifyClient } = require("../infra/shopify/shopify-client");
const { processProductJob } = require("../core/pipelines/process-product.job");

// Ajusta estos imports a tus funciones reales
const { resolveStoreByShop } = require("../services/store.service");
const { runZeusProductPipelineFactory } = require("../services/zeus-pipeline.service");

const limiter = new ShopifyRateLimiter({
  safeRemainingBudget: Number(process.env.SHOPIFY_SAFE_REMAINING_BUDGET || 80)
});

const shopifyClient = new ShopifyClient({
  limiter,
  maxRetries: Number(process.env.SHOPIFY_MAX_RETRIES || 4),
  baseBackoffMs: Number(process.env.SHOPIFY_BASE_BACKOFF_MS || 1200),
  maxBackoffMs: Number(process.env.SHOPIFY_MAX_BACKOFF_MS || 15000)
});

const runZeusProductPipeline = runZeusProductPipelineFactory({ shopifyClient });

const worker = new WorkerLoop({
  fetchSize: Number(process.env.BURST_FETCH_SIZE || 40),
  pollIntervalMs: Number(process.env.WORKER_POLL_INTERVAL_MS || 750),
  leaseSeconds: Number(process.env.JOB_LEASE_SECONDS || 120),
  globalConcurrency: Number(process.env.GLOBAL_CONCURRENCY || 8),
  perStoreConcurrency: Number(process.env.PER_STORE_CONCURRENCY || 2),
  processJob: async (job) =>
    processProductJob({
      job,
      services: {
        resolveStoreByShop,
        runZeusProductPipeline
      }
    })
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received, stopping worker...");
  worker.stop();
});

worker.start().catch((err) => {
  console.error("FATAL WORKER ERROR:", err);
  process.exit(1);
});
