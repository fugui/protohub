# 快速开始指南: Proto 文件管理系统

**功能**: Proto 文件管理系统
**日期**: 2026-01-31

## 前置要求

- Node.js 20.0+
- npm 或 yarn 包管理器
- Git（可选，用于 Git 导入功能）
- 现代 Web 浏览器（Chrome, Firefox, Safari, Edge 最新版本）
- 终端（用于后端开发）

## 本地开发环境搭建

### 1. 克隆项目

```bash
git clone https://github.com/your-org/protohub.git
cd protohub
git checkout 001-proto-file-manager
```

### 2. 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install

# 安装共享类型定义
cd ../shared
npm install
```

### 3. 初始化数据库

```bash
# 创建存储目录
mkdir -p storage/database storage/proto-files storage/git-cache storage/uploads

# 初始化 SQLite 数据库
cd backend
npm run init-db

# 导入默认词汇表
sqlite3 storage/database/protohub.db < scripts/import_default_vocab.sql
```

### 4. 启动开发服务器

**启动后端服务**:
```bash
cd backend
npm run dev
# 后端服务运行在 http://localhost:3000
# API 文档: http://localhost:3000/api/v1/docs
```

**启动前端应用**:
```bash
cd frontend
npm run dev
# 前端应用运行在 http://localhost:5173
```

### 5. 访问应用

- 打开浏览器访问: http://localhost:5173
- 使用以下默认账号登录:
  - 管理员: `admin / admin123`
  - 审核员: `reviewer / reviewer123`
  - 开发者: `developer / dev123`

## 基本操作流程

### 用户故事 1: 注册第一个 Proto 文件

**目标**: 创建并管理一个 proto 文件

**步骤**:
1. 登录系统（使用开发者账号）
2. 创建子系统（如果不存在）
   - 访问 `子系统管理` 页面
   - 点击"创建子系统"
   - 输入子系统名称（如: "user_service"）
3. 上传 proto 文件
   - 访问 `文件管理` 页面
   - 点击"上传文件"按钮
   - 选择 proto 文件（如: `user_service_model_v1.proto`）
   - 选择所属子系统
   - 点击"上传"
4. 查看文件详情
   - 在文件列表中点击刚上传的文件
   - 查看文件内容、包名、消息定义
5. 编辑文件（可选）
   - 点击"编辑"按钮获取文件锁
   - 修改文件内容
   - 保存并释放文件锁

**预期结果**: 文件成功上传，在文件列表中显示

---

### 用户故事 2: 提交文件审核

**目标**: 将文件变更提交审核

**步骤**:
1. 编辑 proto 文件并保存
2. 点击"提交审核"按钮
3. 填写变更说明（如: "添加用户消息定义"）
4. 确认提交
5. 查看审核状态（在文件详情页）
   - 状态变为"待审核"

**预期结果**: 审核请求创建，审核员可以在审核工作台中看到

---

### 用户故事 3: 审核文件

**目标**: 批准或拒绝文件变更

**步骤**:
1. 使用审核员账号登录
2. 访问 `审核工作台`页面
3. 查看待审核列表
4. 点击某个审核请求
5. 查看文件内容和变更
6. 点击"批准"或"拒绝"
7. 如果拒绝，填写拒绝原因
8. 提交审核结果

**预期结果**: 文件状态更新为"已批准"或"已拒绝"，提交人收到通知

---

### 用户故事 4: 运行自动检查

**目标**: 查看命名规范和词汇规范检查结果

**步骤**:
1. 上传或编辑 proto 文件
2. 系统自动执行检查规则
3. 查看检查报告
   - 访问 `检查报告`页面
   - 查看违规项列表
   - 点击某个违规项查看详细信息和修改建议
4. 修复违规项
   - 修改文件内容
   - 重新保存

**预期结果**: 所有违规项显示在检查报告中，修复后可重新提交审核

---

### 用户故事 5: 查看依赖关系图

**目标**: 可视化各子系统间的接口依赖

**步骤**:
1. 访问 `依赖关系图`页面
2. 查看子系统拓扑图
   - 节点表示子系统或文件
   - 连线表示 import 依赖关系
3. 交互操作
   - 点击某个节点高亮显示其依赖
   - 拖拽和缩放查看细节
4. 查看循环依赖
   - 系统用红色高亮循环依赖路径
5. 导出图表（可选）
   - 点击"导出"按钮
   - 选择 PNG 或 SVG 格式

**预期结果**: 依赖关系图准确显示各子系统间的接口依赖关系

---

### 用户故事 6: 从 Git 仓库导入

**目标**: 从 Git 仓库批量导入 proto 文件

**步骤**:
1. 访问 `Git 仓库`配置页面
2. 添加仓库配置
   - 点击"添加仓库"
   - 输入仓库名称（如: "user-proto-repo"）
   - 输入仓库 URL（如: `https://github.com/your-org/user-proto.git`）
   - 输入分支（如: `main`）
   - 输入认证凭据（HTTPS: 用户名/密码，或 SSH: 私钥）
3. 点击"导入"按钮
4. 查看导入结果
   - 成功导入的文件列表
   - 导入错误日志
5. 检查一致性
   - 点击"检查一致性"按钮
   - 查看仓库文件与本地文件的差异列表

**预期结果**: Git 仓库中的 proto 文件批量导入到系统

## 项目结构说明

### 后端目录

```
backend/
├── src/
│   ├── api/              # RESTful API 路由
│   │   ├── routes.ts     # 路由定义
│   │   └── controllers/   # 控制器逻辑
│   ├── services/          # 业务逻辑层
│   │   ├── fileService.ts        # 文件管理服务
│   │   ├── reviewService.ts     # 审核流程服务
│   │   ├── checkService.ts       # 检查规则引擎
│   │   ├── dependencyService.ts  # 依赖关系服务
│   │   └── gitService.ts         # Git 操作服务
│   ├── models/            # SQLite 数据模型
│   │   └── schema.ts      # 表结构定义
│   ├── middlewares/       # Express 中间件
│   │   ├── auth.ts        # JWT 认证
│   │   ├── errorHandler.ts # 错误处理
│   │   └── logger.ts      # 请求日志
│   └── utils/             # 工具函数
│       ├── protoParser.ts        # Proto 文件解析
│       ├── diffUtils.ts          # 版本对比工具
│       └── namingRules.ts        # 命名规范验证
├── tests/
│   ├── unit/             # 单元测试
│   └── integration/        # 集成测试
└── package.json
```

### 前端目录

```
frontend/
├── src/
│   ├── components/       # 通用组件
│   │   ├── FileList.tsx         # 文件列表组件
│   │   ├── FileDetail.tsx       # 文件详情组件
│   │   ├── ReviewPanel.tsx      # 审核面板组件
│   │   ├── CheckReport.tsx       # 检查报告组件
│   │   ├── DependencyGraph.tsx   # 依赖关系图组件
│   │   └── GitImport.tsx         # Git 导入组件
│   ├── pages/            # 页面组件
│   │   ├── LoginPage.tsx
│   │   ├── FileListPage.tsx
│   │   ├── FileDetailPage.tsx
│   │   ├── ReviewPage.tsx
│   │   ├── DependencyGraphPage.tsx
│   │   └── GitImportPage.tsx
│   ├── services/          # API 调用服务
│   │   ├── api.ts             # API 客户端配置
│   │   └── types.ts          # API 响应类型
│   ├── types/             # TypeScript 类型定义
│   ├── hooks/             # 自定义 React Hooks
│   └── utils/             # 前端工具函数
├── public/               # 静态资源
└── package.json
```

### 共享类型目录

```
shared/
├── types/
│   ├── api.ts            # 前后端共享的 API 类型
│   ├── models.ts         # 数据模型类型
│   └── constants.ts      # 常量定义
└── package.json
```

## 开发工具

### 代码检查

```bash
# 后端 lint
cd backend
npm run lint

# 前端 lint
cd frontend
npm run lint

# 代码格式化（如果需要）
npm run format
```

### 测试

```bash
# 后端单元测试
cd backend
npm run test:unit

# 后端集成测试
npm run test:integration

# 前端测试
cd frontend
npm run test

# 测试覆盖率
npm run test:coverage
```

### 构建

```bash
# 后端构建（生产环境）
cd backend
npm run build

# 前端构建（生产环境）
cd frontend
npm run build
# 构建产物在 frontend/dist/
```

## 数据库管理

### 重置数据库

```bash
# 删除并重建数据库
cd backend
rm storage/database/protohub.db
npm run init-db
```

### 数据库迁移

如果需要修改表结构:
1. 创建迁移脚本: `backend/migrations/migration_001.sql`
2. 执行迁移: `sqlite3 storage/database/protohub.db < migrations/migration_001.sql`
3. 记录版本: 在 `migrations` 目录中维护版本列表

## 常见问题

### Q: 后端启动失败，提示端口被占用

**A**: 修改 `backend/src/config/index.ts` 中的端口号:
```typescript
const PORT = 3001; // 修改为其他端口
```

### Q: 前端无法连接后端 API

**A**: 确认后端服务已启动，检查前端 `src/services/api.ts` 中的 `BASE_URL` 配置:
```typescript
export const BASE_URL = 'http://localhost:3000/api/v1';
```

### Q: SQLite 数据库文件未找到

**A**: 确保先创建存储目录并初始化数据库:
```bash
mkdir -p storage/database
cd backend
npm run init-db
```

### Q: Git 导入失败

**A**: 检查以下几点:
1. Git 仓库 URL 是否正确
2. 认证凭据是否有效（HTTPS: 用户名/密码，SSH: 私钥）
3. 网络是否可访问 Git 仓库
4. 查看后端日志获取详细错误信息

### Q: 文件检查规则不生效

**A**: 确认词汇表已导入:
```bash
sqlite3 storage/database/protohub.db "SELECT COUNT(*) FROM vocabulary_terms;"
```
如果返回 0，需要导入默认词汇表:
```bash
sqlite3 storage/database/protohub.db < backend/scripts/import_default_vocab.sql
```

## 下一步

完成快速开始后，建议:

1. 阅读 [data-model.md](data-model.md) 了解数据模型设计
2. 查看 [contracts/api.yaml](contracts/api.yaml) 了解 API 规范
3. 开始开发，参考 [research.md](research.md) 中的技术决策
4. 运行测试确保功能正常

## 获取帮助

- 项目文档: [README.md](../../README.md)
- API 文档: http://localhost:3000/api/v1/docs
- 技术支持: support@protohub.example.com
