/*
========================================
ZEUS JOB QUEUE
========================================
Procesamiento asíncrono de pipelines
========================================
*/

const queue = [];

let processing = false;

async function enqueueJob(job) {

  queue.push(job);

  console.log("ZEUS JOB ENQUEUED");

  processQueue();

}

async function processQueue() {

  if (processing) return;

  processing = true;

  while (queue.length > 0) {

    const job = queue.shift();

    try {

      console.log("ZEUS JOB START");

      await job();

      console.log("ZEUS JOB COMPLETE");

    } catch (error) {

      console.error("ZEUS JOB FAILED:", error);

    }

  }

  processing = false;

}

module.exports = {
  enqueueJob
};
