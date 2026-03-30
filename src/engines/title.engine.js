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
    .replace(/\b(sexy)\b/gi, "") // 🔥 quitar ruido
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

// 🔥 NUEVO MOTOR INTELIGENTE
function extractComponents(title) {
  const t = normalize(title);

  let type = "";
  let attribute = "";
  let context = "";

  // TYPE
  if (t.includes("swimming") || t.includes("ban")) {
    type = "Traje de baño";
  } else if (t.includes("bag") || t.includes("bolsa")) {
    type = "Bolsa";
  } else {
    type = title.split(" ").slice(0, 2).join(" ");
  }

  // 🔥 ATTRIBUTE INTELIGENTE
  if (t.includes("round-hole") || t.includes("hole")) {
    attribute += " con abertura frontal";
  }

  if (t.includes("necktie") || t.includes("halter")) {
    attribute += " y tirantes tipo halter";
  }

  if (t.includes("open-string")) {
    attribute += " ajustable";
  }

  attribute = attribute.trim();

  // CONTEXT
  if (t.includes("swimming") || t.includes("pool")) {
    context = " para playa o piscina";
  }

  return {
    type,
    attribute,
    context
  };
}

function buildSEO(parts) {
  const { type, attribute, context } = parts;

  let result = type;

  if (attribute) result += attribute;
  if (context) result += context;

  return result.trim();
}

function generateTitle(rawTitle) {
  try {
    if (!rawTitle) return "";

    let clean = cleanTitle(rawTitle);
    clean = removeWeakWords(clean);

    const parts = extractComponents(clean);

    let finalTitle = buildSEO(parts);

    if (!finalTitle || finalTitle.length < 5) {
      finalTitle = clean;
    }

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
