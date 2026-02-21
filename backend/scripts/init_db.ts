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
    { 
      term: 'User', 
      description: '用户', 
      description_en: 'System user account',
      aliases: JSON.stringify(['user', 'account', 'member']),
      similar_terms: JSON.stringify(['customer', 'client']),
      domain: 'user',
      category: 'common' 
    },
    { 
      term: 'Order', 
      description: '订单', 
      description_en: 'Purchase order',
      aliases: JSON.stringify(['order', 'purchase']),
      similar_terms: JSON.stringify(['transaction']),
      domain: 'order',
      category: 'common' 
    },
    { 
      term: 'Product', 
      description: '商品', 
      description_en: 'Product or merchandise',
      aliases: JSON.stringify(['product', 'goods', 'item']),
      similar_terms: JSON.stringify(['sku', 'merchandise']),
      domain: 'product',
      category: 'common' 
    },
    { 
      term: 'ID', 
      description: '唯一标识符', 
      description_en: 'Unique identifier',
      aliases: JSON.stringify(['id', 'identifier', 'uuid']),
      similar_terms: null,
      domain: 'system',
      category: 'technical' 
    },
    { 
      term: 'Timestamp', 
      description: '时间戳', 
      description_en: 'Point in time',
      aliases: JSON.stringify(['timestamp', 'time', 'datetime']),
      similar_terms: JSON.stringify(['date', 'moment']),
      domain: 'system',
      category: 'technical' 
    },
    { 
      term: 'Status', 
      description: '状态', 
      description_en: 'Current state or condition',
      aliases: JSON.stringify(['status', 'state', 'condition']),
      similar_terms: JSON.stringify(['phase', 'stage']),
      domain: 'system',
      category: 'common' 
    },
    { 
      term: 'Request', 
      description: '请求', 
      description_en: 'API request',
      aliases: JSON.stringify(['request', 'req', 'ask']),
      similar_terms: JSON.stringify(['query', 'call']),
      domain: 'system',
      category: 'technical' 
    },
    { 
      term: 'Response', 
      description: '响应', 
      description_en: 'API response',
      aliases: JSON.stringify(['response', 'resp', 'reply']),
      similar_terms: JSON.stringify(['answer', 'result']),
      domain: 'system',
      category: 'technical' 
    },
    { 
      term: 'List', 
      description: '列表', 
      description_en: 'Collection of items',
      aliases: JSON.stringify(['list', 'array', 'collection']),
      similar_terms: JSON.stringify(['set', 'group']),
      domain: 'system',
      category: 'common' 
    },
    { 
      term: 'Detail', 
      description: '详情', 
      description_en: 'Detailed information',
      aliases: JSON.stringify(['detail', 'info', 'information']),
      similar_terms: JSON.stringify(['data', 'profile']),
      domain: 'system',
      category: 'common' 
    },
  ];

  const insertTerm = db.prepare(`
    INSERT OR IGNORE INTO vocabulary_terms 
    (term, description, description_en, aliases, similar_terms, domain, category, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  for (const term of vocabularyTerms) {
    insertTerm.run(
      term.term, 
      term.description, 
      term.description_en,
      term.aliases,
      term.similar_terms,
      term.domain,
      term.category
    );
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
