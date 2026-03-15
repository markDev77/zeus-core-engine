/*
========================================
ZEUS SHOPIFY CONNECTOR
========================================
Recibe webhook Shopify
Normaliza producto
Envía a ZEUS Import Pipeline
========================================
*/

const fetch = require("node-fetch");

const normalizeShopifyProduct = require("./shopifyPayloadNormalizer");

const { isZeusUpdate } = require("../security/loopProtection");

const ZEUS_CORE_URL =
process.env.ZEUS_CORE_URL ||
"http://localhost:10000";


async function processShopifyProduct(payload){

try{

console.log("SHOPIFY CONNECTOR START");


/*
LOOP PROTECTION
*/

if(isZeusUpdate(payload)){

console.log("ZEUS LOOP DETECTED");

return {
status:"ignored",
reason:"zeus-update"
};

}


/*
NORMALIZE PAYLOAD
*/

const normalizedProduct =
normalizeShopifyProduct(payload);


/*
BUILD PIPELINE INPUT
*/

const pipelineInput = {

title: normalizedProduct.title,

description: normalizedProduct.description,

tags: normalizedProduct.tags,

platform: "shopify",

store: {

shopDomain:
payload.shop_domain ||
process.env.SHOPIFY_STORE,

accessToken:
process.env.SHOPIFY_ACCESS_TOKEN,

productId: payload.id

},

storeProfile: {

region:"US",
language:"en"

},

source:"shopify"

};


/*
SEND TO PIPELINE
*/

const response =
await fetch(
`${ZEUS_CORE_URL}/import/product`,
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify(pipelineInput)
}
);


const result =
await response.json();


console.log(
"ZEUS PIPELINE RESULT",
result
);


return {

status:"processed",
productId:payload.id

};


}
catch(err){

console.error(
"SHOPIFY CONNECTOR ERROR",
err
);

return{

status:"error",
message:err.message

};

}

}


module.exports={
processShopifyProduct
};
