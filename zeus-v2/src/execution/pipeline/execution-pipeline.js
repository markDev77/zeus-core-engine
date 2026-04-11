// ========================================
// FILE: /zeus-v2/src/execution/execution-pipeline.js
// ========================================

const { transformProduct } = require("../core/transform/product-transformer");

/**
 * execution → core
 * input esperado:
 * {
 *   product: {
 *     title,
 *     description_html,
 *     images,
 *     variants,
 *     category,
 *     source
 *   },
 *   store_context,
 *   market_signals,
 *   metadata
 * }
 */
async function executePipeline(input = {}) {
  const product = input.product || {};

  const transformedProduct = await transformProduct({
    product,
    store_context: input.store_context || null,
    market_signals: input.market_signals || null,
    metadata: input.metadata || null,
  });

  return {
    ...input,
    product: transformedProduct,
  };
}

// Alias defensivos para no romper llamadas existentes
const runExecutionPipeline = executePipeline;
const execute = executePipeline;

module.exports = {
  executePipeline,
  runExecutionPipeline,
  execute,
};
