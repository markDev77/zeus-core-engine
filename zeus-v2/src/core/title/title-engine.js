// title.engine.js
// Orquestador de generación de título
// NO contiene lógica interna de construcción

const { buildTitle } = require("./title.builder");
const { sanitizeTitle } = require("./title.sanitizer");

/**
 * @param {Object} input
 * @param {string} input.title
 * @param {Object} context
 * @returns {string}
 */
function generateTitle(input, context) {
  if (!input || !input.title) return "";

  // Paso 1: construir título
  const builtTitle = buildTitle(input, context);

  // Paso 2: sanitizar
  const finalTitle = sanitizeTitle(builtTitle, context);

  return finalTitle;
}

module.exports = {
  generateTitle,
};
