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

    const hook = buildHook(aiResult, language);
    const benefits = buildBenefits(aiResult, cleanText, language);
    const features = buildFeatures(cleanText, language);
    const closing = buildClosing(language);

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

// 🔥 FIX: Hook basado en IA (no genérico)
function buildHook(aiResult, language) {
  let aiText =
    typeof aiResult === "string"
      ? aiResult
      : aiResult?.description || "";

  if (aiText) {
    const firstLine = aiText.split(".")[0];
    return `<p><strong>${truncate(firstLine, 120)}</strong></p>`;
  }

  return language === "es"
    ? "<p><strong>Diseñado para mejorar tu experiencia en el día a día con practicidad y estilo.</strong></p>"
    : "<p><strong>Designed to enhance your daily experience with practicality and style.</strong></p>";
}

// 🔥 FIX: beneficios reales (no specs)
function buildBenefits(aiResult, text, language) {
  let bullets = [];

  let aiText =
    typeof aiResult === "string"
      ? aiResult
      : aiResult?.description || "";

  if (aiText) {
    bullets = aiText.split(".").slice(0, 4);
  }

  bullets = bullets.filter(b =>
    b &&
    b.length > 20 &&
    !b.toLowerCase().includes("cm") &&
    !b.toLowerCase().includes("mm") &&
    !b.toLowerCase().includes("weight") &&
    !b.toLowerCase().includes("size")
  );

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

// FEATURES (sin cambios estructurales)
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

function buildClosing(language) {
  return language === "es"
    ? "<p>Ideal para uso diario, combina funcionalidad y estilo en un solo producto.</p>"
    : "<p>Perfect for everyday use, combining functionality and style in one product.</p>";
}

function truncate(text, max) {
  if (text.length <= max) return text;
  return text.substring(0, max).trim();
}

module.exports = {
  buildFinalDescription: buildDescription
};
