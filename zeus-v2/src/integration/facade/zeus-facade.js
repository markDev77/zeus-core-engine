const { runOrchestrator } = require('../orchestrator/zeus-orchestrator');

function runZeus(input) {
    return runOrchestrator(input);
}

module.exports = {
    runZeus
};
