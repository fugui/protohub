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

  // 插入默认功能模块
  const functionModules = [
    { name: 'user_service', description: '用户服务功能模块', owner: '张三' },
    { name: 'order_service', description: '订单服务功能模块', owner: '李四' },
    { name: 'product_service', description: '商品服务功能模块', owner: '王五' },
  ];

  const insertFunctionModule = db.prepare(`
    INSERT OR IGNORE INTO function_modules (name, description, owner)
    VALUES (?, ?, ?)
  `);

  for (const module of functionModules) {
    insertFunctionModule.run(module.name, module.description, module.owner);
    console.log(`功能模块已创建: ${module.name}`);
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

  // 插入架构层级默认数据
  const layers = [
    { id: 1, name: '基础层', level: 1, color: '#fa8c16', description: '基础设施服务，如用户中心、消息中心、配置中心', sort_order: 1 },
    { id: 2, name: '领域层', level: 2, color: '#52c41a', description: '核心业务逻辑，如商品、订单、支付领域', sort_order: 2 },
    { id: 3, name: '应用层', level: 3, color: '#1890ff', description: '面向用户的服务，如订单服务、用户服务', sort_order: 3 },
  ];

  const insertLayer = db.prepare(`
    INSERT OR IGNORE INTO architecture_layers (id, name, level, color, description, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const layer of layers) {
    insertLayer.run(layer.id, layer.name, layer.level, layer.color, layer.description, layer.sort_order);
    console.log(`架构层级已创建: ${layer.name}`);
  }

  // 为现有功能模块设置默认层级
  db.prepare(`UPDATE function_modules SET layer_level = 3 WHERE layer_level IS NULL`).run();

  // 插入架构规则默认数据
  const rules = [
    { rule_type: 'layer_dependency', name: '层级依赖规则', description: '上层可以依赖下层，下层不能依赖上层', config: '{"allowSameLayer": true, "allowCrossLayer": "downOnly"}' },
    { rule_type: 'circular', name: '循环依赖检查', description: '禁止循环依赖', config: '{}' },
    { rule_type: 'cross_subsystem', name: '跨子系统依赖警告', description: '跨子系统的依赖给出警告', config: '{"warning": true}' },
  ];

  const insertRule = db.prepare(`
    INSERT OR IGNORE INTO architecture_rules (rule_type, name, description, config)
    VALUES (?, ?, ?, ?)
  `);

  for (const rule of rules) {
    insertRule.run(rule.rule_type, rule.name, rule.description, rule.config);
    console.log(`架构规则已创建: ${rule.name}`);
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
