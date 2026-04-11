const triggerExecution = require('./execution/execution-trigger');

function runOrchestration(input) {
    return triggerExecution(input);
}

module.exports = {
    runOrchestration
};
