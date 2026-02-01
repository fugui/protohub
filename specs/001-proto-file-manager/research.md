# 研究文档: Proto 文件管理系统

**功能**: Proto 文件管理系统
**日期**: 2026-01-31
**输入**: [spec.md](spec.md)

## 技术决策

### 1. 前后端 TypeScript 共享

**决策**: 前后端统一使用 TypeScript 5.0+，通过 `shared/` 目录共享类型定义

**理由**:
- **类型安全**: TypeScript 提供静态类型检查，前后端共享类型定义可以避免类型不匹配问题
- **开发效率**: 共享类型定义减少重复工作，API 变更时前后端同步更新
- **团队规模**: 100+ 人团队需要强类型系统确保代码质量和可维护性
- **工具支持**: TypeScript 生态成熟，前后端可共享工具链（ESLint、Prettier）

**替代方案**:
- ~~JavaScript + JSDoc~~: 类型安全性不足，大型团队难以维护
- ~~独立类型定义文件~~: 增加维护成本，容易同步失败

---

### 2. 数据库选择: SQLite

**决策**: 使用 SQLite 3.x 作为持久化存储

**理由**:
- **本地部署**: 用户指定使用本地文件存储，SQLite 是本地文件数据库的最佳选择
- **零配置**: 无需独立的数据库服务，降低运维复杂度
- **性能**: 对于 1000+ proto 文件的规模，SQLite 性能完全满足需求
- **事务支持**: 原子支持 ACID 事务，确保文件锁和审核流程的数据一致性
- **兼容性**: Node.js 原生支持 SQLite (better-sqlite3 库)

**替代方案**:
- ~~PostgreSQL/MySQL~~: 需要独立数据库服务，增加运维复杂度
- ~~文件系统直接存储~~: 查询和关系管理效率低，难以支持复杂查询

---

### 3. 文件存储策略

**决策**: 本地文件系统存储 proto 文件，数据库只存储元数据和内容路径

**理由**:
- **性能要求**: 支持大文件（10MB），数据库存储大文件会降低查询性能
- **灵活性**: 文件系统便于版本管理、diff 操作和导出
- **兼容性**: Git 导入操作直接对接文件系统，减少数据迁移

**存储结构**:
```
storage/
├── database/
│   └── protohub.db          # SQLite 数据库文件
├── proto-files/
│   ├── <file_id>/            # 按文件 ID 分目录
│   │   ├── current.proto     # 当前版本
│   │   └── versions/         # 历史版本
│   │       └── v1.proto, v2.proto, ...
├── git-cache/
│   └── <git_config_id>/     # Git 仓库临时缓存
└── uploads/                     # 临时上传目录
```

---

### 4. Proto 文件解析

**决策**: 使用 protobufjs 库进行 proto 文件解析

**理由**:
- **成熟稳定**: protobufjs 是 Protocol Buffers 的官方 JavaScript 解析器
- **TypeScript 支持**: 原生 TypeScript 类型定义，与项目类型体系兼容
- **功能完整**: 支持解析包名、消息、服务、枚举、import 依赖等
- **社区支持**: 文档完善，问题解决快速

**关键功能需求**:
- 提取 `package` 声明
- 解析 `message`、`enum`、`service` 定义
- 识别 `import` 语句建立依赖关系
- 验证语法正确性

---

### 5. 文件锁机制实现

**决策**: 使用数据库记录锁定状态 + 乐观锁 + 超时释放

**理由**:
- **数据一致性**: 悲观锁确保同一时间只有一个编辑者，避免并发冲突
- **容错处理**: 30 分钟超时释放防止死锁（如用户异常退出）
- **用户体验**: 锁定状态实时通知其他用户，减少等待时间

**数据模型**:
```
ProtoFile {
  ...
  locked: boolean
  lockedBy: userId | null
  lockedAt: timestamp | null
}
```

**超时策略**:
- 编辑时创建锁记录（记录 lockedAt 时间）
- 每次操作检查锁是否超时（当前时间 - lockedAt > 30 分钟）
- 超时自动释放锁，通知原锁定用户

---

### 6. 检查规则引擎设计

**决策**: 规则插件化架构，支持扩展

**理由**:
- **灵活性**: 不同检查规则可独立开发和测试
- **可配置性**: 符合宪法要求的规则可配置（管理员层面）
- **可维护性**: 新增规则不影响现有规则

**规则分类**:
1. **命名规范检查** (NamingRule)
   - 文件名格式: `{子系统}_{模块}_{版本}.proto`
   - 包名格式: `{子系统}.{模块}`
   - 消息命名: PascalCase
   - 字段命名: snake_case
   - 服务命名: PascalCase + Service

2. **常用词汇规范检查** (VocabularyRule)
   - 基于领域术语字典验证
   - 支持自定义词汇配置
   - 提供标准词汇建议

3. **公共接口抽取检查** (CommonInterfaceRule)
   - 识别重复消息定义
   - 分析字段相似度
   - 建议抽取公共接口

---

### 7. 依赖关系可视化

**决策**: 使用 ECharts 5+ 实现依赖关系图

**理由**:
- **性能**: 成熟图表库，支持 500+ 节点渲染
- **交互性**: 支持缩放、平移、节点选择、高亮
- **主题定制**: 支持中文界面适配
- **导出功能**: 支持 PNG 和 SVG 格式导出

**数据结构**:
```typescript
interface DependencyNode {
  id: string                    // 子系统或文件 ID
  label: string                  // 显示名称
  type: 'subsystem' | 'file'
  category: string                // 所属子系统
}

interface DependencyEdge {
  source: string                 // 源节点 ID
  target: string                 // 目标节点 ID
  type: 'import'                 // 依赖类型
}
```

**循环依赖检测算法**:
- 深度优先遍历 (DFS)
- 记录访问路径
- 检测到重复访问节点时标记为循环依赖
- 用红色高亮显示循环路径

---

### 8. Git 集成方案

**决策**: 使用 simple-git 或 isomorphic-git 库实现 Git 操作

**理由**:
- **Node.js 兼容**: 两个库都支持 Node.js 环境
- **功能完整**: 支持克隆、拉取、文件差异对比
- **缓存策略**: 本地缓存 Git 仓库，减少重复拉取

**流程设计**:
1. 用户配置 Git 仓库（URL、分支、认证凭据）
2. 系统克隆/拉取仓库到 `storage/git-cache/<config_id>/`
3. 扫描 `*.proto` 文件
4. 批量导入到系统
5. 一致性检查：对比仓库文件与本地文件，生成差异报告

**认证支持**:
- HTTPS: 使用用户名/密码或 token
- SSH: 使用 SSH 密钥（明文存储）
- 凭据加密: ~~不采用~~（用户选择明文存储用于开发测试环境）

---

### 9. API 设计规范

**决策**: RESTful API + OpenAPI 3.0 规范

**理由**:
- **宪法要求**: 原则三要求 RESTful API 必须提前采用 OpenAPI 3.0 规范定义
- **前后端分离**: RESTful API 是前后端分离架构的最佳实践
- **工具支持**: Swagger/OpenAPI 工具链成熟，便于文档生成和测试

**API 资源结构**:
```
/api/v1/
├── /auth                    # 认证
├── /users                   # 用户管理
├── /files                   # Proto 文件 CRUD
├── /versions                # 版本历史
├── /reviews                 # 审核流程
├── /checks                  # 检查报告
├── /dependencies             # 依赖关系
├── /git-repos               # Git 仓库配置
└── /subsystems              # 子系统管理
```

**状态码规范**:
- 200 OK: 请求成功
- 201 Created: 资源创建成功
- 400 Bad Request: 请求参数错误
- 401 Unauthorized: 未认证
- 403 Forbidden: 无权限
- 404 Not Found: 资源不存在
- 409 Conflict: 资源冲突（如文件锁定）
- 422 Unprocessable Entity: 业务规则校验失败
- 500 Internal Server Error: 服务器错误

---

### 10. 前端技术栈

**决策**: React 18 + TypeScript + Ant Design 5 + Zustand 4

**理由**:
- **生态成熟**: React 是主流前端框架，团队学习成本低
- **UI 组件**: Ant Design 5 提供完整的中文组件库，开箱即用
- **状态管理**: Zustand 是轻量级状态管理库，适合中型应用
- **类型安全**: TypeScript 确保前后端类型一致性

**前端页面结构**:
```
src/pages/
├── LoginPage/              # 登录页
├── FileListPage/           # 文件列表
├── FileDetailPage/         # 文件详情
├── ReviewPage/             # 审核工作台
├── CheckReportPage/         # 检查报告
├── DependencyGraphPage/     # 依赖关系图
├── GitImportPage/          # Git 导入
└── SettingsPage/           # 系统设置
```

---

## 技术风险与缓解措施

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| SQLite 文件大小超过 100MB | 查询性能下降 | 定期归档历史版本，限制单个数据库文件大小 |
| 文件锁超时未释放 | 用户无法编辑 | 30 分钟超时自动释放，提供管理员强制解锁功能 |
| Git 仓库连接失败 | 导入功能不可用 | 提供重试机制，记录详细错误日志 |
| 依赖关系图节点过多 | 页面渲染卡顿 | 实现分页和懒加载，初始只渲染 100 个节点 |
| 前后端类型不同步 | 运行时错误 | 共享 `shared/` 类型目录，CI 检查类型一致性 |

---

## 依赖库清单

### 后端
- `express@4.18+` - Web 框架
- `better-sqlite3@9.2+` - SQLite ORM
- `protobufjs@7.2+` - Proto 文件解析
- `bcrypt@5.1+` - 密码加密
- `jsonwebtoken@9.0+` - JWT 认证
- `multer@1.4+` - 文件上传
- `simple-git@3.20+` 或 `isomorphic-git@1.25+` - Git 操作

### 前端
- `react@18.2+` - UI 框架
- `react-router-dom@6.20+` - 路由
- `antd@5.12+` - UI 组件库
- `zustand@4.4+` - 状态管理
- `echarts@5.4+` - 图表库
- `axios@1.6+` - HTTP 客户端
- `dayjs@1.11+` - 日期处理

### 开发工具
- `typescript@5.3+` - 编译器
- `vite@5.0+` - 构建工具
- `jest@29.7+` - 测试框架
- `@testing-library/react@14.0+` - React 测试
- `eslint@8.50+` - 代码检查
- `prettier@3.1+` - 代码格式化
- `husky@8.0+` - Git hooks
