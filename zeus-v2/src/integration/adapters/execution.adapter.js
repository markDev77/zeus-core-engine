const runExecutionModule = require('../../execution');

function runExecution(validatedInput) {
    return runExecutionModule(validatedInput);
}

module.exports = {
    runExecution
};
