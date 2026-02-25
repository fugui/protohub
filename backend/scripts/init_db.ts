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

  // ============================================
  // 插入完整的功能模块分层测试数据
  // ============================================

  // 1. 插入架构层级定义（前端层、服务层、基础设施层）
  const architectureLayers = [
    { id: 1, name: '前端应用层', level: 1, color: '#E6F7FF', description: '客户端应用，包括移动端、小程序、桌面端等', sort_order: 1 },
    { id: 2, name: '服务层', level: 2, color: '#F6FFED', description: '业务服务层，包含各类业务微服务', sort_order: 2 },
    { id: 3, name: '基础设施层', level: 3, color: '#FFF7E6', description: '底层基础设施和中间件服务', sort_order: 3 },
  ];

  const insertArchitectureLayer = db.prepare(`
    INSERT OR IGNORE INTO architecture_layers (id, name, level, color, description, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const layer of architectureLayers) {
    insertArchitectureLayer.run(layer.id, layer.name, layer.level, layer.color, layer.description, layer.sort_order);
    console.log(`架构层级已创建: ${layer.name}`);
  }

  // 2. 插入子系统定义
  const subsystems = [
    // 前端层子系统
    { id: 1, name: '移动端应用', layer_id: 1, color: '#1890FF', x: 50, y: 50, width: 400, height: 300, columns: 2 },
    { id: 2, name: '桌面端应用', layer_id: 1, color: '#52C41A', x: 500, y: 50, width: 300, height: 200, columns: 2 },
    // 服务层子系统
    { id: 3, name: '核心业务服务', layer_id: 2, color: '#FAAD14', x: 50, y: 400, width: 500, height: 350, columns: 3 },
    { id: 4, name: '支撑服务', layer_id: 2, color: '#EB2F96', x: 600, y: 400, width: 400, height: 250, columns: 2 },
    // 基础设施层子系统
    { id: 5, name: '存储与数据库', layer_id: 3, color: '#722ED1', x: 50, y: 800, width: 400, height: 300, columns: 2 },
    { id: 6, name: '中间件与运维', layer_id: 3, color: '#13C2C2', x: 500, y: 800, width: 450, height: 300, columns: 2 },
  ];

  const insertSubsystem = db.prepare(`
    INSERT OR IGNORE INTO subsystems (id, name, layer_id, color, position_x, position_y, width, height, collapsed, columns, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, datetime('now'), datetime('now'))
  `);

  for (const ss of subsystems) {
    insertSubsystem.run(ss.id, ss.name, ss.layer_id, ss.color, ss.x, ss.y, ss.width, ss.height, ss.columns);
    console.log(`子系统已创建: ${ss.name}`);
  }

  // 3. 插入功能模块（34个完整模块）
  const functionModules = [
    // 前端层 - 移动端应用 (id=1)
    { id: 1, name: 'iOS APP', description: 'iOS 原生应用客户端', owner: '移动开发团队', layer_level: 1 },
    { id: 2, name: 'Android APP', description: 'Android 原生应用客户端', owner: '移动开发团队', layer_level: 1 },
    { id: 3, name: 'WeChat APP', description: '微信小程序客户端', owner: '小程序开发团队', layer_level: 1 },
    { id: 4, name: 'Harmony APP', description: '鸿蒙 HarmonyOS 应用客户端', owner: '鸿蒙开发团队', layer_level: 1 },
    { id: 5, name: 'Flutter APP', description: '跨平台 Flutter 应用', owner: '移动开发团队', layer_level: 1 },
    // 前端层 - 桌面端应用 (id=2)
    { id: 6, name: 'Web Admin', description: 'Web 管理后台', owner: '前端开发团队', layer_level: 1 },
    { id: 7, name: 'Windows Client', description: 'Windows 桌面客户端', owner: '桌面开发团队', layer_level: 1 },
    { id: 8, name: 'macOS Client', description: 'macOS 桌面客户端', owner: '桌面开发团队', layer_level: 1 },
    // 服务层 - 核心业务服务 (id=3)
    { id: 9, name: 'Order Service', description: '订单服务 - 处理订单创建、查询、状态管理', owner: '交易团队', layer_level: 2 },
    { id: 10, name: 'User Service', description: '用户服务 - 用户注册、登录、信息管理', owner: '用户中台团队', layer_level: 2 },
    { id: 11, name: 'Product Service', description: '商品服务 - 商品管理、SKU、库存', owner: '商品团队', layer_level: 2 },
    { id: 12, name: 'Payment Service', description: '支付服务 - 支付处理、退款、对账', owner: '支付团队', layer_level: 2 },
    { id: 13, name: 'Inventory Service', description: '库存服务 - 库存扣减、预占、释放', owner: '供应链团队', layer_level: 2 },
    { id: 14, name: 'Cart Service', description: '购物车服务 - 购物车管理', owner: '交易团队', layer_level: 2 },
    { id: 15, name: 'Promotion Service', description: '营销服务 - 优惠券、满减、活动', owner: '营销团队', layer_level: 2 },
    { id: 16, name: 'Search Service', description: '搜索服务 - 商品搜索、推荐', owner: '算法团队', layer_level: 2 },
    // 服务层 - 支撑服务 (id=4)
    { id: 17, name: 'Notification Service', description: '通知服务 - 短信、邮件、Push', owner: '消息中台团队', layer_level: 2 },
    { id: 18, name: 'Auth Service', description: '认证服务 - SSO、OAuth、JWT 管理', owner: '安全团队', layer_level: 2 },
    { id: 19, name: 'File Service', description: '文件服务 - 文件上传、下载、处理', owner: '基础服务团队', layer_level: 2 },
    { id: 20, name: 'Log Service', description: '日志服务 - 日志收集、分析', owner: '运维团队', layer_level: 2 },
    { id: 21, name: 'Config Service', description: '配置服务 - 动态配置管理', owner: '基础服务团队', layer_level: 2 },
    // 基础设施层 - 存储与数据库 (id=5)
    { id: 22, name: 'MySQL Cluster', description: 'MySQL 主从集群 - 关系型数据存储', owner: 'DBA 团队', layer_level: 3 },
    { id: 23, name: 'Redis Cluster', description: 'Redis 集群 - 缓存、会话存储', owner: 'DBA 团队', layer_level: 3 },
    { id: 24, name: 'MongoDB', description: 'MongoDB - 文档型数据存储', owner: 'DBA 团队', layer_level: 3 },
    { id: 25, name: 'Elasticsearch', description: 'ES 集群 - 搜索引擎、日志分析', owner: '平台团队', layer_level: 3 },
    { id: 26, name: 'Object Storage', description: '对象存储 - 文件、图片、视频存储', owner: '平台团队', layer_level: 3 },
    { id: 27, name: 'TiDB', description: 'TiDB - 分布式 NewSQL 数据库', owner: 'DBA 团队', layer_level: 3 },
    // 基础设施层 - 中间件与运维 (id=6)
    { id: 28, name: 'Kubernetes', description: 'K8s 容器编排平台', owner: '运维团队', layer_level: 3 },
    { id: 29, name: 'Kafka', description: 'Kafka 消息队列 - 异步消息处理', owner: '中间件团队', layer_level: 3 },
    { id: 30, name: 'RabbitMQ', description: 'RabbitMQ - 消息队列服务', owner: '中间件团队', layer_level: 3 },
    { id: 31, name: 'Nginx Gateway', description: 'Nginx 网关 - 负载均衡、反向代理', owner: '运维团队', layer_level: 3 },
    { id: 32, name: 'Prometheus', description: 'Prometheus - 监控告警系统', owner: '运维团队', layer_level: 3 },
    { id: 33, name: 'Jaeger', description: 'Jaeger - 分布式链路追踪', owner: '运维团队', layer_level: 3 },
    { id: 34, name: 'Vault', description: 'Vault - 密钥管理服务', owner: '安全团队', layer_level: 3 },
  ];

  const insertFunctionModule = db.prepare(`
    INSERT OR IGNORE INTO function_modules (id, name, description, owner, layer_level, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `);

  for (const module of functionModules) {
    insertFunctionModule.run(module.id, module.name, module.description, module.owner, module.layer_level);
    console.log(`功能模块已创建: ${module.name}`);
  }

  // 4. 插入子系统与功能模块关联关系
  const subsystemMembers = [
    // 移动端应用子系统 (id=1)
    { subsystem_id: 1, function_module_id: 1, x: 20, y: 20 },   // iOS APP
    { subsystem_id: 1, function_module_id: 2, x: 150, y: 20 },  // Android APP
    { subsystem_id: 1, function_module_id: 3, x: 20, y: 100 },  // WeChat APP
    { subsystem_id: 1, function_module_id: 4, x: 150, y: 100 }, // Harmony APP
    { subsystem_id: 1, function_module_id: 5, x: 20, y: 180 },  // Flutter APP
    // 桌面端应用子系统 (id=2)
    { subsystem_id: 2, function_module_id: 6, x: 20, y: 20 },   // Web Admin
    { subsystem_id: 2, function_module_id: 7, x: 20, y: 80 },   // Windows Client
    { subsystem_id: 2, function_module_id: 8, x: 150, y: 80 },  // macOS Client
    // 核心业务服务子系统 (id=3)
    { subsystem_id: 3, function_module_id: 9, x: 20, y: 20 },    // Order Service
    { subsystem_id: 3, function_module_id: 10, x: 140, y: 20 },  // User Service
    { subsystem_id: 3, function_module_id: 11, x: 260, y: 20 },  // Product Service
    { subsystem_id: 3, function_module_id: 12, x: 20, y: 80 },   // Payment Service
    { subsystem_id: 3, function_module_id: 13, x: 140, y: 80 },  // Inventory Service
    { subsystem_id: 3, function_module_id: 14, x: 260, y: 80 },  // Cart Service
    { subsystem_id: 3, function_module_id: 15, x: 20, y: 140 },  // Promotion Service
    { subsystem_id: 3, function_module_id: 16, x: 140, y: 140 }, // Search Service
    // 支撑服务子系统 (id=4)
    { subsystem_id: 4, function_module_id: 17, x: 20, y: 20 },   // Notification Service
    { subsystem_id: 4, function_module_id: 18, x: 150, y: 20 },  // Auth Service
    { subsystem_id: 4, function_module_id: 19, x: 20, y: 80 },   // File Service
    { subsystem_id: 4, function_module_id: 20, x: 150, y: 80 },  // Log Service
    { subsystem_id: 4, function_module_id: 21, x: 20, y: 140 },  // Config Service
    // 存储与数据库子系统 (id=5)
    { subsystem_id: 5, function_module_id: 22, x: 20, y: 20 },   // MySQL Cluster
    { subsystem_id: 5, function_module_id: 23, x: 150, y: 20 },  // Redis Cluster
    { subsystem_id: 5, function_module_id: 24, x: 20, y: 80 },   // MongoDB
    { subsystem_id: 5, function_module_id: 25, x: 150, y: 80 },  // Elasticsearch
    { subsystem_id: 5, function_module_id: 26, x: 20, y: 140 },  // Object Storage
    { subsystem_id: 5, function_module_id: 27, x: 150, y: 140 }, // TiDB
    // 中间件与运维子系统 (id=6)
    { subsystem_id: 6, function_module_id: 28, x: 20, y: 20 },   // Kubernetes
    { subsystem_id: 6, function_module_id: 29, x: 150, y: 20 },  // Kafka
    { subsystem_id: 6, function_module_id: 30, x: 20, y: 80 },   // RabbitMQ
    { subsystem_id: 6, function_module_id: 31, x: 150, y: 80 },  // Nginx Gateway
    { subsystem_id: 6, function_module_id: 32, x: 20, y: 140 },  // Prometheus
    { subsystem_id: 6, function_module_id: 33, x: 150, y: 140 }, // Jaeger
    { subsystem_id: 6, function_module_id: 34, x: 20, y: 200 },  // Vault
  ];

  const insertMember = db.prepare(`
    INSERT OR IGNORE INTO subsystem_members (subsystem_id, function_module_id, position_x, position_y, created_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `);

  for (const member of subsystemMembers) {
    insertMember.run(member.subsystem_id, member.function_module_id, member.x, member.y);
  }
  console.log(`子系统成员关联已创建: ${subsystemMembers.length} 个`);

  // 5. 插入架构节点位置
  const nodePositions = [
    { node_id: 'subsystem-1', node_type: 'subsystem', x: 50, y: 50, width: 400, height: 300, layer_level: 1, parent_id: null },
    { node_id: 'subsystem-2', node_type: 'subsystem', x: 500, y: 50, width: 300, height: 200, layer_level: 1, parent_id: null },
    { node_id: 'subsystem-3', node_type: 'subsystem', x: 50, y: 400, width: 500, height: 350, layer_level: 2, parent_id: null },
    { node_id: 'subsystem-4', node_type: 'subsystem', x: 600, y: 400, width: 400, height: 250, layer_level: 2, parent_id: null },
    { node_id: 'subsystem-5', node_type: 'subsystem', x: 50, y: 800, width: 400, height: 300, layer_level: 3, parent_id: null },
    { node_id: 'subsystem-6', node_type: 'subsystem', x: 500, y: 800, width: 450, height: 300, layer_level: 3, parent_id: null },
  ];

  const insertNodePosition = db.prepare(`
    INSERT OR REPLACE INTO architecture_node_positions (node_id, node_type, x, y, width, height, layer_level, parent_subsystem_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  for (const node of nodePositions) {
    insertNodePosition.run(node.node_id, node.node_type, node.x, node.y, node.width, node.height, node.layer_level, node.parent_id);
  }
  console.log(`架构节点位置已创建: ${nodePositions.length} 个`);

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
