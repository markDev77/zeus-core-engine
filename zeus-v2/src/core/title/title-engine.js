// adapter para compatibilidad con core/index.js

const { generateTitle } = require('./title.engine');

function runTitleEngine(input) {
  if (!input || !input.product) return input;

  const newTitle = generateTitle(input.product, input.store_context || {});

  return {
    ...input,
    product: {
      ...input.product,
      title: newTitle
    }
  };
}

module.exports = runTitleEngine;
