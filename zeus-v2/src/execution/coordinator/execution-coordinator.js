const runCore = require('../../core');
const runPolicy = require('../../policy');
const runObservability = require('../../observability');

function runExecutionCoordinator(executionInput) {
    // 1. CORE (transformación neutral)
    const coreOutput = runCore(executionInput);

    // 2. POLICY (aplica reglas de negocio sobre el output del core)
    const policyOutput = runPolicy(coreOutput, executionInput.context);

    // 3. MERGE CONTROLADO
    // Core define la base canónica.
    // Policy solo extiende / ajusta sin romper product ni core.
    const finalResult = {
        ...coreOutput,
        ...policyOutput,
        product: {
            ...(coreOutput.product || {}),
            ...((policyOutput && policyOutput.product) || {})
        },
        core: coreOutput.core
    };

    // 4. OBSERVABILITY (read-only)
    const observabilityOutput = runObservability({
        input: executionInput,
        core: coreOutput,
        policy: policyOutput,
        final: finalResult
    });

    // 5. OUTPUT FINAL
    return {
        result: finalResult,
        observability: observabilityOutput
    };
}

module.exports = {
    runExecutionCoordinator
};
