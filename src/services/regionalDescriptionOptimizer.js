/*
========================================
ZEUS REGIONAL DESCRIPTION OPTIMIZER
========================================
Optimiza descripción por idioma / país.
Genera copy comercial simple para ecommerce.
========================================
*/

function normalizeWhitespace(text = "") {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
}

function capitalize(text = "") {
  const clean = normalizeWhitespace(text);
  if (!clean) return "";
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function buildSpanishPetDescription({ title = "", description = "" }) {
  const source = `${title} ${description}`.toLowerCase();

  const benefits = [
    "Ideal para mejorar el control y entrenamiento de tu mascota."
  ];

  if (source.includes("recargable")) {
    benefits.push("Diseño recargable para un uso más práctico.");
  }

  if (source.includes("inalámbrico") || source.includes("inalambrico")) {
    benefits.push("Funciona de forma inalámbrica para mayor comodidad.");
  }

  if (source.includes("eléctrico") || source.includes("electrico")) {
    benefits.push("Ayuda en rutinas de entrenamiento con respuesta eficiente.");
  }

  return normalizeWhitespace(
    `${capitalize(title)}. ${benefits.join(" ")}`
  );
}

function buildSpanishGeneralDescription({ title = "", description = "" }) {
  const cleanTitle = capitalize(title);
  const cleanDescription = capitalize(description);

  if (cleanDescription) {
    return normalizeWhitespace(
      `${cleanTitle}. ${cleanDescription}. Producto optimizado para ecommerce en México.`
    );
  }

  return normalizeWhitespace(
    `${cleanTitle}. Producto optimizado para ecommerce en México.`
  );
}

function buildEnglishGeneralDescription({ title = "", description = "" }) {
  const cleanTitle = capitalize(title);
  const cleanDescription = capitalize(description);

  if (cleanDescription) {
    return normalizeWhitespace(
      `${cleanTitle}. ${cleanDescription}. Optimized for ecommerce listing quality.`
    );
  }

  return normalizeWhitespace(
    `${cleanTitle}. Optimized for ecommerce listing quality.`
  );
}

function optimizeRegionalDescription({
  optimizedTitle = "",
  translatedDescription = "",
  storeProfile = {},
  category = "general"
}) {
  const language = String(storeProfile.language || "en-US").toLowerCase();

  if (language.startsWith("es")) {
    if (category === "pet_supplies") {
      return buildSpanishPetDescription({
        title: optimizedTitle,
        description: translatedDescription
      });
    }

    return buildSpanishGeneralDescription({
      title: optimizedTitle,
      description: translatedDescription
    });
  }

  return buildEnglishGeneralDescription({
    title: optimizedTitle,
    description: translatedDescription
  });
}

module.exports = {
  optimizeRegionalDescription
};
