// Entrada oficial ZEUS v2 alineada a blueprint

const { runOrchestration } = require('../orchestration');

function runApp(input) {
    return runOrchestration(input);
}

module.exports = {
    runApp
};
