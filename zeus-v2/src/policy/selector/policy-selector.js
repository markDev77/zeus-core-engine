function resolvePolicyType(source) {

    if (!source) return 'general';

    const normalized = String(source).toLowerCase();

    if (normalized === 'usadrop') {
        return 'usadrop';
    }

    return 'general';
}

function runPolicySelector(input) {

    const source = input.product?.source;

    const type = resolvePolicyType(source);

    return {
        ...input,
        policy: {
            ...input.policy,
            type
        }
    };
}

module.exports = runPolicySelector;
