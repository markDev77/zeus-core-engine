// ZEUS DESCRIPTION ENGINE PRO
// Usa aiResult existente (NO genera IA nueva)
// Mantiene HTML original intacto al final

function buildDescription({
  originalHtml,
  aiResult,
  language
}) {
  try {
    const cleanText = extractText(originalHtml);

    // 1. Hook
    const hook = buildHook(aiResult, language);

    // 2. Beneficios
    const benefits = buildBenefits(aiResult, cleanText, language);

    // 3. Características
    const features = buildFeatures(cleanText, language);

    // 4. Cierre
    const closing = buildClosing(language);

    // 5. HTML final (manteniendo original al final)
    const finalHtml = `
      ${hook}
      ${benefits}
      ${features}
      ${closing}
      ${originalHtml || ""}
    `;

    return finalHtml;

  } catch (err) {
    console.error("ZEUS DESCRIPTION ENGINE ERROR:", err);
    return originalHtml || "";
  }
}

// ---------------- HELPERS ----------------

function extractText(html) {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// -------- HOOK --------
function buildHook(aiResult, language) {
  if (aiResult && typeof aiResult === "string") {
    return `<p><strong>${truncate(aiResult, 160)}</strong></p>`;
  }

  return language === "es"
    ? "<p><strong>Descubre un producto diseñado para mejorar tu día a día.</strong></p>"
    : "<p><strong>Discover a product designed to improve your daily life.</strong></p>";
}

// -------- BENEFITS --------
function buildBenefits(aiResult, text, language) {
  let bullets = [];

  let aiText =
  typeof aiResult === "string"
    ? aiResult
    : aiResult?.description || "";

if (aiText) {
  bullets = aiText.split(".").slice(0, 4);
} else {
  bullets = text.split(".").slice(0, 4);
}

  bullets = bullets.filter(b => b && b.length > 10);

  if (!bullets.length) return "";

  const title = language === "es" ? "Beneficios clave:" : "Key benefits:";

  const list = bullets
    .map(b => `<li>${b.trim()}</li>`)
    .join("");

  return `
    <h3>${title}</h3>
    <ul>${list}</ul>
  `;
}

// -------- FEATURES --------
function buildFeatures(text, language) {
  const items = text.split(",").slice(0, 6).filter(i => i.length > 5);

  if (!items.length) return "";

  const title = language === "es" ? "Características:" : "Features:";

  const list = items
    .map(i => `<li>${i.trim()}</li>`)
    .join("");

  return `
    <h3>${title}</h3>
    <ul>${list}</ul>
  `;
}

// -------- CLOSING --------
function buildClosing(language) {
  return language === "es"
    ? "<p>Ideal para uso diario, combina funcionalidad y estilo en un solo producto.</p>"
    : "<p>Perfect for everyday use, combining functionality and style in one product.</p>";
}

// -------- UTIL --------
function truncate(text, max) {
  if (text.length <= max) return text;
  return text.substring(0, max).trim();
}

module.exports = {
  buildFinalDescription: buildDescription
};
