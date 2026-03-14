/*
========================================
ZEUS IMPORT ROUTE
========================================
Recibe productos externos o de proveedores
y ejecuta el Import Pipeline completo
========================================
*/

const express = require("express");
const router = express.Router();

const { runImportPipeline } = require("../pipeline/importPipeline");

/*
========================================
POST /import/product
========================================
Entrada esperada:

{
"title": "...",
"description": "...",
"country": "US",
"platform": "shopify",
"store": {
   "shopDomain": "...",
   "accessToken": "...",
   "productId": "..."
},
"source": "usadrop | external"
}
========================================
*/

router.post("/product", async (req, res) => {

try {

const body = req.body || {};

const title = body.title || "";
const description = body.description || "";
const country = body.country || "US";

const platform = body.platform || null;
const store = body.store || null;

const origin = body.source || "external";

/*
========================================
INPUT PARA PIPELINE
========================================
*/

const pipelineInput = {

title,
description,

country,

platform,
store,

origin

};

/*
========================================
RUN PIPELINE
========================================
*/

const result = await runImportPipeline(pipelineInput);

/*
========================================
RESPONSE
========================================
*/

return res.json(result);

} catch (error) {

console.error("ZEUS IMPORT ERROR", error);

return res.status(500).json({

status: "error",
message: error.message

});

}

});

module.exports = router;
