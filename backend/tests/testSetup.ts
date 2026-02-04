/**
 * 测试辅助函数
 */

import { getDatabase } from '../src/config/db';

let testSubsystemId: number | null = null;

/**
 * 设置测试数据库
 */
export async function setupTestDatabase(): Promise<void> {
  // 确保数据库连接存在
  const db = getDatabase();

  // 禁用外键约束以便删除数据
  db.pragma('foreign_keys = OFF');

  // 清理测试数据
  db.prepare('DELETE FROM proto_files WHERE created_by IN (SELECT id FROM users WHERE username LIKE ?)').run('testuser_%');
  // 删除 file versions
  db.prepare('DELETE FROM file_versions WHERE file_id IN (SELECT id FROM proto_files WHERE created_by IN (SELECT id FROM users WHERE username LIKE ?))').run('testuser_%');
  // 删除 reviews
  db.prepare('DELETE FROM reviews WHERE submitted_by IN (SELECT id FROM users WHERE username LIKE ?)').run('testuser_%');

  // 然后删除用户
  db.prepare('DELETE FROM users WHERE username LIKE ?').run('testuser_%');
  db.prepare('DELETE FROM users WHERE email LIKE ?').run('testuser_%@example.com');

  // 删除旧的测试子系统（如果存在）
  db.prepare('DELETE FROM subsystems WHERE name = ?').run('Test Subsystem');

  // WAL checkpoint to ensure data consistency
  db.pragma('wal_checkpoint(PASSIVE)');

  // 创建新的测试子系统
  const result = db.prepare(`
    INSERT INTO subsystems (name, description, owner, created_at)
    VALUES ('Test Subsystem', 'Test subsystem for integration tests', 'test_user', datetime('now'))
  `).run();

  // 获取子系统的ID
  testSubsystemId = Number(result.lastInsertRowid);

  // WAL checkpoint to ensure data is flushed
  db.pragma('wal_checkpoint(TRUNCATE)');

  // 重新启用外键约束
  db.pragma('foreign_keys = ON');

  // Force a fresh database connection to ensure data visibility
  // This ensures subsequent queries see the new subsystem
  const freshDb = getDatabase();
  const verify = freshDb.prepare('SELECT * FROM subsystems WHERE id = ?').get(testSubsystemId);
  if (!verify) {
    console.error('Subsystem not found after creation:', testSubsystemId);
  } else {
    console.log('Subsystem created successfully:', verify);
  }
}

/**
 * 清理测试数据库
 */
export async function teardownTestDatabase(): Promise<void> {
  // 重置子系统ID
  testSubsystemId = null;

  // 不关闭主数据库连接，以保持 repository 连接有效
  // 如果需要完全重置数据库，可以在全局配置中实现
}

/**
 * 获取测试子系统ID
 */
export function getTestSubsystemId(): number {
  if (testSubsystemId === null) {
    throw new Error('Test subsystem not initialized. Call setupTestDatabase() first.');
  }
  return testSubsystemId;
}
