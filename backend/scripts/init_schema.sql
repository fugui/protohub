-- ProtoHub 数据库初始化脚本
-- 使用 SQLite 3.x

-- 启用 WAL 模式以提高并发性能
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;

-- 创建 users 表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('developer', 'reviewer', 'admin')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 创建 git_repos 表
CREATE TABLE IF NOT EXISTS git_repos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  repo_url TEXT NOT NULL,
  branch TEXT NOT NULL DEFAULT 'main',
  username TEXT,
  password TEXT,
  ssh_key TEXT,
  last_sync_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_git_repos_user_id ON git_repos(user_id);

-- 创建 function_modules 表（功能模块，原 subsystems）
CREATE TABLE IF NOT EXISTS function_modules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  owner TEXT,
  layer_level INTEGER DEFAULT 3,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_function_modules_name ON function_modules(name);

-- 创建 proto_files 表
CREATE TABLE IF NOT EXISTS proto_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  package_name TEXT NOT NULL,
  function_module_id INTEGER,
  git_repo_id INTEGER,
  git_file_path TEXT,
  status TEXT NOT NULL CHECK(status IN ('draft', 'pending_review', 'approved', 'rejected')),
  current_version INTEGER NOT NULL DEFAULT 1,
  created_by INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  locked INTEGER NOT NULL DEFAULT 0,
  locked_by INTEGER,
  locked_at TEXT,
  FOREIGN KEY (function_module_id) REFERENCES function_modules(id) ON DELETE SET NULL,
  FOREIGN KEY (git_repo_id) REFERENCES git_repos(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (locked_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_proto_files_status ON proto_files(status);
CREATE INDEX IF NOT EXISTS idx_proto_files_function_module ON proto_files(function_module_id);
CREATE INDEX IF NOT EXISTS idx_proto_files_git_repo ON proto_files(git_repo_id);
CREATE INDEX IF NOT EXISTS idx_proto_files_locked ON proto_files(locked);

-- 创建 file_versions 表
CREATE TABLE IF NOT EXISTS file_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id INTEGER NOT NULL,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  file_path TEXT NOT NULL,
  change_note TEXT,
  modified_by INTEGER NOT NULL,
  modified_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (file_id) REFERENCES proto_files(id) ON DELETE CASCADE,
  FOREIGN KEY (modified_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_file_versions_file_id ON file_versions(file_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_file_versions_unique ON file_versions(file_id, version);

-- 创建 reviews 表
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id INTEGER NOT NULL,
  file_version_id INTEGER,
  submitted_by INTEGER NOT NULL,
  submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_by INTEGER,
  reviewed_at TEXT,
  status TEXT NOT NULL CHECK(status IN ('pending_review', 'approved', 'rejected')),
  review_comment TEXT,
  FOREIGN KEY (file_id) REFERENCES proto_files(id) ON DELETE CASCADE,
  FOREIGN KEY (file_version_id) REFERENCES file_versions(id),
  FOREIGN KEY (submitted_by) REFERENCES users(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_file_id ON reviews(file_id);

-- 创建 check_reports 表
CREATE TABLE IF NOT EXISTS check_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id INTEGER NOT NULL,
  file_version_id INTEGER,
  checked_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (file_id) REFERENCES proto_files(id) ON DELETE CASCADE,
  FOREIGN KEY (file_version_id) REFERENCES file_versions(id)
);

CREATE INDEX IF NOT EXISTS idx_check_reports_file_id ON check_reports(file_id);

-- 创建 violations 表
CREATE TABLE IF NOT EXISTS violations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id INTEGER NOT NULL,
  rule_type TEXT NOT NULL CHECK(rule_type IN (
    'naming_file', 'naming_package', 'naming_message', 'naming_field',
    'naming_service', 'vocabulary', 'common_interface'
  )),
  severity TEXT NOT NULL CHECK(severity IN ('error', 'warning', 'info')),
  file_line INTEGER,
  violation_message TEXT NOT NULL,
  suggestion TEXT,
  FOREIGN KEY (report_id) REFERENCES check_reports(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_violations_report_id ON violations(report_id);
CREATE INDEX IF NOT EXISTS idx_violations_rule_type ON violations(rule_type);

-- 创建 dependencies 表
CREATE TABLE IF NOT EXISTS dependencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_file_id INTEGER,
  source_function_module_id INTEGER,
  target_file_id INTEGER NOT NULL,
  dependency_type TEXT NOT NULL DEFAULT 'import',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (source_file_id) REFERENCES proto_files(id) ON DELETE CASCADE,
  FOREIGN KEY (source_function_module_id) REFERENCES function_modules(id) ON DELETE CASCADE,
  FOREIGN KEY (target_file_id) REFERENCES proto_files(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dependencies_source_file ON dependencies(source_file_id);
CREATE INDEX IF NOT EXISTS idx_dependencies_source_func_mod ON dependencies(source_function_module_id);
CREATE INDEX IF NOT EXISTS idx_dependencies_target ON dependencies(target_file_id);

-- 创建 vocabulary_terms 表
CREATE TABLE IF NOT EXISTS vocabulary_terms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  term TEXT NOT NULL UNIQUE,
  description TEXT,
  description_en TEXT,
  category TEXT,
  aliases TEXT,
  similar_terms TEXT,
  domain TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_vocabulary_terms_category ON vocabulary_terms(category);
CREATE INDEX IF NOT EXISTS idx_vocabulary_terms_domain ON vocabulary_terms(domain);

-- ============================================
-- 架构全景图表结构
-- ============================================

-- 1. 架构层级定义表
CREATE TABLE IF NOT EXISTS architecture_layers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  level INTEGER NOT NULL UNIQUE,
  color TEXT,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. 子系统表（支持嵌套，原 subsystem_groups）
CREATE TABLE IF NOT EXISTS subsystems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  layer_id INTEGER,
  parent_subsystem_id INTEGER,
  color TEXT,
  position_x REAL,
  position_y REAL,
  width REAL DEFAULT 300,
  height REAL DEFAULT 200,
  collapsed BOOLEAN DEFAULT 0,
  columns INTEGER DEFAULT 3,
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (layer_id) REFERENCES architecture_layers(id),
  FOREIGN KEY (parent_subsystem_id) REFERENCES subsystems(id)
);

CREATE INDEX IF NOT EXISTS idx_subsystems_layer ON subsystems(layer_id);
CREATE INDEX IF NOT EXISTS idx_subsystems_parent ON subsystems(parent_subsystem_id);

-- 3. 子系统与功能模块关联表（原 subsystem_group_members）
CREATE TABLE IF NOT EXISTS subsystem_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subsystem_id INTEGER NOT NULL,
  function_module_id INTEGER NOT NULL,
  position_x REAL,
  position_y REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (subsystem_id) REFERENCES subsystems(id) ON DELETE CASCADE,
  FOREIGN KEY (function_module_id) REFERENCES function_modules(id) ON DELETE CASCADE,
  UNIQUE(subsystem_id, function_module_id)
);

CREATE INDEX IF NOT EXISTS idx_subsystem_members_subsystem ON subsystem_members(subsystem_id);
CREATE INDEX IF NOT EXISTS idx_subsystem_members_func_mod ON subsystem_members(function_module_id);

-- 4. 架构图节点位置表
CREATE TABLE IF NOT EXISTS architecture_node_positions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  node_id TEXT NOT NULL UNIQUE,
  node_type TEXT NOT NULL,
  x REAL NOT NULL,
  y REAL NOT NULL,
  width REAL DEFAULT 120,
  height REAL DEFAULT 60,
  layer_level INTEGER,
  parent_subsystem_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (parent_subsystem_id) REFERENCES subsystems(id)
);

CREATE INDEX IF NOT EXISTS idx_anp_layer ON architecture_node_positions(layer_level);
CREATE INDEX IF NOT EXISTS idx_anp_subsystem ON architecture_node_positions(parent_subsystem_id);

-- 5. 架构图快照表
CREATE TABLE IF NOT EXISTS architecture_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  data TEXT NOT NULL,
  is_default BOOLEAN DEFAULT 0,
  is_locked BOOLEAN DEFAULT 0,
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_arch_snapshots_default ON architecture_snapshots(is_default);

-- 6. 依赖验证规则表
CREATE TABLE IF NOT EXISTS architecture_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  config TEXT,
  is_enabled BOOLEAN DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
