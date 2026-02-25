# ProtoHub - Proto 文件管理系统

面向大规模团队的 Protobuf 接口文件管理系统，提供 proto 文件的注册、审核、版本管理及依赖关系可视化等核心功能。

## 项目概览

### 技术栈

- **后端**: Node.js 20+ + TypeScript 5.0+ + Express.js
- **前端**: React 18 + TypeScript 5.0+ + Ant Design 5
- **数据库**: SQLite 3.x (better-sqlite3)
- **其他**: Zustand 4 (状态管理), Axios 6 (HTTP 客户端)

### 项目结构

```
protohub/
├── backend/           # 后端服务
│   ├── src/
│   │   ├── models/      # 数据模型
│   │   ├── services/    # 业务逻辑
│   │   ├── api/         # API 路由和控制器
│   │   ├── middlewares/ # 中间件
│   │   ├── utils/       # 工具函数
│   │   └── config/      # 配置
│   ├── tests/
│   └── package.json
├── frontend/          # 前端应用
│   ├── src/
│   │   ├── pages/       # 页面组件
│   │   ├── components/  # 通用组件
│   │   ├── services/    # API 服务
│   │   ├── store/       # 状态管理
│   │   └── utils/       # 工具函数
│   └── package.json
├── shared/            # 共享类型定义
│   └── src/types/
├── storage/           # 本地存储
│   ├── database/
│   ├── proto-files/
│   └── git-cache/
└── specs/             # 设计文档
    └── 001-proto-file-manager/
```

## 快速开始

### 前置要求

- Node.js 20.0+
- npm 或 yarn

### 安装依赖

```bash
# 后端
cd backend
npm install

# 前端
cd frontend
npm install

# 共享类型
cd shared
npm install
```

### 初始化数据库

```bash
cd backend
npm run init-db
```

### 启动开发服务器

```bash
# 后端 (运行在 http://localhost:3000)
cd backend
npm run dev

# 前端 (运行在 http://localhost:5173)
cd frontend
npm run dev
```

### 默认账号

| 角色 | 用户名 | 密码 |
|------|--------|--------|
| 管理员 | admin | admin123 |
| 审核员 | reviewer | reviewer123 |
| 开发者 | developer | dev123 |

## 功能特性

### ✅ 已完成 (Phase 1-7)

**Phase 1: Setup (项目初始化)**
- [x] 项目目录结构
- [x] package.json 配置
- [x] TypeScript 编译配置
- [x] ESLint 和 Prettier
- [x] Git hooks (Husky)

**Phase 2: Foundational (核心基础设施)**
- [x] 数据模型 (User, ProtoFile, FileVersion, Review, CheckReport, Violation, Dependency, Subsystem, GitRepo, VocabularyTerm)
- [x] 认证中间件 (JWT)
- [x] 错误处理中间件
- [x] 日志中间件
- [x] 共享类型定义
- [x] BaseRepository 基类
- [x] Express 服务器配置

**Phase 3: User Story 1 - Proto 文件管理 (MVP)**
- [x] 用户认证和注册
- [x] 文件 CRUD 操作
- [x] 文件锁定机制 (30分钟超时)
- [x] 文件版本管理
- [x] Proto 文件解析 (regex-based)
- [x] Git 仓库配置
- [x] Git 文件导入
- [x] 一致性检查
- [x] 前端登录页面
- [x] 前端文件列表页面
- [x] 前端 API 服务层
- [x] 前端状态管理 (Zustand)

**Phase 4: User Story 2 - 审核流程管理**
- [x] 审核服务 (创建、批准、拒绝)
- [x] 审核工作台页面
- [x] 通知服务 (内存通知)
- [x] 邮件通知功能 (nodemailer)
- [x] 前端审核面板组件

**Phase 5: User Story 3 - 自动检查规则**
- [x] 检查规则引擎 (可插拔规则注册)
- [x] 命名规范检查 (文件名、包名、消息、字段、服务)
- [x] 词汇规范检查 (标准术语验证)
- [x] 公共接口抽取 (重复消息检测)
- [x] 检查报告服务
- [x] 词汇管理服务 (CRUD)
- [x] 相关 API 路由和控制器

**Phase 6: User Story 4 - 依赖关系可视化**
- [x] 依赖分析服务 (依赖图生成、循环依赖检测)
- [x] 影响范围分析服务
- [x] 依赖关系图页面 (ECharts 可视化)
- [x] ECharts DependencyGraph 组件
- [x] 子系统管理页面
- [x] 前端依赖 API 服务层

**Phase 7: Polish (完善和优化)**
- [x] 搜索功能 (后端 API)
- [x] 分页查询 (所有列表 API)
- [x] 前端 SearchBar 组件
- [x] 前端 Dashboard 页面
- [x] 前端 Loading 组件
- [x] 前端 ErrorMessage 组件

### 🚧 待实现 (剩余任务)

- [ ] 后端日志记录优化
- [ ] 后端性能优化 (数据库索引、查询缓存)
- [ ] 前端性能优化 (懒加载、虚拟滚动)
- [ ] 测试覆盖 (单元测试、集成测试)
- [ ] 文件上传组件 (FileUpload.tsx)
- [ ] 文件详情组件 (FileDetail.tsx)
- [ ] Proto 编辑器组件 (ProtoEditor.tsx)
- [ ] 检查报告页面 (CheckReportPage.tsx)
- [ ] 违规项列表组件 (ViolationList.tsx)
- [ ] 词汇管理页面 (VocabularyPage.tsx)
- [ ] 运行 quickstart.md 验证步骤
- [ ] 生成 OpenAPI 3.0 文档

## API 文档

API 端点遵循 RESTful 规范：

### 认证
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/register` - 用户注册

### 用户管理
- `GET /api/v1/users` - 获取用户列表
- `GET /api/v1/users/:id` - 获取用户详情
- `POST /api/v1/users` - 创建用户
- `PUT /api/v1/users/:id` - 更新用户
- `DELETE /api/v1/users/:id` - 删除用户

### 文件管理
- `GET /api/v1/files` - 获取文件列表
- `POST /api/v1/files` - 创建文件
- `GET /api/v1/files/:id` - 获取文件详情
- `PUT /api/v1/files/:id` - 更新文件
- `DELETE /api/v1/files/:id` - 删除文件
- `POST /api/v1/files/:id/lock` - 锁定文件
- `POST /api/v1/files/:id/unlock` - 解锁文件
- `POST /api/v1/files/:id/submit-review` - 提交审核
- `GET /api/v1/files/:id/versions` - 获取版本历史
- `GET /api/v1/files/:id/versions/diff` - 对比版本差异
- `POST /api/v1/files/:id/check` - 执行文件检查

### 审核管理
- `GET /api/v1/reviews` - 获取审核列表
- `GET /api/v1/reviews/:id` - 获取审核详情
- `POST /api/v1/reviews` - 创建审核
- `POST /api/v1/reviews/:id/approve` - 批准审核
- `POST /api/v1/reviews/:id/reject` - 拒绝审核

### Git 仓库管理
- `GET /api/v1/git-repos` - 获取 Git 仓库列表
- `POST /api/v1/git-repos` - 添加 Git 仓库
- `GET /api/v1/git-repos/:id` - 获取 Git 仓库详情
- `DELETE /api/v1/git-repos/:id` - 删除 Git 仓库
- `POST /api/v1/git-repos/:id/import` - 从 Git 导入文件
- `POST /api/v1/git-repos/:id/check-consistency` - 检查一致性

### 子系统管理
- `GET /api/v1/subsystems` - 获取子系统列表
- `GET /api/v1/subsystems/:id` - 获取子系统详情

### 依赖关系
- `GET /api/v1/dependencies/graph` - 获取依赖关系图
- `GET /api/v1/dependencies/:fileId/impact-analysis` - 获取影响分析

### 词汇管理
- `GET /api/v1/vocabulary` - 获取所有术语
- `GET /api/v1/vocabulary/terms` - 根据分类获取术语
- `POST /api/v1/vocabulary/terms` - 创建术语 (管理员)
- `PUT /api/v1/vocabulary/terms/:id` - 更新术语 (管理员)
- `DELETE /api/v1/vocabulary/terms/:id` - 删除术语 (管理员)

详细 API 规范请参考 `specs/001-proto-file-manager/contracts/api.yaml`

## 开发指南

### 代码规范

```bash
# 后端 lint
cd backend
npm run lint

# 前端 lint
cd frontend
npm run lint

# 代码格式化
npm run format
```

### Git 提交

项目已配置 Husky，提交代码时会自动运行 lint 检查。

提交信息格式建议：

```
<类型>: <描述>

<可选的详细说明>
```

类型：feat, fix, docs, style, refactor, test, chore

## 测试

```bash
# 后端单元测试
cd backend
npm run test:unit

# 后端集成测试
npm run test:integration

# 测试覆盖率
npm run test:coverage
```

## 部署

### 生产环境构建

```bash
# 后端
cd backend
npm run build

# 前端
cd frontend
npm run build
```

### 运行生产环境

```bash
# 后端
cd backend
npm start

# 前端
cd frontend
# 将 frontend/dist 部署到静态服务器
```

## 许可证

MIT License - see LICENSE file for details

## 联系方式

- 项目主页: [GitHub Repository](https://github.com/fugui/protohub)
- 问题反馈: [Issues](https://github.com/fugui/protohub/issues)
- 技术支持: support@protohub.com
