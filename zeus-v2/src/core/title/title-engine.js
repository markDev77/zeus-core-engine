// title-engine.js

/**
 * TITLE ENGINE
 * Construye el título final a partir de input normalizado
 *
 * REGLAS:
 * - NO limpia estructura base (eso es del normalizer)
 * - SOLO hace sanitización ligera final
 * - RESPETA normalized_input_title si existe
 */

function buildTitle(input) {
  if (!input || !input.title) return "";
  return input.title;
}

function sanitizeTitle(title) {
  if (!title) return "";

  return title
    // 🔴 eliminar símbolos finales (NO del normalizer)
    .replace(/[!¡?¿]+/g, "")

    // espacios múltiples
    .replace(/\s+/g, " ")

    .trim();
}

function runTitleEngine(input) {
  if (!input || !input.product) return input;

  // 🔴 BASE: SIEMPRE USAR NORMALIZER PRIMERO
  const baseTitle =
    input.core?.normalized_input_title || input.product.title;

  const built = buildTitle({ title: baseTitle });
  const clean = sanitizeTitle(built);

  return {
    ...input,
    core: {
      ...(input.core || {}),

      // 🔴 ESTE ES EL OUTPUT DEL ENGINE
      normalized_title: clean
    }
  };
}

module.exports = runTitleEngine;
