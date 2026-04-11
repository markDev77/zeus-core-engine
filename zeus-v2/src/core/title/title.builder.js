// title.builder.js
// Contiene la lógica EXISTENTE de construcción de título
// ⚠️ Copiar aquí EXACTAMENTE la lógica actual desde title.engine original

function buildTitle(input, context) {
  // === INICIO LÓGICA ORIGINAL (PEGAR TAL CUAL) ===

  const original = input.title || "";

  // fallback directo (no alterar comportamiento actual)
  let title = original.trim();

  // lógica heurística existente (placeholder para copiar real)
  // ejemplo típico actual:
  title = title
    .replace(/[-_,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // === FIN LÓGICA ORIGINAL ===

  return title;
}

module.exports = {
  buildTitle,
};
