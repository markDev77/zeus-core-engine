function buildDescription(title) {

    const safeTitle = title || 'Producto';

    return `
<p>${safeTitle} diseñado para ofrecer una solución práctica en el uso diario.</p>

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

module.exports = buildDescription;
