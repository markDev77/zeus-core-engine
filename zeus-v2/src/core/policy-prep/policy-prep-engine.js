/**
 * POLICY PREP ENGINE
 * Prepara datos del core para la capa de policy
 *
 * REGLAS:
 * - NO transforma
 * - NO decide
 * - SOLO expone estado del core
 */

function runPolicyPrepEngine(input) {
    if (!input || !input.product) return input;

    const core = input.core || {};
    const product = input.product || {};

    const policy_input = {
        // 🔴 usar producto actual (ya committed)
        base_title: product.title || '',

        // 🔴 fuente de verdad del core
        normalized_title: core.normalized_title || '',

        category_hint: core.category_hint || 'general',

        // 🔴 identidad del producto
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
