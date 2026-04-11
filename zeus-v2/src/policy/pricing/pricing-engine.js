function calculatePrice(title) {

    if (!title) return 0;

    const length = title.length;

    const base = 10;
    const variable = length * 1.5;

    return Number((base + variable).toFixed(2));
}

function runPricingEngine(input) {

    const title = input.core?.policy_input?.base_title || '';

    const price = calculatePrice(title);

    return {
        ...input,
        policy: {
            ...input.policy,
            price
        }
    };
}

module.exports = runPricingEngine;
