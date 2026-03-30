// /src/engines/description.engine.js

function normalize(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function stripOuterWrappers(html = "") {
  return String(html || "")
    .replace(/<\/?html[^>]*>/gi, "")
    .replace(/<\/?head[^>]*>/gi, "")
    .replace(/<\/?body[^>]*>/gi, "")
    .trim();
}

function extractImageTags(html = "") {
  const matches = String(html || "").match(/<img\b[^>]*>/gi);
  return matches || [];
}

function removeImageTags(html = "") {
  return String(html || "").replace(/<img\b[^>]*>/gi, "");
}

function htmlToPlainText(html = "") {
  return String(html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\u00a0/g, " ")
    .replace(/\n{2,}/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function splitLines(text = "") {
  return String(text || "")
    .split("\n")
    .map((line) => normalize(line))
    .filter(Boolean);
}

function dedupeLines(lines = []) {
  const seen = new Set();
  const out = [];

  for (const line of lines) {
    const key = normalize(line).toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(line);
  }

  return out;
}

function removeGenericNoise(text = "") {
  return String(text || "")
    .replace(/producto ideal.*?\./gi, "")
    .replace(/producto pensado.*?\./gi, "")
    .replace(/ideal para quienes.*?\./gi, "")
    .replace(/su diseño permite.*?\./gi, "")
    .replace(/diseño práctico.*?\./gi, "")
    .replace(/opción útil.*?\./gi, "")
    .replace(/una alternativa pensada.*?\./gi, "")
    .replace(/designed to improve.*?\./gi, "")
    .replace(/perfect for daily use.*?\./gi, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function extractSpecLines(lines = []) {
  return lines.filter((line) => {
    const l = line.toLowerCase();

    return (
      l.includes(":") ||
      /\b\d+(\.\d+)?\s?(cm|mm|kg|g|mah|v|w|h|min|℃|°c)\b/i.test(line) ||
      l.includes("material") ||
      l.includes("size") ||
      l.includes("battery") ||
      l.includes("input voltage") ||
      l.includes("output voltage") ||
      l.includes("charging") ||
      l.includes("capacity") ||
      l.includes("temperature range")
    );
  });
}

function extractNarrativeLines(lines = []) {
  return lines.filter((line) => {
    const l = line.toLowerCase();

    if (!line || line.length < 20) return false;
    if (line.startsWith("•")) return false;

    const looksLikeSpec =
      l.includes(":") ||
      /\b\d+(\.\d+)?\s?(cm|mm|kg|g|mah|v|w|h|min|℃|°c)\b/i.test(line);

    if (looksLikeSpec) return false;

    return true;
  });
}

// ==========================
// 🔥 NUEVO INTRO DINÁMICO
// ==========================
function buildIntro(title, language = "en") {
  const isES = language.startsWith("es");

  return isES
    ? `<p><strong>${title}</strong>. Diseñado para ofrecer funcionalidad real y facilidad de uso en el día a día.</p>`
    : `<p><strong>${title}</strong>. Designed to deliver practical functionality and ease of use in everyday situations.</p>`;
}

// ==========================
// 🔥 BULLETS CONTROLADOS POR IDIOMA
// ==========================
function buildFallbackBullets(title, plainText = "", language = "en") {
  const isES = language.startsWith("es");

  const text = `${title} ${plainText}`.toLowerCase();
  const bullets = [];

  if (text.includes("usb")) {
    bullets.push(isES ? "Funciona mediante conexión USB." : "Works via USB connection.");
  }

  if (text.includes("portable")) {
    bullets.push(isES ? "Diseño portátil fácil de transportar." : "Portable design for easy transport.");
  }

  if (text.includes("travel") || text.includes("viaje")) {
    bullets.push(isES ? "Adecuado para uso en casa, oficina o viaje." : "Suitable for home, office, or travel use.");
  }

  if (!bullets.length) {
    bullets.push(
      isES
        ? "Uso práctico en distintos escenarios."
        : "Practical use across different scenarios."
    );

    bullets.push(
      isES
        ? "Diseño funcional y fácil de usar."
        : "Functional and easy-to-use design."
    );
  }

  return `
<ul>
  ${bullets.slice(0, 5).map((b) => `<li>${b}</li>`).join("")}
</ul>
`.trim();
}

function hasLeadParagraph(aiBlock = "") {
  return /<p[\s>]/i.test(String(aiBlock || ""));
}

function buildSpecsSection(specLines = []) {
  if (!specLines.length) return "";

  const items = dedupeLines(specLines).slice(0, 8);

  return `
<div style="margin-top:16px;">
  <h3 style="margin:0 0 8px 0;">Especificaciones destacadas</h3>
  <ul>
    ${items.map((line) => `<li>${line}</li>`).join("")}
  </ul>
</div>
`.trim();
}

function buildNarrativeSection(narrativeLines = []) {
  if (!narrativeLines.length) return "";

  const items = dedupeLines(narrativeLines).slice(0, 2);

  return `
<div style="margin-top:16px;">
  ${items.map((line) => `<p>${line}</p>`).join("")}
</div>
`.trim();
}

function buildMediaSection(imageTags = []) {
  if (!imageTags.length) return "";

  return `
<div style="margin-top:16px;">
  <h3 style="margin:0 0 8px 0;">Galería del producto</h3>
  <div>
    ${imageTags.join("")}
  </div>
</div>
`.trim();
}

// ==========================
// 🔥 FINAL BUILDER (AJUSTADO)
// ==========================
function buildFinalDescription({ title, originalHtml, aiBlock, language = "en" }) {
  const safeOriginal = stripOuterWrappers(originalHtml || "");

  const hasHtml = safeOriginal.includes("<img");

  const intro = buildIntro(title, language);

  const aiSection = normalize(aiBlock || "")
    ? aiBlock.trim()
    : buildFallbackBullets(title, "", language);

  if (hasHtml) {
    return `
${intro}

${aiSection}

${safeOriginal}
`.trim();
  }

  return `
${intro}

${aiSection}
`.trim();
}

module.exports = {
  buildFinalDescription
};
