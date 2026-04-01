async function processProductJob({ job, services }) {
  const { resolveStoreByShop, runZeusProductPipeline } = services;

  const shop = job.shop;
  const payload = job.payload || {};
  const productId = payload.productId;

  const store = await resolveStoreByShop(shop);
  if (!store || !store.access_token) {
    throw new Error(`Store/token not found for ${shop}`);
  }

  await runZeusProductPipeline({
    shop,
    productId,
    store
  });
}

module.exports = { processProductJob };
