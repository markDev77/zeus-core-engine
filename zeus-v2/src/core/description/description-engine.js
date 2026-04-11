// description-engine.js

function buildDescription(product) {
    if (!product) return "";

    const title = product.title || "";

    return `
<p>${title} diseñado para ofrecer una solución práctica en el uso diario.</p>

<ul>
    <li>Fácil de usar</li>
    <li>Diseño funcional</li>
    <li>Uso versátil</li>
</ul>

<ul>
    <li>Material resistente</li>
    <li>Construcción optimizada</li>
    <li>Alta durabilidad</li>
</ul>
`.trim();
}

function runDescriptionEngine(input) {
    if (!input || !input.product) return input;

    const description = buildDescription(input.product);

    return {
        ...input,
        core: {
            ...(input.core || {}),
            normalized_description_html: description
        }
    };
}

module.exports = runDescriptionEngine;
