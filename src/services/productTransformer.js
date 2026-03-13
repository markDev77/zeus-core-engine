const { optimizeTitle } = require("./titleOptimizer");
const { generateTags } = require("./tagGenerator");

/*
ZEUS PRODUCT TRANSFORMER

Este módulo recibe datos de producto desde cualquier conector:
- Shopify
- WooCommerce
- USAdrop
- Importadores

y devuelve una estructura optimizada lista para ecommerce.
*/

function transformProduct(product) {

  const { title, description } = product;

  /*
  Paso 1 — Optimizar título
  */
  const optimizedTitle = optimizeTitle(title);

  /*
  Paso 2 — Generar tags
  */
  const tags = generateTags(optimizedTitle);

  /*
  Respuesta del motor
  */
  return {
    engine: "ZEUS",
    originalTitle: title,
    optimizedTitle: optimizedTitle,
    suggestedTags: tags
  };

}

module.exports = {
  transformProduct
};
