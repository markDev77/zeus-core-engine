const runBasePolicyEngine = require('./base-policy-engine');
const runPricingEngine = require('./pricing/pricing-engine');

function runPolicy(input) {

    let output = { ...input };

    // BASE POLICY
    output = runBasePolicyEngine(output);

    // PRICING
    output = runPricingEngine(output);

    return output;
}

module.exports = runPolicy;
