const { transformProduct } = require("../services/productTransformer");
const { classifyProduct } = require("../services/categoryBrain");
const { mapRegionalCategory } = require("../services/regionalCategoryMapper");
const { syncProduct } = require("../services/syncEngine");

async function runImportPipeline(input) {

const transformed = transformProduct(input);

const classification = await classifyProduct({

title:transformed.title,
description:transformed.description,
tags:transformed.tags

});

const baseCategory = classification.category;
const confidence = classification.confidence;

const regionalCategory = mapRegionalCategory({

baseCategory,
storeProfile:input.storeProfile

});

const product = {

...transformed,

baseCategory,
regionalCategory,

category:baseCategory,

categoryConfidence:confidence

};

await syncProduct({

platform:input.platform,
store:input.store,
product

});

return {
product,
baseCategory,
regionalCategory,
confidence
};

}

module.exports = {
runImportPipeline
};
