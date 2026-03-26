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

function detectSEOCategory(title = "") {
  const t = title.toLowerCase();

  if (t.includes("mocas") || t.includes("zapato")) return "footwear";
  if (t.includes("salpicadura") || t.includes("deflector")) return "splash_guard";
  if (t.includes("juguete") || t.includes("montessori")) return "toys";

  return "generic";
}

function getPrimaryKeyword(title) {
  const cat = detectSEOCategory(title);
  const list = seoDictionaryMX[cat] || [];

  return list[0] || null;
}

function injectKeywordInTitle(title) {
  const keyword = getPrimaryKeyword(title);

  if (!keyword) return title;

  // evitar duplicados
  if (title.toLowerCase().includes(keyword)) return title;

  const result = `${keyword} ${title}`;

  return result.slice(0, 60);
}

function buildSEOIntro(title) {
  const keyword = getPrimaryKeyword(title);

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
