const {
  claimAvailableJobs,
  markDone,
  markFailed,
  requeueWithDelay
} = require("./jobs.repository");
const { ConcurrencyManager } = require("./concurrency.manager");
const { RetryableShopifyError, computeBackoffMs } = require("../shopify/shopify-client");
const metrics = require("../metrics/metrics");

class WorkerLoop {
  constructor({
    processJob,
    fetchSize = 40,
    pollIntervalMs = 750,
    leaseSeconds = 120,
    globalConcurrency = 8,
    perStoreConcurrency = 2
  }) {
    this.processJob = processJob;
    this.fetchSize = fetchSize;
    this.pollIntervalMs = pollIntervalMs;
    this.leaseSeconds = leaseSeconds;
    this.running = false;
    this.concurrency = new ConcurrencyManager({
      globalLimit: globalConcurrency,
      perStoreLimit: perStoreConcurrency
    });
  }

  async tick() {
    const claimed = await claimAvailableJobs(this.fetchSize, this.leaseSeconds);

    if (!claimed.length) return;

    const runnable = [];
    const deferred = [];

    for (const job of claimed) {
      if (this.concurrency.canRun(job.shop)) {
        this.concurrency.start(job.shop);
        runnable.push(job);
      } else {
        deferred.push(job);
      }
    }

    for (const job of deferred) {
      // devolver rápido al pool con pequeño delay
      await requeueWithDelay(job.id, 1000, "Deferred by concurrency gate");
    }

    await Promise.allSettled(
      runnable.map(async (job) => {
        const startedAt = Date.now();
        metrics.state.jobsStarted += 1;

        try {
          await this.processJob(job);
          metrics.state.jobsSucceeded += 1;
          metrics.recordDuration(Date.now() - startedAt);
          await markDone(job.id);
        } catch (err) {
          metrics.recordDuration(Date.now() - startedAt);

          if (err instanceof RetryableShopifyError) {
            metrics.state.jobsRetried += 1;
            const delayMs = err.retryAfterMs || computeBackoffMs(job.attempts + 1);
            await requeueWithDelay(job.id, delayMs, err.message);
          } else if ((job.attempts || 0) + 1 < (job.max_attempts || 4)) {
            metrics.state.jobsRetried += 1;
            const delayMs = computeBackoffMs((job.attempts || 0) + 1);
            await requeueWithDelay(job.id, delayMs, err.message);
          } else {
            metrics.state.jobsFailed += 1;
            await markFailed(job.id, err.stack || err.message || "unknown failure");
          }
        } finally {
          this.concurrency.finish(job.shop);
        }
      })
    );
  }

  async start() {
    this.running = true;
    while (this.running) {
      try {
        await this.tick();
      } catch (err) {
        console.error("WORKER LOOP ERROR:", err);
      }
      await new Promise((resolve) => setTimeout(resolve, this.pollIntervalMs));
    }
  }

  stop() {
    this.running = false;
  }

  getSnapshot() {
    return this.concurrency.snapshot();
  }
}

module.exports = { WorkerLoop };
