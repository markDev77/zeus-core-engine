// Nuevo entrypoint oficial ZEUS v2

const orchestration = require('../orchestration');

function runApp(input) {
    return orchestration(input);
}

module.exports = {
    runApp
};
