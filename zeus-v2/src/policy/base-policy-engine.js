function runBasePolicyEngine(input) {

    const policy_input = input.core?.policy_input || {};

    const policy = {
        status: 'initialized',
        price: 0,
        inventory: 0,
        source: input.product?.source || 'unknown',
        category: policy_input.category_hint || 'general'
    };

    return {
        ...input,
        policy
    };
}

module.exports = runBasePolicyEngine;
