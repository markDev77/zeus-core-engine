
/**
 * PRODUCT NORMALIZER
 * Limpia estructura del input
 * NO define output final
 */

function cleanText(text) {
    if (!text || typeof text !== 'string') return '';

    return text
        .replace(/[-_,]+/g, ' ')
        .replace(/[!¡?¿]+/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function toTitleCase(text) {
    if (!text) return '';

    return text
        .toLowerCase()
        .split(' ')
        .map(word => word ? word.charAt(0).toUpperCase() + word.slice(1) : '')
        .join(' ');
}

function normalizeTitle(rawTitle) {
    const cleaned = cleanText(rawTitle);
    return toTitleCase(cleaned);
}

function runProductNormalizer(input) {
    if (!input || !input.product) return input;

    const rawTitle = input.product.title || '';
    const normalizedInputTitle = normalizeTitle(rawTitle);

    return {
        ...input,
        core: {
            ...(input.core || {}),
            normalized_input_title: normalizedInputTitle
        }
    };
}

module.exports = runProductNormalizer;
