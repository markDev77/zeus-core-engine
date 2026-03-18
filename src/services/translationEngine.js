/*
========================================
ZEUS TRANSLATION ENGINE
========================================
Traducción básica inicial.

En fases posteriores puede integrarse:
- DeepL
- OpenAI
- Google Translate
========================================
*/

const dictionary = {
  dog: "perro",
  collar: "collar",
  training: "entrenamiento",
  electric: "eléctrico",
  rechargeable: "recargable",
  wireless: "inalámbrico",
  cat: "gato",
  pet: "mascota",
  pets: "mascotas",
  home: "hogar",
  kitchen: "cocina"
};

function translateWord(word, targetLang) {
  if (targetLang.startsWith("es")) {
    const key = word.toLowerCase();
    if (dictionary[key]) {
      return dictionary[key];
    }
  }

  return word;
}

function translateText(text = "", sourceLang = "unknown", targetLang = "en-US") {
  if (!text) {
    return text;
  }

  if (sourceLang === "unknown") {
    return text;
  }

  if (targetLang.startsWith(sourceLang)) {
    return text;
  }

  const words = text.split(" ");

  const translated = words.map(word => translateWord(word, targetLang));

  return translated.join(" ");
}

module.exports = {
  translateText
};
