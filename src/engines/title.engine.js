// /src/engines/title.engine.js

function normalizeSpaces(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function sentenceCase(text) {
  const clean = normalizeSpaces(text).toLowerCase();
  if (!clean) return "";
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function replacePhrases(text) {
  let t = String(text || "");

  const phraseMap = [
    [/men'?s genuine leather business loafers shoes/gi, "mocasines de vestir para hombre"],
    [/genuine leather business loafers shoes/gi, "mocasines de vestir"],
    [/business loafers/gi, "mocasines de vestir"],
    [/loafers shoes/gi, "mocasines"],
    [/baffle splash guard/gi, "deflector a prueba de salpicaduras"],
    [/splash guard baffle/gi, "deflector a prueba de salpicaduras"],
    [/splash guard/gi, "deflector a prueba de salpicaduras"],
    [/baffle/gi, "deflector"],
    [/splashproof/gi, "a prueba de salpicaduras"],
    [/splash proof/gi, "a prueba de salpicaduras"]
  ];

  for (const [pattern, replacement] of phraseMap) {
    t = t.replace(pattern, replacement);
  }

  return t;
}

function replaceWords(text) {
  let t = String(text || "");

  const wordMap = {
    portable: "portátil",
    mini: "mini",
    electric: "eléctrico",
    fan: "ventilador",
    usb: "usb",
    juicer: "licuadora",
    shoes: "zapatos",
    shoe: "zapato",
    men: "hombre",
    mens: "hombre",
    leather: "cuero",
    genuine: "genuino",
    business: "de vestir",
    loafers: "mocasines",
    loafer: "mocasín",
    splash: "salpicaduras",
    proof: "a prueba de",
    kitchen: "cocina"
  };

  Object.keys(wordMap).forEach((key) => {
    t = t.replace(new RegExp(`\\b${key}\\b`, "gi"), wordMap[key]);
  });

  return t;
}

function cleanNoise(text) {
  return String(text || "")
    .replace(/\b(new|hot|sale|free shipping|dropshipping|2024|2025|2026)\b/gi, "")
    .replace(/[|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function regionalizeTitle(text) {
  let t = String(text || "");

  t = t.replace(/\bzapatos de vestir de cuero genuino para hombre\b/gi, "mocasines de vestir para hombre");
  t = t.replace(/\bdeflector a prueba de salpicaduras\b/gi, "Deflector a prueba de salpicaduras");

  return t;
}

function trimTitle(text, max = 60) {
  let t = normalizeSpaces(text);
  if (t.length <= max) return t;

  const parts = t.split(" ");
  let out = "";

  for (const part of parts) {
    const test = out ? `${out} ${part}` : part;
    if (test.length > max) break;
    out = test;
  }

  return out || t.slice(0, max).trim();
}

function generateTitle(rawTitle) {
  if (!rawTitle) return null;

  let title = String(rawTitle);

  title = replacePhrases(title);
  title = replaceWords(title);
  title = cleanNoise(title);
  title = regionalizeTitle(title);
  title = sentenceCase(title);
  title = trimTitle(title, 60);

  return normalizeSpaces(title);
}

module.exports = {
  generateTitle
};
