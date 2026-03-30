function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function cleanTitle(raw) {
  return String(raw || "")
    .replace(/[\[\]\(\)\{\}]/g, "")
    .replace(/\b\d+\s?(pcs|piece|set|lot)\b/gi, "")
    .replace(/\b(free shipping|hot sale|new|202\d)\b/gi, "")
    .replace(/\b(sexy|hot|fashion)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function removeWeakWords(text) {
  return text
    .replace(/\b(ideal para|perfecto para|perfecta para)\b/gi, "")
    .replace(/\b(increible|premium|alta calidad|mejor)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

// 🔥 INTELIGENCIA CONTROLADA (SIN IA)
function interpretAttributes(title) {
  const t = normalize(title);
  const attributes = [];

  if (t.includes("round") || t.includes("hole")) {
    attributes.push("con abertura frontal");
  }

  if (t.includes("necktie") || t.includes("halter")) {
    attributes.push("y tirantes tipo halter");
  }

  if (t.includes("open") || t.includes("string")) {
    attributes.push("ajustable");
  }

  return attributes.join(" ");
}

function detectType(title) {
  const t = normalize(title);

  if (t.includes("swimming") || t.includes("swimsuit") || t.includes("ban")) {
    return "Traje de baño";
  }

  if (t.includes("bag") || t.includes("bolsa")) {
    return "Bolsa";
  }

  if (t.includes("lamp") || t.includes("lampara")) {
    return "Lámpara";
  }

  return title.split(" ").slice(0, 2).join(" ");
}

function detectContext(title) {
  const t = normalize(title);

  if (t.includes("swimming") || t.includes("pool")) {
    return "para playa o piscina";
  }

  if (t.includes("car")) return "para auto";
  if (t.includes("home")) return "para hogar";

  return "";
}

function generateTitle(rawTitle) {
  try {
    if (!rawTitle) return "";

    let clean = cleanTitle(rawTitle);
    clean = removeWeakWords(clean);

    const type = detectType(clean);
    const attributeDetected = interpretAttributes(clean);
    const context = detectContext(clean);

    // 🔥 FORZAR ATRIBUTO SI NO EXISTE
    let attribute = attributeDetected;

    if (!attribute) {
      const words = clean.split(" ").filter(Boolean);
      attribute = words.slice(2, 6).join(" ");
    }

    // 🔥 CONSTRUCCIÓN ZEUS
    let finalTitle = type;

    if (attribute) finalTitle += ` ${attribute}`;
    if (context) finalTitle += ` ${context}`;

    // 🔥 FALLBACK INTELIGENTE
    if (!finalTitle || finalTitle.length < 10) {
      finalTitle = clean;
    }

    // Capitalización
    finalTitle =
      finalTitle.charAt(0).toUpperCase() + finalTitle.slice(1);

    return finalTitle;

  } catch (err) {
    console.error("TITLE ENGINE ERROR:", err.message);
    return rawTitle;
  }
}

function improveTitleWithContext(title) {
  return generateTitle(title);
}

module.exports = {
  generateTitle,
  improveTitleWithContext
};
