const runCore = require('../../core');
const runPolicy = require('../../policy');
const runObservability = require('../../observability');

function runExecutionCoordinator(executionInput) {

    // 1. CORE (transformación neutral)
    const coreOutput = runCore(executionInput);

    // 2. POLICY (aplica reglas de negocio sobre el output del core)
    const policyOutput = runPolicy(coreOutput, executionInput.context);

    // 3. MERGE CONTROLADO (ORDEN CORRECTO + COMMIT FORZADO)
    const finalResult = {
        ...coreOutput,
        ...policyOutput,

        product: {
            // base del core
            ...(coreOutput.product || {}),

            // policy puede agregar (precio, inventario, etc.)
            ...((policyOutput && policyOutput.product) || {}),

            // 🔴 ÚLTIMO PASO: FORZAR CONSISTENCIA DEL CORE (SOURCE OF TRUTH)
            title: coreOutput.core?.normalized_title || coreOutput.product?.title,
            description_html: coreOutput.core?.normalized_description_html || coreOutput.product?.description_html
        },

        // 🔴 core nunca se sobrescribe
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
