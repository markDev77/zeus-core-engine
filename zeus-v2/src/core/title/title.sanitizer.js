// title.sanitizer.js
// Reglas de limpieza SEO
// ⚠️ Copiar lógica existente si ya hay sanitización en utils

function sanitizeTitle(title, context) {
  if (!title) return "";

  let clean = title;

  // eliminar caracteres no deseados
  clean = clean.replace(/[|<>]/g, "");

  // normalizar espacios
  clean = clean.replace(/\s+/g, " ").trim();

  // límite típico SEO (NO CAMBIAR si ya existe lógica distinta)
  if (clean.length > 70) {
    clean = clean.substring(0, 70).trim();
  }

  return clean;
}

module.exports = {
  sanitizeTitle,
};
