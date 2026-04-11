const runObservabilityModule = require('../../observability');

function runObservability(executionState) {
    return runObservabilityModule(executionState);
}

module.exports = {
    runObservability
};
