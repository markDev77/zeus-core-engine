/*
========================================
ZEUS JOB QUEUE
========================================
Cola simple en memoria para procesar
jobs de forma asíncrona
========================================
*/

const queue = [];
let processing = false;

async function processQueue() {
  if (processing) return;

  processing = true;

  while (queue.length > 0) {
    const item = queue.shift();

    try {
      console.log("ZEUS JOB START:", item.name || "unnamed-job");
      await item.handler();
      console.log("ZEUS JOB COMPLETE:", item.name || "unnamed-job");
    } catch (error) {
      console.error("ZEUS JOB FAILED:", item.name || "unnamed-job", error);
    }
  }

  processing = false;
}

function enqueueJob(handler, name = "unnamed-job") {
  queue.push({
    handler,
    name,
    createdAt: new Date().toISOString()
  });

  console.log("ZEUS JOB ENQUEUED:", name, "QUEUE SIZE:", queue.length);

  processQueue().catch(error => {
    console.error("ZEUS QUEUE PROCESS ERROR:", error);
    processing = false;
  });
}

function getQueueStatus() {
  return {
    pending: queue.length,
    processing
  };
}

module.exports = {
  enqueueJob,
  getQueueStatus
};
