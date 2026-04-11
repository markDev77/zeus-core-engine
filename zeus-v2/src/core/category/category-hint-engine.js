function resolveCategoryHint(keywords) {

    if (!keywords || keywords.length === 0) return 'general';

    const joined = keywords.join(' ');

    // reglas simples v1
    if (joined.includes('shirt') || joined.includes('ropa')) {
        return 'apparel';
    }

    if (joined.includes('phone') || joined.includes('telefono')) {
        return 'electronics';
    }

    if (joined.includes('shoe') || joined.includes('zapato')) {
        return 'footwear';
    }

    return 'general';
}

function runCategoryHintEngine(input) {

    const keywords = input.core?.attributes?.keywords || [];

    const category_hint = resolveCategoryHint(keywords);

    return {
        ...input,
        core: {
            ...input.core,
            category_hint
        }
    };
}

module.exports = runCategoryHintEngine;
