/*
ZEUS SKU LIMITER

Este servicio controla cuántos SKUs puede optimizar
un usuario según su plan.

Por ahora usaremos lógica simple.
Después se conectará a la base de datos.
*/

function checkSkuLimit(user) {

  const { optimized_skus, sku_limit } = user;

  if (optimized_skus >= sku_limit) {

    return {
      allowed: false,
      reason: "SKU limit reached"
    };

  }

  return {
    allowed: true
  };

}

module.exports = {
  checkSkuLimit
};
