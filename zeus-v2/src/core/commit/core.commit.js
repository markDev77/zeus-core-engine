function commitCoreToProduct(output) {
    if (!output) return output;

    // asegurar estructura
    output.product = output.product || {};
    output.core = output.core || {};

    // TITLE
    if (output.core.normalized_title) {
        output.product.title = output.core.normalized_title;
    }

    // DESCRIPTION
    if (output.core.normalized_description_html) {
        output.product.description_html = output.core.normalized_description_html;
    }

    return output;
}

module.exports = commitCoreToProduct;
