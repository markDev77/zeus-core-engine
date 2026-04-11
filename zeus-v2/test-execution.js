const { executePipeline } = require("./src/execution/execution-pipeline");

(async () => {
  const result = await executePipeline({
    product: {
      title: "CABLE USB - ALTA CALIDAD!!",
      description_html: "<p>Test</p>",
      images: [],
      variants: [],
      category: null,
      source: "test"
    }
  });

  console.log("RESULT:");
  console.log(result.product.title);
})();
