/**
 * POLICY PREP ENGINE
 * Expone datos del core hacia policy
 *
 * REGLAS:
 * - NO transforma
 * - NO decide
 * - SOLO refleja estado del core
 * - DEBE ejecutarse después del Title Engine
 */

function runPolicyPrepEngine(input) {
    if (!input || !input.product) return input;

    const core = input.core || {};
    const product = input.product || {};

    // 🔴 VALIDACIÓN CRÍTICA (para evitar bugs silenciosos)
    if (!core.normalized_title) {
        console.warn('[ZEUS][POLICY_PREP] normalized_title vacío antes de policy prep');
    }

    if (!core.product_signature) {
        console.warn('[ZEUS][POLICY_PREP] product_signature vacío antes de policy prep');
    }

    const policy_input = {
        // estado ejecutable (post-commit)
        base_title: product.title || '',

        // estado semántico del core
        normalized_title: core.normalized_title || '',

        category_hint: core.category_hint || 'general',

        // identidad del producto
        signature: core.product_signature || ''
    };

    return {
        ...input,
        core: {
            ...core,
            policy_input
        }
    };
}

module.exports = runPolicyPrepEngine;
