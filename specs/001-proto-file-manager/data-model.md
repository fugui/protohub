# 数据模型: Proto 文件管理系统

**功能**: Proto 文件管理系统
**日期**: 2026-01-31
**输入**: [spec.md](spec.md)

## 数据库设计 (SQLite)

### 表结构定义

#### 1. users (用户表)

存储系统用户信息和认证凭据。

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,           -- bcrypt 加密
  role TEXT NOT NULL CHECK(role IN ('developer', 'reviewer', 'admin')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

**字段说明**:
- `role`: 用户角色枚举，包括开发者（普通权限）、审核员（可审核文件）、管理员（完全权限）
- `password_hash`: 使用 bcrypt 加密的密码哈希值，不存储明文密码

---

#### 2. git_repos (Git 仓库配置表)

存储用户配置的 Git 仓库连接信息。

```sql
CREATE TABLE git_repos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,                    -- 仓库名称
  repo_url TEXT NOT NULL,                -- 仓库 URL (HTTPS 或 SSH)
  branch TEXT NOT NULL DEFAULT 'main',   -- 分支名称
  username TEXT,                          -- 认证用户名（可选）
  password TEXT,                           -- 认证密码/Token（明文存储）
  ssh_key TEXT,                             -- SSH 私钥（明文存储）
  last_sync_at TEXT,                         -- 最后同步时间
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_git_repos_user_id ON git_repos(user_id);
```

**字段说明**:
- `password` / `ssh_key`: 根据认证类型二选一，明文存储（符合用户选择的开发测试环境）
- `last_sync_at`: 记录最后成功同步的时间戳，便于用户了解数据新鲜度

**验证规则**:
- `repo_url` 必须符合 Git URL 格式（`https://` 或 `git@` 或 `ssh://` 开头）
- 每个用户最多配置 5 个仓库

---

#### 3. proto_files (Proto 文件表)

存储注册的 proto 文件元数据和内容引用。

```sql
CREATE TABLE proto_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,                 -- 文件名
  file_path TEXT NOT NULL,                 -- 本地文件系统路径
  package_name TEXT NOT NULL,               -- 包名
  subsystem_id INTEGER,                    -- 所属子系统 ID
  git_repo_id INTEGER,                     -- 关联的 Git 仓库 ID（可选）
  git_file_path TEXT,                       -- 仓库中的文件路径
  status TEXT NOT NULL CHECK(status IN ('draft', 'pending_review', 'approved', 'rejected')),
  current_version INTEGER NOT NULL DEFAULT 1,
  created_by INTEGER NOT NULL,               -- 创建人 ID
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  -- 文件锁相关字段
  locked INTEGER NOT NULL DEFAULT 0,           -- 是否被锁定 (0/1)
  locked_by INTEGER,                           -- 锁定用户 ID（如果已锁定）
  locked_at TEXT,                              -- 锁定时间戳
  FOREIGN KEY (subsystem_id) REFERENCES subsystems(id) ON DELETE SET NULL,
  FOREIGN KEY (git_repo_id) REFERENCES git_repos(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (locked_by) REFERENCES users(id)
);

CREATE INDEX idx_proto_files_status ON proto_files(status);
CREATE INDEX idx_proto_files_subsystem ON proto_files(subsystem_id);
CREATE INDEX idx_proto_files_git_repo ON proto_files(git_repo_id);
CREATE INDEX idx_proto_files_locked ON proto_files(locked);
```

**字段说明**:
- `file_path`: 指向 `storage/proto-files/<id>/current.proto` 的绝对或相对路径
- `status`: 状态流转: 草稿 → 待审核 → 已批准/已拒绝
- `locked` / `locked_by` / `locked_at`: 实现悲观锁机制
- `current_version`: 当前有效的版本号，对应 `file_versions` 表中的版本

**验证规则**:
- `filename` 格式必须符合规范: `{子系统}_{模块}_{版本}.proto`
- `package_name` 格式必须符合规范: `{子系统}.{模块}`
- 删除前检查依赖关系（`dependencies` 表中是否存在引用）

---

#### 4. file_versions (文件版本表)

存储 proto 文件的历史版本记录。

```sql
CREATE TABLE file_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id INTEGER NOT NULL,                 -- 关联的文件 ID
  version INTEGER NOT NULL,                  -- 版本号（自增）
  content TEXT NOT NULL,                     -- 文件内容
  file_path TEXT NOT NULL,                   -- 版本文件路径
  change_note TEXT,                           -- 变更说明
  modified_by INTEGER NOT NULL,                -- 修改人 ID
  modified_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (file_id) REFERENCES proto_files(id) ON DELETE CASCADE,
  FOREIGN KEY (modified_by) REFERENCES users(id)
);

CREATE INDEX idx_file_versions_file_id ON file_versions(file_id);
CREATE UNIQUE INDEX idx_file_versions_unique ON file_versions(file_id, version);
```

**字段说明**:
- `version`: 同一文件的版本号，从 1 开始递增
- `content`: 完整的 proto 文件文本内容（便于版本对比）
- `file_path`: 指向 `storage/proto-files/<file_id>/versions/v<version>.proto`

---

#### 5. reviews (审核记录表)

存储文件变更的审核记录。

```sql
CREATE TABLE reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id INTEGER NOT NULL,
  file_version_id INTEGER,                  -- 审核时的版本号（可选）
  submitted_by INTEGER NOT NULL,             -- 提交人 ID
  submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_by INTEGER,                          -- 审核人 ID（可选，待审核状态为 NULL）
  reviewed_at TEXT,                             -- 审核时间（可选）
  status TEXT NOT NULL CHECK(status IN ('pending_review', 'approved', 'rejected')),
  review_comment TEXT,                          -- 审核意见
  FOREIGN KEY (file_id) REFERENCES proto_files(id) ON DELETE CASCADE,
  FOREIGN KEY (file_version_id) REFERENCES file_versions(id),
  FOREIGN KEY (submitted_by) REFERENCES users(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_reviews_file_id ON reviews(file_id);
```

**字段说明**:
- `status`: 审核状态，流转: `pending_review` → `approved` / `rejected`
- `review_comment`: 审核员填写意见，批准时可写"通过"，拒绝时需填写拒绝原因
- 审核过程文件被修改时，审核继续按当前状态完成（用户选择的方案）

---

#### 6. check_reports (检查报告表)

存储对 proto 文件执行自动检查的结果。

```sql
CREATE TABLE check_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id INTEGER NOT NULL,
  file_version_id INTEGER,
  checked_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (file_id) REFERENCES proto_files(id) ON DELETE CASCADE,
  FOREIGN KEY (file_version_id) REFERENCES file_versions(id)
);

CREATE INDEX idx_check_reports_file_id ON check_reports(file_id);
```

---

#### 7. violations (违规项表)

存储检查发现的单个违规。

```sql
CREATE TABLE violations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id INTEGER NOT NULL,
  rule_type TEXT NOT NULL,                 -- 规则类型: 'naming_file', 'naming_package', 'naming_message', 'naming_field', 'naming_service', 'vocabulary', 'common_interface'
  severity TEXT NOT NULL CHECK(severity IN ('error', 'warning', 'info')),
  file_line INTEGER,                          -- 违规位置（行号）
  violation_message TEXT NOT NULL,             -- 违规描述
  suggestion TEXT,                           -- 修改建议
  FOREIGN KEY (report_id) REFERENCES check_reports(id) ON DELETE CASCADE
);

CREATE INDEX idx_violations_report_id ON violations(report_id);
CREATE INDEX idx_violations_rule_type ON violations(rule_type);
```

**字段说明**:
- `rule_type`: 违规类型枚举，对应不同的检查规则
- `severity`: 严重程度，影响用户优先级处理
  - `error`: 严重违规，必须修复才能提交审核
  - `warning`: 建议修复，不影响提交审核
  - `info`: 提示信息，仅供参考

---

#### 8. dependencies (依赖关系表)

存储 proto 文件间的依赖关系。

```sql
CREATE TABLE dependencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_file_id INTEGER NOT NULL,       -- 源文件 ID（import 的文件）
  target_file_id INTEGER NOT NULL,       -- 目标文件 ID（被 import 的文件）
  dependency_type TEXT NOT NULL DEFAULT 'import',  -- 依赖类型
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (source_file_id) REFERENCES proto_files(id) ON DELETE CASCADE,
  FOREIGN KEY (target_file_id) REFERENCES proto_files(id) ON DELETE CASCADE
);

CREATE INDEX idx_dependencies_source ON dependencies(source_file_id);
CREATE INDEX idx_dependencies_target ON dependencies(target_file_id);
```

**字段说明**:
- `dependency_type`: 目前只支持 `import` 类型，未来可扩展（如 `extends`, `implements`）
- 循环依赖检测: 通过 DFS 遍历此表检测

---

#### 9. subsystems (子系统表)

存储业务子系统信息。

```sql
CREATE TABLE subsystems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,              -- 子系统名称
  description TEXT,                         -- 描述
  owner TEXT,                               -- 负责人
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_subsystems_name ON subsystems(name);
```

---

#### 10. vocabulary_terms (常用词汇规范表)

存储领域术语字典。

```sql
CREATE TABLE vocabulary_terms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  term TEXT NOT NULL UNIQUE,               -- 标准术语
  description TEXT,                           -- 术语说明
  category TEXT,                             -- 分类（如: 'common', 'domain_specific'）
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_vocabulary_terms_category ON vocabulary_terms(category);
```

**验证规则**:
- 管理员可增删改术语（FR-019）
- 检查规则引擎使用此表验证 proto 文件中的术语使用

---

### 实体关系图

```
users (1) ──────────────── (*) git_repos
  │
  │
  ├── (1) ──────────────── (*) proto_files (1) ──────────────── (1) file_versions
  │                                 │                        │
  │                                 │                        │
  │                                 ├── (1) ──────────────── (1) reviews
  │                                 │
  │                                 ├── (1) ──────────────── (1) check_reports
  │                                 │                        │
  │                                 │                        └── (*) violations
  │                                 │
  │                                 └── (*) dependencies
  │
  └── (1) ──────────────── (*) reviews (作为审核员)

proto_files (*) ──────────────── (1) subsystems

subsystems (*) ──────────────── (*) proto_files (反向关系: 一个子系统包含多个文件)
```

---

## 数据验证规则

### 命名规范验证

| 规则类型 | 验证逻辑 | 正则表达式 |
|----------|----------|-----------|
| 文件名 | `{子系统}_{模块}_{版本}.proto` | `^[a-z0-9]+_[a-z0-9]+_[0-9]+\.[a-z]+$` |
| 包名 | `{子系统}.{模块}` | `^[a-z0-9]+\.[a-z0-9]+$` |
| 消息名 | PascalCase | `^[A-Z][a-zA-Z0-9]*$` |
| 字段名 | snake_case | `^[a-z][a-z0-9_]*$` |
| 服务名 | PascalCase + Service 后缀 | `^[A-Z][a-zA-Z0-9]*Service$` |

### 常用词汇规范验证

从 `vocabulary_terms` 表加载标准术语字典，检查 proto 文件中的消息名、字段名是否使用非标准术语。

**检查逻辑**:
1. 提取消息和字段名称
2. 对比 `vocabulary_terms.terms` 表
3. 匹配失败则生成 `vocabulary` 类型的违规项

### 公共接口抽取检查

**算法**:
1. 扫描所有 proto 文件的消息定义
2. 计算消息间相似度（字段重叠度）
3. 相似度 > 80% 且字段数 > 3，标记为重复定义
4. 生成抽取建议（合并为共享消息）

---

## 数据迁移策略

### 初始化脚本

```bash
# 创建数据库
sqlite3 storage/database/protohub.db < scripts/init_schema.sql

# 导入默认词汇表
sqlite3 storage/database/protohub.db < scripts/import_default_vocab.sql
```

### 版本管理

使用 SQLite WAL (Write-Ahead Logging) 模式提高并发性能:
```sql
PRAGMA journal_mode=WAL;
PRAGMA synchronous=NORMAL;
```

---

## 性能优化

### 索引策略

已在表结构中定义的索引:
- 外键自动索引
- 查询热点字段（`status`, `subsystem_id`, `file_id`）手动索引

### 查询优化

- **分页查询**: 文件列表使用 `LIMIT` + `OFFSET`
- **缓存**: 热门数据（如当前用户的文件列表）使用内存缓存（TTL 5 分钟）
- **批量操作**: Git 导入使用事务批量插入
