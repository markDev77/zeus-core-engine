const sanitizeTitle = require('./title-sanitizer');

function runTitleEngine(input) {

    const product = input.product || {};
    const rawTitle = product.title || '';

    const cleanTitle = sanitizeTitle(rawTitle);

    // Construcción simple (v1)
    const title_optimized = cleanTitle;

    return {
        ...input,
        core: {
            ...input.core,
            title_optimized
        }
    };
}

module.exports = runTitleEngine;
