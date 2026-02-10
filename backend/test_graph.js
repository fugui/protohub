
const { getSubsystemDependencyGraph } = require('./src/services/dependencyService');
const { closeDatabase } = require('./src/config/db');

async function test() {
    try {
        const result = getSubsystemDependencyGraph();
        console.log('--- Graph Result ---');
        console.log(JSON.stringify(result, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        closeDatabase();
    }
}

test();
