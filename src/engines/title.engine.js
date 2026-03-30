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

// Heurística simple (no IA)
function extractComponents(title) {
  const t = normalize(title);

  let type = "";
  let attribute = "";
  let context = "";

  // TYPE
  if (t.includes("bag") || t.includes("bolsa") || t.includes("mochila")) {
    type = "Bolsa";
  } else if (t.includes("lamp") || t.includes("lampara")) {
    type = "Lámpara";
  } else if (t.includes("massager") || t.includes("masaje")) {
    type = "Masajeador";
  } else if (t.includes("chair") || t.includes("silla")) {
    type = "Silla";
  } else {
    type = title.split(" ")[0];
  }

  // ATTRIBUTE (buscar palabra relevante)
  const words = title.split(" ");
  attribute = words.slice(1, 4).join(" ");

  // CONTEXT
  if (t.includes("car") || t.includes("auto")) {
    context = "para auto";
  } else if (t.includes("home") || t.includes("casa")) {
    context = "para hogar";
  } else if (t.includes("portable")) {
    context = "portátil";
  }

  return {
    type,
    attribute,
    context
  };
}

function buildSEO(titleParts) {
  const { type, attribute, context } = titleParts;

  let result = type;

  if (attribute) {
    result += ` ${attribute}`;
  }

  if (context) {
    result += ` ${context}`;
  }

  return result.trim();
}

function generateTitle(rawTitle, options = {}) {
  try {
    if (!rawTitle) return "";

    // 1. Limpieza base
    let clean = cleanTitle(rawTitle);

    // 2. Remover palabras débiles
    clean = removeWeakWords(clean);

    // 3. Extraer componentes
    const parts = extractComponents(clean);

    // 4. Construir SEO
    let finalTitle = buildSEO(parts);

    // 5. Fallback seguro
    if (!finalTitle || finalTitle.length < 5) {
      finalTitle = clean;
    }

    // 6. Capitalización ligera
    finalTitle =
      finalTitle.charAt(0).toUpperCase() + finalTitle.slice(1);

    return finalTitle;

  } catch (err) {
    console.error("TITLE ENGINE ERROR:", err.message);
    return rawTitle;
  }
}

// opcional si server usa improveTitleWithContext
function improveTitleWithContext(title) {
  return generateTitle(title);
}

module.exports = {
  generateTitle,
  improveTitleWithContext
};
