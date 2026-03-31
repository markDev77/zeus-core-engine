// ZEUS DESCRIPTION ENGINE PRO
// Usa aiResult existente (NO genera IA nueva)
// Mantiene HTML original intacto al final

function buildDescription({ originalHtml, aiResult }) {
  try {
    return `
      <p>${aiResult.intro || ""}</p>

      <ul>
        ${(aiResult.bullets || [])
          .map(b => `<li>${b}</li>`)
          .join("")}
      </ul>

      <ul>
        ${(aiResult.specs || [])
          .map(s => `<li>${s}</li>`)
          .join("")}
      </ul>

      ${originalHtml || ""}
    `;

  } catch (err) {
    console.error("ZEUS DESCRIPTION ENGINE ERROR:", err);
    return translatedHtml || "";
  }
}

// ---------------- HELPERS (IA-FIRST) ----------------

// 🔥 Intro desde IA (storytelling)
function buildIntro(aiResult, language) {
  const text = aiResult?.intro;

  if (text && text.length > 20) {
    return `<p><strong>${text}</strong></p>`;
  }

  return "";
}

// 🔥 Beneficios desde IA
function buildBenefits(aiResult, language) {
  const items = aiResult?.bullets || [];

  if (!items.length) return "";

  const title = language === "es" ? "Beneficios clave:" : "Key benefits:";

  const list = items
  .map(i => {
  const short = i.split(",")[0]; // 🔥 recorta frase
  return `<li>${short.trim()}</li>`;
})
    .join("");

  return `
    <h3>${title}</h3>
    <ul>${list}</ul>
  `;
}

// 🔥 Specs desde IA
function buildSpecs(aiResult, language) {
  const items = aiResult?.specs || [];

  if (!items.length) return "";

  const title = language === "es" ? "Características:" : "Features:";

  const list = items
    .map(i => `<li>${i}</li>`)
    .join("");

  return `
    <h3>${title}</h3>
    <ul>${list}</ul>
  `;
}

// 🔥 Trust opcional
function buildTrust(aiResult, language) {
  const items = aiResult?.trust || [];

  if (!items.length) return "";

  const list = items
    .map(i => `<li>${i}</li>`)
    .join("");

  return `<ul>${list}</ul>`;
}

function buildUsage(aiResult, language) {
  const items = aiResult?.bullets || [];

  if (!items.length) return "";

  // 🔥 filtrar bullets que expresan uso
  const usageItems = items.filter(i =>
    i.toLowerCase().includes("uso") ||
    i.toLowerCase().includes("ideal") ||
    i.toLowerCase().includes("perfect") ||
    i.toLowerCase().includes("para") ||
    i.toLowerCase().includes("for")
  );

  if (!usageItems.length) return "";

  const title = language === "es"
    ? "Uso y funcionalidad:"
    : "Usage and functionality:";

  const list = usageItems
    .slice(0, 3)
    .map(i => `<li>${i}</li>`)
    .join("");

  return `
    <h3>${title}</h3>
    <ul>${list}</ul>
  `;
}

module.exports = {
  buildFinalDescription: buildDescription
};
