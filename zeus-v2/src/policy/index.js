const runBasePolicyEngine = require('./base-policy-engine');
const runPricingEngine = require('./pricing/pricing-engine');
const runInventoryEngine = require('./inventory/inventory-engine');
const runPolicySelector = require('./selector/policy-selector');

function runPolicy(input) {

    let output = { ...input };

    // BASE
    output = runBasePolicyEngine(output);

    // PRICING
    output = runPricingEngine(output);

    // INVENTORY
    output = runInventoryEngine(output);

    // SELECTOR (CRÍTICO)
    output = runPolicySelector(output);

    return output;
}

module.exports = runPolicy;
