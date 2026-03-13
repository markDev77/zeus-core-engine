const { optimizeTitle } = require("./titleOptimizer");
const { generateTags } = require("./tagGenerator");
const { suggestCategory } = require("./categorySuggestor");

/*
ZEUS PRODUCT TRANSFORMER

Este módulo centraliza la transformación del producto
y orquesta los distintos servicios internos del motor.
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
  Paso 3 — Sugerir categoría
  */
  const categoryData = suggestCategory({
    title: optimizedTitle,
    description
  });

  /*
  Resultado final del motor ZEUS
  */
  return {
    engine: "ZEUS",
    originalTitle: title,
    optimizedTitle: optimizedTitle,
    suggestedTags: tags,
    suggestedCategory: categoryData.suggestedCategory,
    categoryConfidence: categoryData.confidence
  };

}

module.exports = {
  transformProduct
};
