
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'storage', 'database', 'protohub.db');
const db = new Database(dbPath);

console.log('Adding test data...');

// Add a file to user_service (id: 1)
const fileId = db.prepare(`
    INSERT INTO proto_files (filename, file_path, package_name, subsystem_id, status, created_by)
    VALUES ('user.proto', '/path/to/user.proto', 'user.package', 1, 'approved', 1)
`).run().lastInsertRowid;

console.log(`Added file with ID: ${fileId} to subsystem 1`);

// Add a dependency from user.proto (subsystem 1) to rh_rhl_1.proto (subsystem 3, id: 1)
db.prepare(`
    INSERT INTO dependencies (source_file_id, target_file_id, dependency_type)
    VALUES (?, 1, 'import')
`).run(fileId);

console.log('Added dependency: subsystem 1 -> subsystem 3');
