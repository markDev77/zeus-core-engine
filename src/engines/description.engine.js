function normalize(text = "") {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupeLines(lines = []) {
  const seen = new Set();
  return lines.filter((line) => {
    const key = line.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function htmlToPlainText(html = "") {
  return String(html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\n+/g, "\n")
    .trim();
}

function removeGenericNoise(text = "") {
  return text
    .replace(/free shipping/gi, "")
    .replace(/fast shipping/gi, "")
    .replace(/dropshipping/gi, "")
    .replace(/wholesale/gi, "")
    .replace(/contact us/gi, "")
    .replace(/thank you/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitLines(text = "") {
  return String(text)
    .split(/\n|•|·| - | – | — /g)
    .map((x) => normalize(x))
    .filter(Boolean);
}

function extractSpecLines(lines = []) {
  return lines.filter((l) =>
    /\b(cm|mm|kg|g|ml|l|size|dimension|material|capacity|weight)\b/i.test(l)
  );
}

function extractNarrativeLines(lines = []) {
  return lines.filter((l) => l.length > 30 && l.length < 200);
}

function escapeHtml(text = "") {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildListSection(title, items = []) {
  const cleanItems = dedupeLines(
    (items || [])
      .map((x) => normalize(x))
      .filter(Boolean)
  );

  if (!cleanItems.length) return "";

  return `
<div style="margin-top:16px;">
  <h3 style="margin:0 0 8px 0;">${title}</h3>
  <ul>
    ${cleanItems.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}
  </ul>
</div>
`.trim();
}

// ==========================
// 🔥 MAIN DESCRIPTION BUILDER
// ==========================
function buildFinalDescription({
  title,
  originalHtml,
  aiResult,
  language = "en"
}) {

  const plainText = htmlToPlainText(originalHtml || "");
  const cleanedText = removeGenericNoise(plainText);
  const lines = splitLines(cleanedText);

  const specLines = extractSpecLines(lines).slice(0, 8);
  const narrativeLines = extractNarrativeLines(lines).slice(0, 2);

  const isES = language.startsWith("es");

  const intro = aiResult?.intro
    ? `<p>${escapeHtml(aiResult.intro)}</p>`
    : isES
      ? `<p><strong>${escapeHtml(title)}</strong>. Información clara y fácil de revisar.</p>`
      : `<p><strong>${escapeHtml(title)}</strong>. Clear product information.</p>`;

  const benefits = buildListSection(
    isES ? "Beneficios clave" : "Key benefits",
    aiResult?.bullets || []
  );

  const specs = buildListSection(
    isES ? "Características técnicas" : "Technical details",
    aiResult?.specs?.length ? aiResult.specs : specLines
  );

  const trust = buildListSection(
    isES ? "Información adicional" : "Additional information",
    aiResult?.trust || []
  );

  return `
${intro}
${benefits}
${specs}
${trust}

${originalHtml || ""}
`.trim();
}

module.exports = {
  buildFinalDescription
};
