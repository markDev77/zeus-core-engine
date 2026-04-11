// title-engine.js
// Adapter + lógica integrada (modo standalone para validación)

function buildTitle(input) {
  if (!input || !input.title) return "";
  return input.title;
}

function sanitizeTitle(title) {
  if (!title) return "";

  return title
    .replace(/[-_,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function runTitleEngine(input) {
  if (!input || !input.product) return input;

  const built = buildTitle(input.product);
  const clean = sanitizeTitle(built);

  return {
    ...input,
    product: {
      ...input.product,
      title: clean
    }
  };
}

module.exports = runTitleEngine;
