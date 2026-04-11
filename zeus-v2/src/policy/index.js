const runBasePolicyEngine = require('./base-policy-engine');
const runPricingEngine = require('./pricing/pricing-engine');
const runInventoryEngine = require('./inventory/inventory-engine');
const runPolicySelector = require('./selector/policy-selector');
const runPolicyOverrideEngine = require('./override/policy-override-engine');

function runPolicy(input) {

    let output = { ...input };

    // BASE
    output = runBasePolicyEngine(output);

    // PRICING
    output = runPricingEngine(output);

    // INVENTORY
    output = runInventoryEngine(output);

    // SELECTOR
    output = runPolicySelector(output);

    // OVERRIDE (ESTE TE FALTA)
    output = runPolicyOverrideEngine(output);

    return output;
}

module.exports = runPolicy;
