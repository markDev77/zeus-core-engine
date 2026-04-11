/**
 * POLICY PREP ENGINE
 * Expone datos del core hacia policy
 */

function runPolicyPrepEngine(input) {
    if (!input || !input.product) return input;

    const core = input.core || {};
    const product = input.product || {};

    return {
        ...input,
        core: {
            ...core,
            policy_input: {
                // 🔴 usar SIEMPRE el producto final (post-commit)
                base_title: product.title || '',

                // 🔴 leer directamente del input actualizado (no de copia local)
                normalized_title: input.core?.normalized_title || '',

                category_hint: core.category_hint || 'general',

                // 🔴 identidad del producto
                signature: input.core?.product_signature || ''
            }
        }
    };
}

module.exports = runPolicyPrepEngine;
