# 实施计划: Proto 文件管理系统

**Branch**: `001-proto-file-manager` | **Date**: 2026-01-31 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-proto-file-manager/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

ProtoHub 是一个面向大规模团队（100+人）的 Protobuf 接口文件管理系统，提供 proto 文件的注册、审核、版本管理及依赖关系可视化等核心功能。系统采用全 TypeScript 技术栈，前后端共享类型定义，后端使用 SQLite 数据库，文件系统使用本地目录存储。技术方案通过研究阶段确定，确保符合项目宪法要求的架构清晰性、代码质量和中文文档规范。

## Technical Context

**Language/Version**: TypeScript 5.0+ (前后端一致)
**Primary Dependencies**:
  - 后端: Node.js 20+, Express.js, better-sqlite3, protobufjs
  - 前端: React 18+, Ant Design 5+, ECharts 5+, Zustand 4+
  - 工具: tsx, jest, @testing-library/react
**Storage**: SQLite 3.x (本地文件数据库)，本地文件系统 (proto 文件存储、Git 仓库缓存)
**Testing**: Jest + Testing Library (单元测试)，supertest (集成测试)
**Target Platform**: 跨平台 (Node.js 运行时)，Web 浏览器 (Chrome, Firefox, Safari, Edge 最新版本)
**Project Type**: web (前后端分离架构)
**Performance Goals**:
  - 文件查询响应时间: P95 < 3 秒 (支持 1000+ proto 文件)
  - 检查规则执行: 单文件 < 5 秒
  - 依赖关系图渲染: 100 节点页面加载 < 5 秒
  - Git 导入操作: 单次批量导入 < 30 秒
**Constraints**:
  - SQLite 数据库文件大小: < 100MB
  - 单个 proto 文件大小限制: 10MB
  - 文件锁超时: 30 分钟自动释放
  - 依赖关系图节点数上限: 500 个子系统
**Scale/Scope**:
  - 用户规模: 100+ 开发者/审核员/管理员
  - proto 文件数量: 1000+ 文件
  - Git 仓库配置: 每用户最多 5 个仓库
  - 并发用户: 支持 50+ 同时在线用户

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### 一、中文文档优先
- ✅ PASS: 所有文档将使用中文编写
- ✅ PASS: 变量和函数名使用英文（业界惯例），注释使用中文
- ✅ PASS: 提交信息使用中文

### 二、大规模团队架构规范
- ✅ PASS: 采用分层架构 (表现层/业务逻辑层/数据访问层)
- ✅ PASS: 单个函数不超过 50 行（后续在 data-model 和代码实现中验证）
- ✅ PASS: 模块化设计，避免循环依赖（依赖关系图支持检测）
- ✅ PASS: 核心业务逻辑 80%+ 测试覆盖（在 tasks 中规划）

### 三、接口文档化与规范
- ✅ PASS: RESTful API 将使用 OpenAPI 3.0 规范定义
- ✅ PASS: 所有接口端点定义明确（在 contracts/ 中生成）
- ✅ PASS: 接口文档与实现保持同步

### 代码质量标准
- ✅ PASS: 遵循 ESLint + Prettier 规范
- ✅ PASS: 单个文件不超过 500 行代码
- ✅ PASS: 敏感数据（Git 凭据）明文存储（符合用户选择的开发测试环境）
- ✅ PASS: 错误处理和日志记录机制明确

### 文档标准
- ✅ PASS: 功能模块包含设计文档、API 文档、开发文档
- ✅ PASS: 所有文档使用中文编写
- ✅ PASS: 术语一致性（proto、import、检查报告等）

**Gate Result**: ✅ PASSED - 所有宪法原则均已满足，可继续 Phase 0 和 Phase 1

## Project Structure

### Documentation (this feature)

```text
specs/001-proto-file-manager/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── api.yaml         # OpenAPI 3.0 specification
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
protohub/
├── backend/               # 后端服务 (TypeScript/Node.js)
│   ├── src/
│   │   ├── models/       # 数据模型定义 (SQLite schema)
│   │   ├── services/     # 业务逻辑层
│   │   ├── api/          # RESTful API 路由和控制器
│   │   ├── middlewares/  # 中间件 (认证、日志、错误处理)
│   │   ├── utils/        # 工具函数 (文件解析、Git 操作、检查规则)
│   │   └── config/       # 配置文件
│   ├── tests/
│   │   ├── unit/        # 单元测试
│   │   └── integration/  # 集成测试
│   └── package.json
├── frontend/              # 前端应用 (TypeScript/React)
│   ├── src/
│   │   ├── components/   # 通用组件
│   │   ├── pages/        # 页面组件
│   │   ├── services/     # API 调用服务
│   │   ├── types/        # TypeScript 类型定义 (共享)
│   │   ├── hooks/        # React Hooks
│   │   └── utils/        # 前端工具函数
│   ├── public/
│   ├── tests/
│   └── package.json
├── storage/              # 本地文件存储
│   ├── database/        # SQLite 数据库文件
│   ├── proto-files/     # proto 文件存储目录
│   └── git-cache/       # Git 仓库临时缓存
└── shared/               # 前后端共享类型和工具
    ├── types/            # 共享 TypeScript 类型
    └── constants/        # 常量定义
```

**Structure Decision**: 选择 Option 2 (Web Application)，采用前后端分离架构。前端使用 React + TypeScript，后端使用 Node.js + TypeScript + Express.js，数据库使用 SQLite，文件系统使用本地目录。前后端通过共享 `shared/` 目录实现类型安全，避免重复定义。

## Complexity Tracking

> **无需填写** - 所有宪法检查已通过，无违规需要论证。
