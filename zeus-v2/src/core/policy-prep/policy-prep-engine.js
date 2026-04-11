function runPolicyPrepEngine(input) {

    const core = input.core || {};

    const policy_input = {
        base_title: core.title_optimized || '',
        normalized_title: core.normalized_title || '',
        category_hint: core.category_hint || 'general',
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
