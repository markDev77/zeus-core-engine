const runValidation = require('../validation');
const runContext = require('../context');
const runSignals = require('../signals');

const { runExecutionCoordinator } = require('./coordinator/execution-coordinator');

function runExecution(input) {

    // 1. VALIDATION
    const validatedInput = runValidation(input);

    // 2. CONTEXT
    const resolvedContext = runContext(validatedInput);

    // 3. SIGNALS
    const resolvedSignals = runSignals(validatedInput);

    // 4. BUILD EXECUTION INPUT
    const executionInput = {
        ...validatedInput,
        context: resolvedContext,
        signals: resolvedSignals
    };

    // 5. HANDOFF TO EXECUTION COORDINATOR
    return runExecutionCoordinator(executionInput);
}

module.exports = runExecution;
