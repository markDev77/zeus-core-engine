const { importUsadropProducts } = require("../importers/usadropImporter")

async function runUsadropSync() {

    try {

        console.log("STARTING USADROP IMPORT")

        const results = await importUsadropProducts(1, 20)

        console.log("USADROP IMPORT COMPLETE")

        return results

    } catch (err) {

        console.error("USADROP SYNC ERROR:", err)

    }

}

module.exports = {
    runUsadropSync
}