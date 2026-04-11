// src/core/commit/core.commit.js

/**
 * CORE COMMIT LAYER
 * Sincroniza metadata (core.*) hacia output ejecutable (product.*)
 * NO genera datos
 * NO contiene lógica de negocio
 * SOLO refleja estado final del core
 *
 * @param {Object} product
 * @param {Object} core
 * @returns {Object} product actualizado
 */
function commitCoreToProduct(product, core) {
  if (!product || !core) return product;

  // TITLE
  if (core.normalized_title) {
    product.title = core.normalized_title;
  }

  // DESCRIPTION
  if (core.normalized_description_html) {
    product.description_html = core.normalized_description_html;
  }

  return product;
}

module.exports = {
  commitCoreToProduct
};
