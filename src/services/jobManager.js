/*
ZEUS JOB MANAGER

Este módulo registra y gestiona los trabajos
de procesamiento de productos.

Más adelante se conectará con la base de datos
y con workers de procesamiento.
*/

const jobs = [];

function createJob(data) {

  const job = {
    id: Date.now(),
    product: data,
    status: "queued",
    createdAt: new Date()
  };

  jobs.push(job);

  return job;

}

function getJob(jobId) {

  return jobs.find(j => j.id === jobId);

}

function updateJobStatus(jobId, status) {

  const job = jobs.find(j => j.id === jobId);

  if (job) {
    job.status = status;
  }

  return job;

}

module.exports = {
  createJob,
  getJob,
  updateJobStatus
};
