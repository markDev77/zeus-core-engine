/*
========================================
ZEUS LANGUAGE DETECTOR
========================================
Detección simple de idioma del input
para decidir si se requiere traducción.
========================================
*/

function detectLanguage(text = "") {
  if (!text || typeof text !== "string") {
    return "unknown";
  }

  const normalized = text.toLowerCase();

  const spanishIndicators = [
    "para",
    "perro",
    "gato",
    "entrenamiento",
    "collar",
    "recargable",
    "inalámbrico",
    "mascotas",
    "hogar",
    "cocina"
  ];

  const englishIndicators = [
    "for",
    "dog",
    "cat",
    "training",
    "collar",
    "wireless",
    "rechargeable",
    "pet",
    "home",
    "kitchen"
  ];

  let spanishScore = 0;
  let englishScore = 0;

  spanishIndicators.forEach(word => {
    if (normalized.includes(word)) {
      spanishScore++;
    }
  });

  englishIndicators.forEach(word => {
    if (normalized.includes(word)) {
      englishScore++;
    }
  });

  if (spanishScore > englishScore) {
    return "es";
  }

  if (englishScore > spanishScore) {
    return "en";
  }

  return "unknown";
}

module.exports = {
  detectLanguage
};
