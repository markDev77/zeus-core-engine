/*
========================================
ZEUS REGIONAL TAG GENERATOR
========================================
Genera tags regionales por idioma, categoría
y señales básicas del producto.
========================================
*/

function normalizeWhitespace(text = "") {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
}

function addUnique(target, value) {
  const clean = normalizeWhitespace(value);
  if (!clean) return;

  const exists = target.some(item => item.toLowerCase() === clean.toLowerCase());
  if (!exists) {
    target.push(clean);
  }
}

function generateSpanishPetTags(source = "") {
  const normalized = source.toLowerCase();
  const tags = [];

  addUnique(tags, "mascotas");

  if (normalized.includes("perro")) addUnique(tags, "perro");
  if (normalized.includes("gato")) addUnique(tags, "gato");
  if (normalized.includes("collar")) addUnique(tags, "collar para perro");
  if (normalized.includes("entrenamiento")) addUnique(tags, "entrenamiento canino");
  if (normalized.includes("recargable")) addUnique(tags, "recargable");
  if (normalized.includes("inalámbrico") || normalized.includes("inalambrico")) addUnique(tags, "inalámbrico");
  if (normalized.includes("eléctrico") || normalized.includes("electrico")) addUnique(tags, "collar eléctrico");

  return tags;
}

function generateSpanishGeneralTags(source = "", country = "MX") {
  const normalized = source.toLowerCase();
  const tags = [];

  if (country === "MX") addUnique(tags, "méxico");
  if (country === "CO") addUnique(tags, "colombia");
  if (country === "SV") addUnique(tags, "el salvador");

  if (normalized.includes("hogar")) addUnique(tags, "hogar");
  if (normalized.includes("cocina")) addUnique(tags, "cocina");
  if (normalized.includes("inalámbrico") || normalized.includes("inalambrico")) addUnique(tags, "inalámbrico");
  if (normalized.includes("recargable")) addUnique(tags, "recargable");

  return tags;
}

function generateEnglishTags(source = "", category = "general") {
  const normalized = source.toLowerCase();
  const tags = [];

  if (category === "pet_supplies") {
    addUnique(tags, "pet supplies");
    if (normalized.includes("dog")) addUnique(tags, "dog");
    if (normalized.includes("collar")) addUnique(tags, "dog collar");
    if (normalized.includes("training")) addUnique(tags, "training collar");
    if (normalized.includes("rechargeable")) addUnique(tags, "rechargeable");
    if (normalized.includes("wireless")) addUnique(tags, "wireless");
    return tags;
  }

  if (normalized.includes("home")) addUnique(tags, "home");
  if (normalized.includes("kitchen")) addUnique(tags, "kitchen");
  if (normalized.includes("wireless")) addUnique(tags, "wireless");
  if (normalized.includes("rechargeable")) addUnique(tags, "rechargeable");

  return tags;
}

function generateRegionalTags({
  optimizedTitle = "",
  optimizedDescription = "",
  storeProfile = {},
  category = "general",
  existingTags = []
}) {
  const language = String(storeProfile.language || "en-US").toLowerCase();
  const country = String(storeProfile.country || "US").toUpperCase();
  const source = `${optimizedTitle} ${optimizedDescription}`;
  const tags = [];

  for (const tag of existingTags || []) {
    addUnique(tags, tag);
  }

  if (language.startsWith("es")) {
    if (category === "pet_supplies") {
      for (const tag of generateSpanishPetTags(source)) {
        addUnique(tags, tag);
      }
    } else {
      for (const tag of generateSpanishGeneralTags(source, country)) {
        addUnique(tags, tag);
      }
    }
  } else {
    for (const tag of generateEnglishTags(source, category)) {
      addUnique(tags, tag);
    }
  }

  return tags.slice(0, 10);
}

module.exports = {
  generateRegionalTags
};
