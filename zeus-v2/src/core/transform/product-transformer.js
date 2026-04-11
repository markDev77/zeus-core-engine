// ========================================
// FILE: /zeus-v2/src/core/transform/product-transformer.js
// ========================================

const { generateTitle } = require("../title/title.engine");

/**
 * core transform
 * SOLO transforma título
 * NO toca description
 * NO toca policy
 * NO toca execution flow
 */
async function transformProduct(payload = {}) {
  const product = payload.product || {};
  const storeContext = payload.store_context || null;

  const transformedTitle = generateTitle(product, storeContext);

  return {
    ...product,
    title: transformedTitle,
  };
}

// Alias defensivos para no romper llamadas futuras
const transform = transformProduct;
const runProductTransformer = transformProduct;

module.exports = {
  transformProduct,
  transform,
  runProductTransformer,
};
