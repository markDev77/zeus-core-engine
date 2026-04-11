const { generateTitle } = require("./src/core/title/title.engine");

try {
  const input = {
    title: "CABLE USB - ALTA CALIDAD!!"
  };

  const context = {};

  const result = generateTitle(input, context);

  console.log("CORE_TITLE_TEST_OK");
  console.log("INPUT:", input.title);
  console.log("OUTPUT:", result);
} catch (error) {
  console.error("CORE_TITLE_TEST_FAIL");
  console.error(error);
  process.exit(1);
}
