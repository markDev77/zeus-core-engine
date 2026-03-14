/*
========================================
ZEUS LOOP PROTECTION ENGINE
========================================
Detecta si el producto fue modificado por ZEUS
y evita reprocesamiento infinito.
*/

function isZeusUpdate(product) {

  if (!product) return false;

  // revisar metafields si existen
  if (product.metafields) {

    const zeusFlag = product.metafields.find(m =>
      m.namespace === "zeus" && m.key === "optimized"
    );

    if (zeusFlag) {
      return true;
    }

  }

  // fallback: revisar tag interno
  if (product.tags && product.tags.includes("zeus-optimized")) {
    return true;
  }

  return false;

}

module.exports = {
  isZeusUpdate
};