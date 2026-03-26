function buildZeusDescription({ title }) {
  if (!title) return "";

  return `
    <div style="margin-bottom:20px;">
      
      <h1 style="font-size:20px; font-weight:bold;">
        ${title}
      </h1>

      <p>
        Descubre una solución práctica y funcional para tu día a día.
        Este producto está diseñado para ofrecer comodidad, eficiencia
        y facilidad de uso en cualquier entorno.
      </p>

      <ul>
        <li>Diseño práctico y funcional</li>
        <li>Fácil de usar y transportar</li>
        <li>Ideal para uso diario</li>
        <li>Materiales resistentes</li>
      </ul>

      <p>
        Ideal para quienes buscan practicidad sin complicaciones.
      </p>

    </div>
  `;
}

function buildFinalDescription({ title, originalHtml }) {
  const zeusBlock = buildZeusDescription({ title });

  return `
    ${zeusBlock}
    ${originalHtml || ""}
  `;
}

module.exports = {
  buildFinalDescription
};
