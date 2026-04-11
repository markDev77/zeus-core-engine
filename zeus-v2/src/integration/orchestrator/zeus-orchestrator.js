const { runIntegrationPipeline } = require('../pipeline/integration-pipeline');

function runOrchestrator(input) {
    return runIntegrationPipeline(input);
}

module.exports = {
    runOrchestrator
};
