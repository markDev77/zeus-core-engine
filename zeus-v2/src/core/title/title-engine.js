// title-engine.js

/**
 * TITLE ENGINE
 * Construye el título final a partir de input normalizado
 *
 * REGLAS:
 * - NO limpia (eso es del normalizer)
 * - NO usa directamente input crudo si existe normalización
 */

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

  // 🔴 USAR BASE NORMALIZADA (PRIORIDAD)
  const baseTitle =
    input.core?.normalized_input_title || input.product.title;

  const built = buildTitle({ title: baseTitle });
  const clean = sanitizeTitle(built);

  return {
    ...input,
    core: {
      ...(input.core || {}),
      normalized_title: clean
    }
  };
}

module.exports = runTitleEngine;
