const runCore = require('../../core');
const runPolicy = require('../../policy');
const runObservability = require('../../observability');

function runExecutionCoordinator(executionInput) {

    // 1. CORE (transformación neutral)
    const coreOutput = runCore(executionInput);

    // 2. POLICY (aplica reglas de negocio)
    const policyOutput = runPolicy(coreOutput, executionInput.context);

    // 3. OBSERVABILITY (read-only)
    const observabilityOutput = runObservability({
        input: executionInput,
        core: coreOutput,
        policy: policyOutput
    });

    // 4. OUTPUT FINAL
    return {
        result: policyOutput,
        observability: observabilityOutput
    };
}

module.exports = {
    runExecutionCoordinator
};
