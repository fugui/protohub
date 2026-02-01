/**
 * 数据库初始化脚本
 * 运行: npm run init-db
 */

import { initDatabase, runMigrations, getDatabase } from '../src/config/db';
import bcrypt from 'bcrypt';

function insertDefaultData() {
  const db = getDatabase();

  // 插入默认用户
  const users = [
    {
      username: 'admin',
      email: 'admin@protohub.com',
      password_hash: bcrypt.hashSync('admin123', 10),
      role: 'admin',
    },
    {
      username: 'reviewer',
      email: 'reviewer@protohub.com',
      password_hash: bcrypt.hashSync('reviewer123', 10),
      role: 'reviewer',
    },
    {
      username: 'developer',
      email: 'developer@protohub.com',
      password_hash: bcrypt.hashSync('dev123', 10),
      role: 'developer',
    },
  ];

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (username, email, password_hash, role)
    VALUES (?, ?, ?, ?)
  `);

  for (const user of users) {
    insertUser.run(user.username, user.email, user.password_hash, user.role);
    console.log(`用户已创建: ${user.username}`);
  }

  // 插入默认子系统
  const subsystems = [
    { name: 'user_service', description: '用户服务子系统', owner: '张三' },
    { name: 'order_service', description: '订单服务子系统', owner: '李四' },
    { name: 'product_service', description: '商品服务子系统', owner: '王五' },
  ];

  const insertSubsystem = db.prepare(`
    INSERT OR IGNORE INTO subsystems (name, description, owner)
    VALUES (?, ?, ?)
  `);

  for (const subsystem of subsystems) {
    insertSubsystem.run(subsystem.name, subsystem.description, subsystem.owner);
    console.log(`子系统已创建: ${subsystem.name}`);
  }

  // 插入默认词汇表
  const vocabularyTerms = [
    { term: '用户', description: '使用 User', category: 'common' },
    { term: '订单', description: '使用 Order', category: 'common' },
    { term: '商品', description: '使用 Product', category: 'common' },
    { term: 'ID', description: '使用 id 或 identifier', category: 'common' },
    { term: '时间戳', description: '使用 timestamp 或 created_at', category: 'common' },
    { term: '状态', description: '使用 status', category: 'common' },
    { term: '请求', description: '使用 Request', category: 'common' },
    { term: '响应', description: '使用 Response', category: 'common' },
    { term: '列表', description: '使用 List', category: 'common' },
    { term: '详情', description: '使用 Detail', category: 'common' },
  ];

  const insertTerm = db.prepare(`
    INSERT OR IGNORE INTO vocabulary_terms (term, description, category)
    VALUES (?, ?, ?)
  `);

  for (const term of vocabularyTerms) {
    insertTerm.run(term.term, term.description, term.category);
    console.log(`词汇已添加: ${term.term}`);
  }

  console.log('\n默认数据插入完成');
}

async function main() {
  console.log('开始初始化数据库...\n');

  try {
    // 初始化表结构
    initDatabase();

    // 运行迁移
    runMigrations();

    // 插入默认数据
    insertDefaultData();

    console.log('\n数据库初始化成功!');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  }
}

main();
