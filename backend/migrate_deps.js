
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'storage', 'database', 'protohub.db');
const db = new Database(dbPath);

console.log('Migrating dependencies table...');

db.transaction(() => {
    // 1. Create a map of file_id -> subsystem_id
    const fileSubsystems = db.prepare('SELECT id, subsystem_id FROM proto_files').all();
    const fileToSubMap = new Map();
    fileSubsystems.forEach(f => fileToSubMap.set(f.id, f.subsystem_id));

    // 2. Rename old table
    db.prepare('ALTER TABLE dependencies RENAME TO dependencies_old').run();

    // 3. Create new table
    db.prepare(`
        CREATE TABLE dependencies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_file_id INTEGER,
            source_subsystem_id INTEGER,
            target_file_id INTEGER NOT NULL,
            dependency_type TEXT NOT NULL DEFAULT 'import',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (source_file_id) REFERENCES proto_files(id) ON DELETE CASCADE,
            FOREIGN KEY (source_subsystem_id) REFERENCES subsystems(id) ON DELETE CASCADE,
            FOREIGN KEY (target_file_id) REFERENCES proto_files(id) ON DELETE CASCADE
        )
    `).run();

    // 4. Copy data
    const oldDeps = db.prepare('SELECT * FROM dependencies_old').all();
    const insert = db.prepare(`
        INSERT INTO dependencies (id, source_file_id, source_subsystem_id, target_file_id, dependency_type, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const dep of oldDeps) {
        const sourceSubId = dep.source_file_id ? fileToSubMap.get(dep.source_file_id) : null;
        insert.run(
            dep.id,
            dep.source_file_id || null,
            sourceSubId || null,
            dep.target_file_id,
            dep.dependency_type,
            dep.created_at
        );
    }

    // 5. Drop old table
    db.prepare('DROP TABLE dependencies_old').run();

    // 6. Indices
    db.prepare('CREATE INDEX idx_dependencies_source_file ON dependencies(source_file_id)').run();
    db.prepare('CREATE INDEX idx_dependencies_source_sub ON dependencies(source_subsystem_id)').run();
    db.prepare('CREATE INDEX idx_dependencies_target ON dependencies(target_file_id)').run();
})();

console.log('Migration completed successfully!');
db.close();
