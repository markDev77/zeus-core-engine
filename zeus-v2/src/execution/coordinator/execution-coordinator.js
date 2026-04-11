const runCore = require('../../core');
const runPolicy = require('../../policy');
const runObservability = require('../../observability');

function runExecutionCoordinator(executionInput) {

    // 1. CORE (transformación neutral)
    const coreOutput = runCore(executionInput);

    // 2. POLICY (aplica reglas de negocio sobre el output del core)
    const policyOutput = runPolicy(coreOutput, executionInput.context);

    // 3. MERGE CONTROLADO (ORDEN CORRECTO)
    const finalResult = {
        ...coreOutput,
        ...policyOutput,

        product: {
            // base del core
            ...(coreOutput.product || {}),

            // policy puede agregar (precio, inventario, etc.)
            ...((policyOutput && policyOutput.product) || {}),

            // 🔴 ÚLTIMO PASO: FORZAR CONSISTENCIA DEL CORE (COMMIT REAL)
            title: coreOutput.core?.normalized_title || coreOutput.product?.title
        },

        // 🔴 core nunca se toca
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
