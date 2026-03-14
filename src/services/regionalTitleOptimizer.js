/*
========================================
ZEUS REGIONAL TITLE OPTIMIZER
========================================
Optimiza títulos por país / idioma / estilo.
No reemplaza traducción.
Opera después de Translation Layer.
========================================
*/

function normalizeWhitespace(text = "") {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCaseSpanish(text = "") {
  const lowerWords = new Set([
    "de",
    "del",
    "para",
    "con",
    "sin",
    "y",
    "o",
    "en",
    "por",
    "a",
    "la",
    "el",
    "los",
    "las"
  ]);

  const words = normalizeWhitespace(text).toLowerCase().split(" ");

  return words
    .map((word, index) => {
      if (!word) return word;
      if (index > 0 && lowerWords.has(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function titleCaseEnglish(text = "") {
  const lowerWords = new Set([
    "of",
    "for",
    "with",
    "and",
    "or",
    "in",
    "on",
    "to",
    "the",
    "a",
    "an"
  ]);

  const words = normalizeWhitespace(text).toLowerCase().split(" ");

  return words
    .map((word, index) => {
      if (!word) return word;
      if (index > 0 && lowerWords.has(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function dedupeWords(words = []) {
  const seen = new Set();
  const result = [];

  for (const rawWord of words) {
    const word = normalizeWhitespace(rawWord);
    if (!word) continue;

    const key = word.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(word);
  }

  return result;
}

function optimizeSpanishPetTitle(baseTitle = "", description = "") {
  const source = `${baseTitle} ${description}`.toLowerCase();

  const features = [];

  if (source.includes("recargable")) {
    features.push("Recargable");
  }

  if (source.includes("inalámbrico") || source.includes("inalambrico")) {
    features.push("Inalámbrico");
  }

  if (source.includes("eléctrico") || source.includes("electrico")) {
    features.push("Eléctrico");
  }

  if (
    source.includes("entrenamiento") &&
    source.includes("collar") &&
    source.includes("perro")
  ) {
    const titleParts = dedupeWords([
      "Collar",
      "de entrenamiento",
      "para perro",
      ...features
    ]);

    return titleCaseSpanish(titleParts.join(" "));
  }

  return titleCaseSpanish(baseTitle);
}

function optimizeSpanishGeneralTitle(baseTitle = "", description = "") {
  const source = `${baseTitle} ${description}`.toLowerCase();

  let title = normalizeWhitespace(baseTitle);

  title = title
    .replace(/\b(perro collar entrenamiento eléctrico)\b/gi, "collar de entrenamiento para perro")
    .replace(/\b(perro collar)\b/gi, "collar para perro")
    .replace(/\b(gato collar)\b/gi, "collar para gato")
    .replace(/\b(home)\b/gi, "hogar")
    .replace(/\b(kitchen)\b/gi, "cocina");

  title = normalizeWhitespace(title);

  const features = [];

  if (source.includes("recargable")) features.push("Recargable");
  if (source.includes("inalámbrico") || source.includes("inalambrico")) features.push("Inalámbrico");
  if (source.includes("eléctrico") || source.includes("electrico")) features.push("Eléctrico");

  const featurePhrase = dedupeWords(features).join(" ");

  if (featurePhrase && !title.toLowerCase().includes(featurePhrase.toLowerCase())) {
    title = `${title} ${featurePhrase}`;
  }

  return titleCaseSpanish(normalizeWhitespace(title));
}

function optimizeEnglishGeneralTitle(baseTitle = "", description = "") {
  const source = `${baseTitle} ${description}`.toLowerCase();
  let title = normalizeWhitespace(baseTitle);

  if (
    source.includes("dog") &&
    source.includes("training") &&
    source.includes("collar")
  ) {
    const features = [];

    if (source.includes("rechargeable")) features.push("Rechargeable");
    if (source.includes("wireless")) features.push("Wireless");
    if (source.includes("electric")) features.push("Electric");

    const titleParts = dedupeWords([
      ...features,
      "Dog Training Collar"
    ]);

    return titleCaseEnglish(titleParts.join(" "));
  }

  return titleCaseEnglish(title);
}

function optimizeRegionalTitle({
  translatedTitle = "",
  translatedDescription = "",
  storeProfile = {},
  category = "general"
}) {
  const language = String(storeProfile.language || "en-US").toLowerCase();
  const baseTitle = normalizeWhitespace(translatedTitle);

  if (!baseTitle) {
    return "";
  }

  if (language.startsWith("es")) {
    if (category === "pet_supplies") {
      return optimizeSpanishPetTitle(baseTitle, translatedDescription);
    }

    return optimizeSpanishGeneralTitle(baseTitle, translatedDescription);
  }

  return optimizeEnglishGeneralTitle(baseTitle, translatedDescription);
}

module.exports = {
  optimizeRegionalTitle
};
