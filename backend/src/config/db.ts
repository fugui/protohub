/**
 * 数据库配置和连接管理
 * 使用 better-sqlite3 ORM
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据库文件路径
const DB_DIR = path.join(process.cwd(), '../../storage/database');
const DB_FILE = path.join(DB_DIR, 'protohub.db');

// 确保数据库目录存在
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

/**
 * 数据库连接实例
 */
let db: Database.Database | null = null;

/**
 * 获取数据库连接
 */
export function getDatabase(): Database.Database {
  if (!db) {
    db = new Database(DB_FILE);

    // 配置数据库
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('cache_size = -10000');
    db.pragma('page_size = 4096');

    // 启用外键约束
    db.pragma('foreign_keys = ON');
  }
  return db;
}

/**
 * 关闭数据库连接
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * 初始化数据库表结构
 */
export function initDatabase(): void {
  const database = getDatabase();

  // 读取并执行初始化脚本
  const schemaPath = path.join(__dirname, '../../scripts/init_schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  database.exec(schema);

  console.log('数据库初始化完成');
}

/**
 * 执行数据库迁移
 */
export function runMigrations(): void {
  const database = getDatabase();

  // 创建迁移记录表（如果不存在）
  database.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      executed_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // 读取迁移文件
  const migrationsDir = path.join(__dirname, '../../migrations');
  if (fs.existsSync(migrationsDir)) {
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      // 检查是否已执行
      const existing = database
        .prepare('SELECT id FROM migrations WHERE name = ?')
        .get(file);

      if (!existing) {
        const migration = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
        database.exec(migration);

        // 记录迁移
        database.prepare('INSERT INTO migrations (name) VALUES (?)').run(file);
        console.log(`迁移已执行: ${file}`);
      }
    }
  }
}

/**
 * 重置数据库（仅用于开发环境）
 */
export function resetDatabase(): void {
  if (process.env.NODE_ENV !== 'production') {
    const database = getDatabase();

    // 关闭当前连接
    closeDatabase();

    // 删除数据库文件
    if (fs.existsSync(DB_FILE)) {
      fs.unlinkSync(DB_FILE);
      // 删除 WAL 文件
      const walFile = DB_FILE + '-wal';
      const shmFile = DB_FILE + '-shm';
      if (fs.existsSync(walFile)) fs.unlinkSync(walFile);
      if (fs.existsSync(shmFile)) fs.unlinkSync(shmFile);
    }

    console.log('数据库已重置');
  } else {
    throw new Error('生产环境禁止重置数据库');
  }
}

// 进程退出时关闭数据库连接
process.on('exit', closeDatabase);
process.on('SIGINT', () => {
  closeDatabase();
  process.exit(0);
});
