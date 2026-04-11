/**
 * POLICY PREP ENGINE
 * Expone datos del core hacia policy
 *
 * REGLA CRÍTICA:
 * SIEMPRE leer desde input.core (estado acumulado)
 * NUNCA usar snapshots locales
 */

function runPolicyPrepEngine(input) {
    if (!input || !input.product) return input;

    return {
        ...input,
        core: {
            ...(input.core || {}),

            policy_input: {
                base_title: input.product?.title || '',

                // 🔴 FUENTE ÚNICA DE VERDAD
                normalized_title: input.core?.normalized_title || '',

                category_hint: input.core?.category_hint || 'general',

                signature: input.core?.product_signature || ''
            }
        }
    };
}

module.exports = runPolicyPrepEngine;
