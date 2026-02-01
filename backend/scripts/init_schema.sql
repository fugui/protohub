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

-- 创建 subsystems 表
CREATE TABLE IF NOT EXISTS subsystems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  owner TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_subsystems_name ON subsystems(name);

-- 创建 proto_files 表
CREATE TABLE IF NOT EXISTS proto_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  package_name TEXT NOT NULL,
  subsystem_id INTEGER,
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
  FOREIGN KEY (subsystem_id) REFERENCES subsystems(id) ON DELETE SET NULL,
  FOREIGN KEY (git_repo_id) REFERENCES git_repos(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (locked_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_proto_files_status ON proto_files(status);
CREATE INDEX IF NOT EXISTS idx_proto_files_subsystem ON proto_files(subsystem_id);
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
  source_file_id INTEGER NOT NULL,
  target_file_id INTEGER NOT NULL,
  dependency_type TEXT NOT NULL DEFAULT 'import',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (source_file_id) REFERENCES proto_files(id) ON DELETE CASCADE,
  FOREIGN KEY (target_file_id) REFERENCES proto_files(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dependencies_source ON dependencies(source_file_id);
CREATE INDEX IF NOT EXISTS idx_dependencies_target ON dependencies(target_file_id);

-- 创建 vocabulary_terms 表
CREATE TABLE IF NOT EXISTS vocabulary_terms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  term TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_vocabulary_terms_category ON vocabulary_terms(category);
