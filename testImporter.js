const { importUsadropProducts } = require("./src/importers/usadropImporter");

async function run() {

    console.log("STARTING USADROP IMPORT TEST");

    const results = await importUsadropProducts(1, 3);

    console.log("IMPORT RESULTS:");

    console.log(JSON.stringify(results, null, 2));

}

run();