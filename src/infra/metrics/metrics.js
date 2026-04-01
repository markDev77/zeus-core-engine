const { getQueueStats, getOldestQueuedAgeSeconds } = require("../queue/jobs.repository");

const state = {
  jobsStarted: 0,
  jobsSucceeded: 0,
  jobsFailed: 0,
  jobsRetried: 0,
  lastDurationsMs: []
};

function recordDuration(ms) {
  state.lastDurationsMs.push(ms);
  if (state.lastDurationsMs.length > 500) {
    state.lastDurationsMs.shift();
  }
}

function percentile(arr, p) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

async function snapshotMetrics(concurrencySnapshot = {}) {
  const queueStats = await getQueueStats();
  const oldestQueuedAgeSeconds = await getOldestQueuedAgeSeconds();

  return {
    counters: {
      jobsStarted: state.jobsStarted,
      jobsSucceeded: state.jobsSucceeded,
      jobsFailed: state.jobsFailed,
      jobsRetried: state.jobsRetried
    },
    latency: {
      p50Ms: percentile(state.lastDurationsMs, 50),
      p95Ms: percentile(state.lastDurationsMs, 95),
      p99Ms: percentile(state.lastDurationsMs, 99)
    },
    queue: {
      stats: queueStats,
      oldestQueuedAgeSeconds
    },
    concurrency: concurrencySnapshot
  };
}

module.exports = {
  state,
  recordDuration,
  snapshotMetrics
};
