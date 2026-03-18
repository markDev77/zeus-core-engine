/*
ZEUS CATEGORY SUGGESTOR

Este módulo analiza el título del producto
y sugiere una categoría básica.

Más adelante este servicio será reemplazado por
ZEUS CATEGORY BRAIN (clasificación inteligente).
*/

function suggestCategory(product) {

  const title = product.title.toLowerCase();

  let category = "general";
  let confidence = 0.5;

  /*
  Reglas básicas iniciales
  */

  if (title.includes("earbuds") || title.includes("headphones")) {
    category = "electronics_audio";
    confidence = 0.9;
  }

  else if (title.includes("shirt") || title.includes("t-shirt") || title.includes("hoodie")) {
    category = "fashion_clothing";
    confidence = 0.85;
  }

  else if (title.includes("dog") || title.includes("cat") || title.includes("pet")) {
    category = "pet_supplies";
    confidence = 0.8;
  }

  else if (title.includes("lamp") || title.includes("light")) {
    category = "home_lighting";
    confidence = 0.8;
  }

  else if (title.includes("phone") || title.includes("iphone") || title.includes("android")) {
    category = "electronics_mobile_accessories";
    confidence = 0.85;
  }

  return {
    suggestedCategory: category,
    confidence: confidence
  };

}

module.exports = {
  suggestCategory
};
