// /src/engines/description.engine.js

function normalize(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function detectContext(title = "", originalHtml = "") {
  const text = `${title} ${originalHtml}`.toLowerCase();

  if (
    text.includes("mocas") ||
    text.includes("zapato") ||
    text.includes("shoe") ||
    text.includes("loafer")
  ) {
    return "footwear";
  }

  if (
    text.includes("salpicadura") ||
    text.includes("baffle") ||
    text.includes("deflector") ||
    text.includes("kitchen")
  ) {
    return "splash_guard";
  }

  return "generic";
}

function buildFootwearBlock() {
  return `
    <div style="margin-bottom:20px;">
      <p>
        Diseñado para quienes buscan una opción cómoda y funcional para complementar un estilo casual o de vestir.
        Su construcción favorece el uso diario y una presencia más cuidada.
      </p>

      <p>
        Este modelo ofrece una apariencia versátil para oficina, reuniones, salidas o uso cotidiano.
        Su diseño facilita la combinación con distintos outfits y aporta una imagen más pulida sin sacrificar practicidad.
      </p>

      <ul>
        <li>Diseño ideal para uso diario o de vestir</li>
        <li>Fácil de combinar con looks casuales o formales</li>
        <li>Opción práctica para oficina, salidas y reuniones</li>
        <li>Estilo cómodo y funcional</li>
      </ul>

      <p>
        Si buscas un calzado con presencia, versatilidad y uso práctico, esta puede ser una excelente alternativa para tu catálogo.
      </p>
    </div>
  `;
}

function buildSplashGuardBlock() {
  return `
    <div style="margin-bottom:20px;">
      <p>
        Accesorio práctico pensado para ayudar a contener salpicaduras y mantener una zona más limpia durante el uso diario.
        Ideal para espacios donde se busca mayor orden y comodidad.
      </p>

      <p>
        Su función principal es reducir el alcance de las salpicaduras y facilitar una experiencia más limpia en tareas de cocina o lavado.
        Es una opción útil para hogares que buscan practicidad y mejor control del área de trabajo.
      </p>

      <ul>
        <li>Ayuda a reducir salpicaduras</li>
        <li>Útil para mantener el área más limpia</li>
        <li>Práctico para uso diario</li>
        <li>Fácil de integrar en espacios funcionales</li>
      </ul>

      <p>
        Recomendado para quienes buscan una solución simple y funcional para mejorar la limpieza y el orden en su espacio.
      </p>
    </div>
  `;
}

function buildZeusDescription({ title, originalHtml }) {
  const ctx = detectContext(title, originalHtml);

  if (ctx === "footwear") return buildFootwearBlock();
  if (ctx === "splash_guard") return buildSplashGuardBlock();

  return buildGenericBlock();
}

const { buildSEOIntro } = require("./seo.engine");

function buildFinalDescription({ title, originalHtml, aiBlock }) {

  const seoIntro = buildSEOIntro(title);

  return `
    ${seoIntro}
    ${aiBlock || ""}
    ${originalHtml || ""}
  `;
}

module.exports = {
  buildFinalDescription
};
