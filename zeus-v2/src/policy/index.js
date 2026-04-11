const runBasePolicyEngine = require('./base-policy-engine');

function runPolicy(input) {

    return runBasePolicyEngine(input);
}

module.exports = runPolicy;
