/*
========================================
ZEUS PRODUCT SIGNATURE REGISTRY
========================================
Registra firmas estructurales de productos
para detección de duplicados
y catálogo global ZEUS
========================================
*/

const registry = new Map();

function registerProductSignature({
  signature,
  shopDomain,
  productId
}) {

  if (!signature) return null;

  if (!registry.has(signature)) {

    registry.set(signature, {
      signature,
      firstSeen: new Date().toISOString(),
      stores: [],
      products: []
    });

  }

  const entry = registry.get(signature);

  if (shopDomain && !entry.stores.includes(shopDomain)) {
    entry.stores.push(shopDomain);
  }

  if (productId && !entry.products.includes(productId)) {
    entry.products.push(productId);
  }

  return entry;

}

function getSignature(signature) {

  if (!signature) return null;

  return registry.get(signature) || null;

}

function getAllSignatures() {

  return Array.from(registry.values());

}

module.exports = {
  registerProductSignature,
  getSignature,
  getAllSignatures
};
