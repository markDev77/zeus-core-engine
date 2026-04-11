function runInventoryEngine(input) {

    const inventory = 11;

    return {
        ...input,
        policy: {
            ...input.policy,
            inventory
        }
    };
}

module.exports = runInventoryEngine;
