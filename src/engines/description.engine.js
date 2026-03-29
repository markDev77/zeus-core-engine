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

function buildIntro(title) {
  return `<p><strong>${title}</strong>. Una opción pensada para combinar funcionalidad, practicidad y una mejor experiencia de uso en el día a día, adaptándose a distintos contextos de uso personal, hogar, viaje o rutina diaria.</p>`;
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

function buildFallbackBullets(title, plainText) {
  const text = `${title} ${plainText}`.toLowerCase();

  const bullets = [];

  if (text.includes("usb")) bullets.push("Funciona con carga USB para mayor practicidad.");
  if (text.includes("portable") || text.includes("portátil")) bullets.push("Diseño portátil fácil de llevar a cualquier lugar.");
  if (text.includes("travel") || text.includes("viaje")) bullets.push("Ideal para uso diario, oficina o viajes.");
  if (text.includes("hair") || text.includes("cabello") || text.includes("rizador") || text.includes("plancha")) {
    bullets.push("Pensado para facilitar el peinado en poco tiempo.");
  }
  if (text.includes("storage") || text.includes("alimentos") || text.includes("food")) {
    bullets.push("Ayuda a organizar y transportar alimentos con mayor comodidad.");
  }

  if (!bullets.length) {
    bullets.push("Diseño funcional pensado para un uso práctico y cotidiano.");
    bullets.push("Formato cómodo y fácil de integrar en tu rutina diaria.");
  }

  return `
<ul>
  ${bullets.slice(0, 5).map((b) => `<li>${b}</li>`).join("")}
</ul>
`.trim();
}

function buildFinalDescription({ title, originalHtml, aiBlock }) {
  const safeOriginal = stripOuterWrappers(originalHtml || "");
  const imageTags = extractImageTags(safeOriginal);

  const htmlWithoutImages = removeImageTags(safeOriginal);
  const plainText = removeGenericNoise(htmlToPlainText(htmlWithoutImages));
  const lines = splitLines(plainText);

  const specLines = extractSpecLines(lines);
  const narrativeLines = extractNarrativeLines(lines);

  const intro = hasLeadParagraph(aiBlock) ? "" : buildIntro(title);
  const aiSection = normalize(aiBlock || "") ? aiBlock.trim() : buildFallbackBullets(title, plainText);
  const narrativeSection = buildNarrativeSection(narrativeLines);
  const specsSection = buildSpecsSection(specLines);
  const mediaSection = buildMediaSection(imageTags);

  return `
${intro}

${aiSection}

${narrativeSection}

${specsSection}

${mediaSection}
`.trim();
}

module.exports = {
  buildFinalDescription
};
