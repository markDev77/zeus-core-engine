function normalizeTitle(title) {

    if (!title || typeof title !== 'string') return '';

    return title
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quitar acentos
        .replace(/[^\w\s]/g, '') // quitar símbolos
        .replace(/\s+/g, ' ') // espacios múltiples
        .trim();
}

function runProductNormalizer(input) {

    const product = input.product || {};
    const rawTitle = product.title || '';

    const normalized_title = normalizeTitle(rawTitle);

    return {
        ...input,
        core: {
            ...input.core,
            normalized_title
        }
    };
}

module.exports = runProductNormalizer;
