/**
 * CORE COMMIT LAYER
 * Sincroniza metadata (core.*) hacia output ejecutable (product.*)
 *
 * REGLAS:
 * - NO genera datos
 * - NO transforma
 * - SOLO refleja estado del core
 * - ES idempotente
 */

function commitCoreToProduct(output) {
    if (!output) return output;

    // 🔒 asegurar estructura mínima
    const product = output.product || {};
    const core = output.core || {};

    // 🔴 TITLE (source of truth = core)
    if (core.normalized_title) {
        product.title = core.normalized_title;
    }

    // 🔴 DESCRIPTION (source of truth = core)
    if (core.normalized_description_html) {
        product.description_html = core.normalized_description_html;
    }

    // 🔒 reasignación controlada (evita mutaciones inconsistentes)
    output.product = product;
    output.core = core;

    return output;
}

module.exports = {
    commitCoreToProduct
};
