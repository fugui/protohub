-- ============================================
-- 架构全景图重构 - 数据库迁移
-- Phase 1: 新增表结构
-- ============================================

-- 0. 为现有子系统表添加层级字段（如果不存在）
ALTER TABLE subsystems ADD COLUMN layer_level INTEGER;

-- 为现有子系统设置默认层级（应用层=3）
UPDATE subsystems SET layer_level = 3 WHERE layer_level IS NULL;

-- 1. 架构层级定义表
CREATE TABLE IF NOT EXISTS architecture_layers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,              -- 层名称：应用层/领域层/基础层
  level INTEGER NOT NULL UNIQUE,   -- 层级：1=基础层，2=领域层，3=应用层
  color TEXT,                      -- 显示颜色
  description TEXT,                -- 层级描述
  sort_order INTEGER DEFAULT 0,    -- 排序
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 插入默认层级
INSERT OR IGNORE INTO architecture_layers (id, name, level, color, description, sort_order) VALUES
(1, '基础层', 1, '#fa8c16', '基础设施服务，如用户中心、消息中心、配置中心', 1),
(2, '领域层', 2, '#52c41a', '核心业务逻辑，如商品、订单、支付领域', 2),
(3, '应用层', 3, '#1890ff', '面向用户的服务，如订单服务、用户服务', 3);

-- 2. 子系统分组表（支持嵌套）
CREATE TABLE IF NOT EXISTS subsystem_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,              -- 组名
  layer_id INTEGER,                -- 所属层级
  parent_group_id INTEGER,         -- 父分组ID（支持嵌套）
  color TEXT,                      -- 分组颜色
  
  -- 位置信息（拖拽保存）
  position_x REAL,                 -- 绝对位置X
  position_y REAL,                 -- 绝对位置Y
  width REAL DEFAULT 300,          -- 宽度
  height REAL DEFAULT 200,         -- 高度
  
  -- 状态
  collapsed BOOLEAN DEFAULT 0,     -- 是否折叠
  
  -- 关联
  created_by INTEGER,              -- 创建人
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  
  FOREIGN KEY (layer_id) REFERENCES architecture_layers(id),
  FOREIGN KEY (parent_group_id) REFERENCES subsystem_groups(id)
);

CREATE INDEX IF NOT EXISTS idx_subsystem_groups_layer ON subsystem_groups(layer_id);
CREATE INDEX IF NOT EXISTS idx_subsystem_groups_parent ON subsystem_groups(parent_group_id);

-- 3. 子系统与分组关联表
CREATE TABLE IF NOT EXISTS subsystem_group_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL,
  subsystem_id INTEGER NOT NULL,
  
  -- 在组内的相对位置（可选，用于组内布局）
  position_x REAL,
  position_y REAL,
  
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  
  FOREIGN KEY (group_id) REFERENCES subsystem_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (subsystem_id) REFERENCES subsystems(id) ON DELETE CASCADE,
  UNIQUE(group_id, subsystem_id)  -- 防止重复关联
);

CREATE INDEX IF NOT EXISTS idx_sgm_group ON subsystem_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_sgm_subsystem ON subsystem_group_members(subsystem_id);

-- 4. 子系统层级归属（扩展子系统表）
-- 注意：如果 subsystems 表已存在，使用 ALTER TABLE 添加列
-- 这里先检查列是否存在，然后添加

-- 5. 架构图节点位置表（保存每个节点的精确位置）
CREATE TABLE IF NOT EXISTS architecture_node_positions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  node_id TEXT NOT NULL UNIQUE,    -- 节点ID：sub_123 或 group_456
  node_type TEXT NOT NULL,         -- 'subsystem' 或 'group'
  
  -- 位置
  x REAL NOT NULL,
  y REAL NOT NULL,
  width REAL DEFAULT 120,
  height REAL DEFAULT 60,
  
  -- 层级信息（用于快速过滤）
  layer_level INTEGER,
  
  -- 所属分组
  parent_group_id INTEGER,
  
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  
  FOREIGN KEY (parent_group_id) REFERENCES subsystem_groups(id)
);

CREATE INDEX IF NOT EXISTS idx_anp_layer ON architecture_node_positions(layer_level);
CREATE INDEX IF NOT EXISTS idx_anp_group ON architecture_node_positions(parent_group_id);

-- 6. 架构图快照表（保存多个版本）
CREATE TABLE IF NOT EXISTS architecture_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,              -- 版本名称，如"v1.0架构"
  description TEXT,                -- 描述
  data TEXT NOT NULL,              -- JSON：完整的节点位置、分组信息
  is_default BOOLEAN DEFAULT 0,    -- 是否默认显示
  is_locked BOOLEAN DEFAULT 0,     -- 是否锁定（防止修改）
  created_by INTEGER,              -- 创建人
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_arch_snapshots_default ON architecture_snapshots(is_default);

-- 7. 依赖验证规则表（可选，用于动态配置规则）
CREATE TABLE IF NOT EXISTS architecture_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_type TEXT NOT NULL,         -- 'layer_dependency', 'circular', 'cross_group'
  name TEXT NOT NULL,              -- 规则名称
  description TEXT,                -- 规则描述
  config TEXT,                     -- JSON配置
  is_enabled BOOLEAN DEFAULT 1,    -- 是否启用
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 插入默认规则
INSERT OR IGNORE INTO architecture_rules (rule_type, name, description, config) VALUES
('layer_dependency', '层级依赖规则', '上层可以依赖下层，下层不能依赖上层', '{"allowSameLayer": true, "allowCrossLayer": "downOnly"}'),
('circular', '循环依赖检查', '禁止循环依赖', '{}'),
('cross_group', '跨组依赖警告', '跨分组的依赖给出警告', '{"warning": true}');
