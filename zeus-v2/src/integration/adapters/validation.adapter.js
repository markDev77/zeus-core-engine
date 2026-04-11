// validation.adapter.js

const runValidationModule = require('../../validation');

function runValidation(input) {
    return runValidationModule(input);
}

module.exports = {
    runValidation
};
