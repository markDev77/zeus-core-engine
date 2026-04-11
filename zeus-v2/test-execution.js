const { runExecutionCoordinator } = require('./src/execution/coordinator/execution-coordinator');

const input = {
    product: {
        id: "123",
        title: "CABLE USB - ALTA CALIDAD!!",
        description_html: "<p>Test</p>",
        images: [],
        variants: [],
        category: null,
        source: "test"
    },
    context: {}
};

const result = runExecutionCoordinator(input);

console.log(JSON.stringify(result, null, 2));
