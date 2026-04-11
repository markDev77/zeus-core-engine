const { runValidation } = require('../adapters/validation.adapter');
const { runExecution } = require('../adapters/execution.adapter');
const { runObservability } = require('../adapters/observability.adapter');

function runIntegrationPipeline(input) {
    const validationResult = runValidation(input);

    const executionState = runExecution(validationResult);

    const observabilityOutput = runObservability(executionState);

    return observabilityOutput;
}

module.exports = {
    runIntegrationPipeline
};
