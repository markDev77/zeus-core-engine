function applyOverride(policy) {

    const type = policy?.type || 'general';

    return {
        ...policy,
        overrides_applied: true,
        override_type: type
    };
}

function runPolicyOverrideEngine(input) {

    const currentPolicy = input.policy || {};

    const updatedPolicy = applyOverride(currentPolicy);

    return {
        ...input,
        policy: updatedPolicy
    };
}

module.exports = runPolicyOverrideEngine;
