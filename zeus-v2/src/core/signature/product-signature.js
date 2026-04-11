/**
 * PRODUCT SIGNATURE
 * Genera identidad determinística del producto
 *
 * REGLAS:
 * - Basado en core (no input crudo)
 * - Determinístico
 * - Independiente de plataforma
 */

function generateSignature(text) {
    if (!text) return '';

    let hash = 0;

    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }

    // 🔴 asegurar positivo y consistente
    return Math.abs(hash).toString();
}

function runProductSignature(input) {
    if (!input || !input.product) return input;

    // 🔴 fallback inteligente (orden crítico)
    const base =
        input.core?.normalized_title ||
        input.core?.normalized_input_title ||
        input.product.title ||
        '';

    const product_signature = generateSignature(base);

    return {
        ...input,
        core: {
            ...(input.core || {}),
            product_signature
        }
    };
}

module.exports = runProductSignature;
