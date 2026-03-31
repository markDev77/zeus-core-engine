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
    /\b(cm|mm|kg|g|ml|l|material|capacity|weight|color)\b/i.test(l)
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
  <h3>${title}</h3>
  <ul>
    ${cleanItems.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}
  </ul>
</div>
`.trim();
}

// ==========================
// 🔥 MAIN DESCRIPTION
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

  const isES = language.startsWith("es");

  const intro = aiResult?.intro
    ? `<p><strong>${escapeHtml(title)}</strong> — ${escapeHtml(aiResult.intro)}</p>`
    : `<p><strong>${escapeHtml(title)}</strong> producto diseñado para uso práctico y eficiente.</p>`;

  const storytelling = isES
    ? `<p>Un producto pensado para quienes buscan funcionalidad y estilo en su día a día. Diseñado para adaptarse a distintas situaciones con comodidad y confianza.</p>`
    : `<p>Designed for everyday use with a balance of functionality and style.</p>`;

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
${storytelling}
${benefits}
${specs}
${trust}

${originalHtml || ""}
`.trim();
}

module.exports = {
  buildFinalDescription
};
