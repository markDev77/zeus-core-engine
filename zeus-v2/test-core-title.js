const runCore = require('./src/core');

const input = {
    product: {
        id: "123",
        title: "CABLE USB - ALTA CALIDAD!!",
        description_html: "<p>Test</p>",
        images: [],
        variants: [],
        category: null,
        source: "test"
    }
};

const result = runCore(input);

console.log(JSON.stringify(result, null, 2));
