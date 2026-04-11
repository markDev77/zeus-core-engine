const buildDescription = require('./description-builder');

function runDescriptionEngine(input) {

    const product = input.product || {};
    const title = product.title || '';

    const description_html_optimized = buildDescription(title);

    return {
        ...input,
        core: {
            ...input.core,
            description_html_optimized
        }
    };
}

module.exports = runDescriptionEngine;
