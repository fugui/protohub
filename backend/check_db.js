
const Database = require('better-sqlite3');
const path = require('path');

// backend/src/config/db.ts uses path.join(__dirname, '../../../storage/database/protohub.db')
// __dirname in that file is backend/src/config/
// So it goes backend/src/config/ -> backend/src/ -> backend/ -> root/ -> storage/database/protohub.db
// My script is in backend/, so it should be backend/../storage/database/protohub.db
const dbPath = path.join(__dirname, '..', 'storage', 'database', 'protohub.db');
const db = new Database(dbPath);

console.log('--- Dependencies ---');
const deps = db.prepare('SELECT * FROM dependencies').all();
console.log(JSON.stringify(deps, null, 2));

console.log('\n--- Proto Files ---');
const files = db.prepare('SELECT id, filename, subsystem_id FROM proto_files').all();
console.log(JSON.stringify(files, null, 2));

console.log('\n--- Subsystems ---');
const subsystems = db.prepare('SELECT id, name FROM subsystems').all();
console.log(JSON.stringify(subsystems, null, 2));
