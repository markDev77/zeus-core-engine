// /src/engines/seo.engine.js

const seoDictionaryMX = {
  footwear: [
    "mocasines hombre",
    "zapatos de vestir hombre",
    "mocasines casuales hombre"
  ],
  splash_guard: [
    "protector salpicaduras cocina",
    "protector fregadero cocina",
    "deflector agua fregadero"
  ],
  toys: [
    "juguetes montessori",
    "juguetes educativos niños",
    "juguetes didacticos infantiles"
  ],
  generic: []
};

// 🔒 SAFE NORMALIZER
function safeString(value) {
  if (!value) return "";

  if (typeof value === "string") return value;

  if (typeof value === "object") {
    if (value.title) return String(value.title);
    return JSON.stringify(value);
  }

  return String(value);
}

function detectSEOCategory(title = "") {
  const t = safeString(title).toLowerCase();

  if (t.includes("mocas") || t.includes("zapato")) return "footwear";
  if (t.includes("salpicadura") || t.includes("deflector")) return "splash_guard";
  if (t.includes("juguete") || t.includes("montessori")) return "toys";

  return "generic";
}

function getPrimaryKeyword(title) {
  const t = safeString(title);
  const cat = detectSEOCategory(t);
  const list = seoDictionaryMX[cat] || [];

  return list[0] || null;
}

function injectKeywordInTitle(title) {
  const safeTitle = safeString(title);
  const keyword = getPrimaryKeyword(safeTitle);
  if (!keyword) return safeTitle;

  let t = safeTitle.toLowerCase();

  const keywordMain = keyword.split(" ")[0];

  if (t.includes(keywordMain)) {
    return sentenceCase(trimSmart(cleanTitle(t), 60));
  }

  let result = `${keyword} ${t}`;

  result = cleanTitle(result);
  result = trimSmart(result, 60);

  return sentenceCase(result);
}

function cleanTitle(text) {
  return text
    .replace(/\b(juguetes)\s+\1\b/gi, "juguetes")
    .replace(/\b(montessori)\s+\1\b/gi, "montessori")
    .replace(/\b(protector)\s+\1\b/gi, "protector")
    .replace(/\s+/g, " ")
    .trim();
}

function trimSmart(text, max) {
  if (text.length <= max) return text;

  const words = text.split(" ");
  let out = "";

  for (const w of words) {
    const test = out ? `${out} ${w}` : w;
    if (test.length > max) break;
    out = test;
  }

  return out;
}

function sentenceCase(text) {
  const t = safeString(text).toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function buildSEOIntro(title) {
  const safeTitle = safeString(title);
  const keyword = getPrimaryKeyword(safeTitle);

  if (!keyword) return "";

  return `
  <p>
  ${keyword.charAt(0).toUpperCase() + keyword.slice(1)} diseñados para ofrecer funcionalidad, practicidad y una mejor experiencia de uso en el día a día.
  </p>
  `;
}

module.exports = {
  injectKeywordInTitle,
  buildSEOIntro
};
