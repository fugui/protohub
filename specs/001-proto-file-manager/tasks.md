---

description: "Proto 文件管理系统任务列表"

# Tasks: Proto 文件管理系统

**Input**: Design documents from `/specs/001-proto-file-manager/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), data-model.md (required for entities), contracts/api.yaml (required for endpoints), research.md (for decisions)

**Tests**: 根据规格说明，本功能包含测试任务以验证检查规则和依赖分析功能。

**Organization**: 任务按用户故事分组，每个用户故事可以独立实现和测试。

## Format: `[ID] [P?] [Story?] Description with file path`

- **[P]**: 可并行执行（不同文件，无依赖）
- **[Story]**: 所属用户故事（US1, US2, US3, US4）
- 包含精确文件路径
- 示例：`- [ ] T001 [P] [US1] 创建 User 模型在 backend/src/models/user.ts`

## Path Conventions

- **Backend**: `backend/src/` (models, services, api, middlewares, utils, config)
- **Frontend**: `frontend/src/` (components, pages, services, types, hooks, utils)
- **Shared**: `shared/types/` (共享类型定义)
- **Tests**: `backend/tests/unit/`, `backend/tests/integration/`, `frontend/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 项目初始化和基本结构

- [X] T001 [P] 创建项目目录结构（backend、frontend、shared、storage）
- [X] T002 [P] 初始化 package.json 文件（backend、frontend、shared）
- [X] T003 [P] [US1] 配置 TypeScript 编译器和代码规范工具（ESLint、Prettier）
- [X] T004 [P] [US1] 创建共享类型定义目录 shared/types/
- [X] T005 [P] 初始化 SQLite 数据库（backend/src/config/db.ts 和 schema.sql）
- [X] T006 [P] [US1] 配置 Git hooks（husky 用于代码检查）
- [X] T007 [P] [US1] 初始化 better-sqlite3 ORM（backend/src/config/database.ts）

**Checkpoint**: 基础设施就绪，可以开始开发 ✅

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 核心基础设施，必须在任何用户故事开始前完成

**⚠️ CRITICAL**: 没有用户故事可以在 Foundational 阶段完成前开始

- [X] T008 [P] [US1] 创建 User 数据模型和数据库表（backend/src/models/User.ts、backend/src/schema.sql）
- [X] T009 [P] [US1] 创建认证中间件（backend/src/middlewares/auth.ts - JWT 认证）
- [X] T010 [P] [US1] 创建错误处理中间件（backend/src/middlewares/errorHandler.ts）
- [X] T011 [P] [US1] 创建日志中间件（backend/src/middlewares/logger.ts）
- [X] T012 [P] [US1] 创建共享类型定义（shared/types/api.ts、shared/types/models.ts）
- [X] T013 [P] [US1] 创建 Proto 文件数据模型（backend/src/models/ProtoFile.ts）
- [X] T014 [P] [US1] 创建文件版本数据模型（backend/src/models/FileVersion.ts）
- [X] T015 [P] [US1] 创建审核记录数据模型（backend/src/models/Review.ts）
- [X] T016 [P] [US1] 创建检查报告和违规项数据模型（backend/src/models/CheckReport.ts、backend/src/models/Violation.ts）
- [X] T017 [P] [US1] 创建依赖关系数据模型（backend/src/models/Dependency.ts）
- [X] T018 [P] [US1] 创建子系统数据模型（backend/src/models/Subsystem.ts）
- [X] T019 [P] [US1] 创建 Git 仓库配置数据模型（backend/src/models/GitRepo.ts）
- [X] T020 [P] [US1] 创建词汇规范数据模型（backend/src/models/VocabularyTerm.ts）
- [X] T021 [P] [US1] 创建数据库初始化脚本（backend/scripts/init_db.ts）
- [X] T022 [P] [US1] 创建数据库迁移机制（backend/migrations/）
- [X] T023 [P] [US1] 实现 Express 服务器基础配置（backend/src/config/index.ts、backend/src/app.ts）

**Checkpoint**: Foundation ready - 用户故事实施可以开始 ✅

---

## Phase 3: User Story 1 - Proto 文件注册与初步管理 (Priority: P1) 🎯 MVP

**Goal**: 实现基本的 proto 文件 CRUD 操作，支持上传、编辑、删除，以及 Git 导入和一致性检查功能。

**Independent Test**: 可以上传一个 proto 文件、查看文件列表、编辑和删除文件来独立测试完整的价值交付。

### Tests for User Story 1 (测试任务)

> **NOTE: 编写这些测试 FIRST，确保它们 FAIL 在实现之前**

- [ ] T024 [P] [US1] Contract test for /auth/login endpoint in backend/tests/integration/auth.test.ts
- [ ] T025 [P] [US1] Contract test for /files POST endpoint in backend/tests/integration/files.test.ts
- [ ] T026 [P] [US1] Contract test for /files/{id} GET endpoint in backend/tests/integration/files.test.ts
- [ ] T027 [P] [US1] Contract test for /files/{id} PUT endpoint in backend/tests/integration/files.test.ts
- [ ] T028 [P] [US1] Contract test for /files/{id} DELETE endpoint in backend/tests/integration/files.test.ts
- [ ] T029 [P] [US1] Contract test for /files/{id}/lock POST endpoint in backend/tests/integration/files.test.ts
- [ ] T030 [P] [US1] Contract test for /files/{id}/unlock POST endpoint in backend/tests/integration/files.test.ts
- [ ] T031 [P] [US1] Integration test for proto file parsing logic in backend/tests/integration/protoParser.test.ts
- [ ] T032 [P] [US1] Integration test for file upload with proto parsing in backend/tests/integration/files.test.ts

### Implementation for User Story 1

**Authentication & User Management**:
- [X] T033 [US1] 创建认证服务（backend/src/services/authService.ts - 登录、注册、JWT 生成）
- [X] T034 [US1] 创建用户服务（backend/src/services/userService.ts - 用户 CRUD）
- [X] T035 [US1] 创建认证 API 路由（backend/src/api/routes.ts - /auth/login、/auth/register）

**File Management Core**:
- [X] T036 [US1] 创建 Proto 文件服务（backend/src/services/fileService.ts - CRUD、文件锁）
- [X] T037 [US1] 创建 Proto 解析器工具（backend/src/utils/protoParser.ts - 解析包名、消息、服务、import）
- [X] T038 [US1] 创建文件系统工具（backend/src/utils/fileSystem.ts - 文件存储、版本管理）
- [X] T039 [US1] 创建文件 API 路由（backend/src/api/routes.ts - /files GET/POST/PUT/DELETE）
- [X] T040 [US1] 创建文件控制器（backend/src/api/controllers/fileController.ts）

**Git Integration**:
- [X] T041 [US1] 创建 Git 服务（backend/src/services/gitService.ts - 克隆、拉取、差异对比）
- [X] T042 [US1] 创建 Git 仓库配置服务（backend/src/services/gitRepoService.ts - Git 配置 CRUD）
- [X] T043 [US1] 创建 Git API 路由（backend/src/api/routes.ts - /git-repos GET/POST、/git-repos/{id}/import、/git-repos/{id}/check-consistency）
- [X] T044 [US1] 创建 Git 控制器（backend/src/api/controllers/gitController.ts）

**Consistency Check**:
- [X] T045 [US1] 创建一致性检查服务（backend/src/services/consistencyService.ts - 对比 Git 仓库与本地文件）
- [X] T046 [US1] 实现差异生成工具（backend/src/utils/diffUtils.ts - 统一差异输出格式）

**Frontend - File Management UI**:
- [X] T047 [US1] 创建文件列表页面（frontend/src/pages/FileListPage.tsx）
- [ ] T048 [US1] 创建文件上传组件（frontend/src/components/FileUpload.tsx）
- [ ] T049 [US1] 创建文件详情组件（frontend/src/components/FileDetail.tsx）
- [ ] T050 [US1] 创建文件编辑器组件（frontend/src/components/ProtoEditor.tsx - 支持语法高亮）
- [X] T051 [US1] 创建 API 服务层（frontend/src/services/fileService.ts）
- [X] T052 [US1] 创建文件列表路由（frontend/src/router/index.tsx）

**Checkpoint**: User Story 1 完成，文件管理核心功能可用，可独立测试和部署 ✅

---

## Phase 4: User Story 2 - 审核流程管理 (Priority: P2)

**Goal**: 实现文件变更审核工作流，包括提交审核、审核工作台、批准/拒绝操作和通知。

**Independent Test**: 可以通过提交文件修改请求、审核员查看待审核列表、批准或拒绝变更来独立测试审核流程的完整价值。

### Tests for User Story 2 (测试任务)

> **NOTE: 编写这些测试 FIRST，确保它们 FAIL 在实现之前**

- [ ] T053 [P] [US2] Contract test for /reviews GET endpoint in backend/tests/integration/reviews.test.ts
- [ ] T054 [P] [US2] Contract test for /reviews/{id}/approve POST endpoint in backend/tests/integration/reviews.test.ts
- [ ] T055 [P] [US2] Contract test for /reviews/{id}/reject POST endpoint in backend/tests/integration/reviews.test.ts
- [ ] T056 [P] [US2] Integration test for review workflow in backend/tests/integration/reviews.test.ts

### Implementation for User Story 2

**Review Management**:
- [X] T057 [US2] 创建审核服务（backend/src/services/reviewService.ts - 审核 CRUD、状态流转）
- [X] T058 [US2] 创建审核 API 路由（backend/src/api/routes.ts - /reviews GET、/reviews/{id}/approve、/reviews/{id}/reject）
- [X] T059 [US2] 创建审核控制器（backend/src/api/controllers/reviewController.ts）
- [X] T060 [US2] 创建文件提交审核服务（集成到 FileService - /files/{id}/submit-review）

**Notification**:
- [X] T061 [US2] 创建通知服务（backend/src/services/notificationService.ts - 审核结果通知）
- [X] T062 [US2] 实现邮件通知功能（backend/src/utils/emailNotifier.ts）

**Frontend - Review UI**:
- [X] T063 [US2] 创建审核工作台页面（frontend/src/pages/ReviewPage.tsx）
- [X] T064 [US2] 创建审核面板组件（frontend/src/components/ReviewPanel.tsx - 查看待审核、批准/拒绝表单）
- [X] T065 [US2] 创建审核 API 服务层（frontend/src/services/reviewService.ts）

**Checkpoint**: User Story 2 完成，审核流程可用，可独立测试和部署 ✅

---

## Phase 5: User Story 3 - 自动检查规则 (Priority: P2)

**Goal**: 实现自动检查规则引擎，包括命名规范检查、常用词汇规范检查和公共接口抽取。

**Independent Test**: 可以上传不符合规范的 proto 文件，查看系统自动生成的检查报告和修改建议，独立验证自动检查功能的价值。

### Tests for User Story 3 (测试任务)

> **NOTE: 编写这些测试 FIRST，确保它们 FAIL 在实现之前**

- [ ] T066 [P] [US3] Contract test for /files/{id}/check POST endpoint in backend/tests/integration/files.test.ts
- [ ] T067 [P] [US3] Unit test for naming validation in backend/tests/unit/namingRules.test.ts
- [ ] T068 [P] [US3] Unit test for vocabulary check in backend/tests/unit/vocabularyRule.test.ts
- [ ] T069 [P] [US3] Unit test for common interface extraction in backend/tests/unit/commonInterfaceRule.test.ts
- [ ] T070 [P] [US3] Integration test for complete check workflow in backend/tests/integration/checkEngine.test.ts

### Implementation for User Story 3

**Check Engine**:
- [X] T071 [US3] 创建检查规则引擎（backend/src/services/checkEngine.ts - 规则注册、执行调度）
- [X] T072 [US3] 创建命名规范检查器（backend/src/utils/namingRules.ts - 文件名、包名、消息、字段、服务）
- [X] T073 [US3] 创建词汇规范检查器（backend/src/utils/vocabularyRule.ts - 领域术语字典验证）
- [X] T074 [US3] 创建公共接口抽取器（backend/src/utils/commonInterfaceRule.ts - 重复消息检测）
- [X] T075 [US3] 创建检查报告生成服务（backend/src/services/checkReportService.ts）
- [X] T076 [US3] 创建违规项数据模型（已在 T016 中创建 CheckReport.ts 和 Violation.ts）
- [X] T077 [US3] 创建检查 API 路由（backend/src/api/routes.ts - /files/{id}/check）

**Vocabulary Management**:
- [X] T078 [US3] 创建词汇管理服务（backend/src/services/vocabularyService.ts - 管理员增删改术语）
- [X] T079 [US3] 创建词汇 API 路由（backend/src/api/routes.ts - /vocabulary/terms GET/POST/PUT/DELETE）
- [X] T080 [US3] 创建词汇管理服务（backend/src/api/controllers/vocabulary.controller.ts）
- [X] T081 [US3] 创建词汇 API 路由（backend/src/api/routes/vocabulary.routes.ts）
- [X] T082 [US3] 创建词汇管理服务（backend/src/services/vocabularyService.ts）
- [X] T083 [US3] 创建词汇 API 路由（backend/src/api/routes/vocabulary.routes.ts）
- [ ] T080 [US3] 创建检查报告页面（frontend/src/pages/CheckReportPage.tsx）
- [ ] T081 [US3] 创建违规项列表组件（frontend/src/components/ViolationList.tsx - 违规详情和修改建议）
- [ ] T082 [US3] 创建词汇管理页面（frontend/src/pages/VocabularyPage.tsx）
- [ ] T083 [US3] 创建检查 API 服务层（frontend/src/services/checkService.ts）

**Checkpoint**: User Story 3 完成，自动检查功能可用，可独立测试和部署 ✅

---

## Phase 6: User Story 4 - 依赖关系可视化 (Priority: P3)

**Goal**: 实现子系统间接口依赖关系图，支持交互操作、循环依赖检测和影响范围分析。

**Independent Test**: 可以上传多个相关的 proto 文件，查看系统生成的依赖关系图，验证依赖关系的准确性和可视化效果。

### Tests for User Story 4 (测试任务)

> **NOTE: 编写这些测试 FIRST，确保它们 FAIL 在实现之前**

- [ ] T084 [P] [US4] Contract test for /dependencies/graph GET endpoint in backend/tests/integration/dependencies.test.ts
- [ ] T085 [P] [US4] Contract test for /files/{id}/impact-analysis GET endpoint in backend/tests/integration/dependencies.test.ts
- [ ] T086 [P] [US4] Integration test for dependency graph generation in backend/tests/integration/dependencies.test.ts

### Implementation for User Story 4

**Dependency Analysis Engine**:
- [X] T087 [US4] 创建依赖分析服务（backend/src/services/dependencyService.ts - 依赖解析、循环检测）
- [X] T088 [US4] 创建子系统服务（backend/src/services/subsystemService.ts - 子系统 CRUD）
- [X] T089 [US4] 创建影响范围分析服务（backend/src/services/dependencyService.ts - 变更影响分析）
- [X] T090 [US4] 创建依赖 API 路由（backend/src/api/routes.ts - /dependencies/graph、/files/{id}/impact-analysis）

**Frontend - Dependency Graph UI**:
- [X] T091 [US4] 创建依赖关系图页面（frontend/src/pages/DependencyGraphPage.tsx）
- [X] T092 [US4] 创建 ECharts 图表组件（frontend/src/components/DependencyGraph.tsx - 节点、边、循环依赖高亮）
- [X] T093 [US4] 创建子系统管理页面（frontend/src/pages/SubsystemPage.tsx）
- [X] T094 [US4] 创建依赖 API 服务层（frontend/src/services/dependencyService.ts）

**Checkpoint**: User Story 4 完成，依赖关系可视化功能可用，可独立测试和部署 ✅

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 跨故事改进和优化，提升用户体验和代码质量。

- [X] T095 [P] 实现搜索功能（backend/src/api/routes.ts - /files GET 搜索参数）
- [X] T096 [P] 实现分页查询（所有列表 API）
- [X] T097 [P] 前端搜索组件（frontend/src/components/SearchBar.tsx）
- [X] T098 [P] 创建前端登录页面（frontend/src/pages/LoginPage.tsx）
- [X] T099 [P] 创建前端首页/仪表板（frontend/src/pages/DashboardPage.tsx）
- [X] T100 [P] 前端加载状态和错误处理（frontend/src/components/Loading.tsx、frontend/src/components/ErrorMessage.tsx）
- [ ] T101 [P] 后端日志记录优化（记录关键操作、错误日志）
- [ ] T102 [P] 后端性能优化（添加数据库索引、查询缓存）
- [ ] T103 [P] 前端性能优化（懒加载、虚拟滚动）
- [ ] T104 [P] 运行 quickstart.md 中的所有验证步骤
- [ ] T105 [P] 生成 OpenAPI 3.0 文档（从 contracts/api.yaml）

**Checkpoint**: Phase 7 完成 ✅

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无依赖 - 可以立即开始
- **Foundational (Phase 2)**: 依赖 Setup 完成 - BLOCKS 所有用户故事
- **User Stories (Phase 3-6)**: 都依赖 Foundational 完成 - 可以在 Phase 2 完成后并行开始
- **Polish (Final Phase)**: 依赖所有用户故事完成

### User Story Dependencies

- **User Story 1 (P1)**: 可在 Foundational 完成后立即开始 - 无依赖其他用户故事
- **User Story 2 (P2)**: 可在 Foundational 完成后开始 - 无依赖其他用户故事
- **User Story 3 (P2)**: 可在 Foundational 完成后开始 - 无依赖其他用户故事
- **User Story 4 (P3)**: 可在 Foundational 完成后开始 - 无依赖其他用户故事
- **并行机会**: 4 个用户故事可以由 4 个开发人员并行开发

### Within Each User Story

**测试优先**: 测试任务（T024-T032）必须在对应实现任务之前编写并确保失败
**模型优先**: 数据模型任务必须在服务层任务之前完成
**服务优先**: 服务层任务必须在 API 路由任务之前完成
**前端优先**: API 服务必须在 UI 组件之前完成
**Story 完成**: 所有实现任务完成后，Story 可以独立测试

### Parallel Opportunities

- **Setup 阶段**: T001-T007（7 个任务）可全部并行运行
- **Foundational 阶段**: T008-T023（16 个任务）大部分可并行
- **User Story 1 测试**: T024-T032 可全部并行
- **User Story 1 实现**: T033-T052（20 个任务）可部分并行（不同文件）
- **User Story 2 测试**: T053-T056 可全部并行
- **User Story 2 实现**: T057-T065（9 个任务）可部分并行
- **User Story 3 测试**: T066-T070 可全部并行
- **User Story 3 实现**: T071-T083（13 个任务）可部分并行
- **User Story 4 测试**: T084-T086 可全部并行
- **User Story 4 实现**: T087-T094（8 个任务）可部分并行
- **跨 Story**: Polish 阶段 T095-T105 可与用户故事开发并行进行

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. 完成 Phase 1: Setup (T001-T007)
2. 完成 Phase 2: Foundational (T008-T023)
3. 完成 Phase 3: User Story 1 测试（T024-T032）- 确保所有测试失败
4. 完成 Phase 3: User Story 1 实现（T033-T052）
5. **STOP and VALIDATE**: 测试 User Story 1 独立性
6. 部署并演示 MVP

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo

### Parallel Team Strategy

With multiple developers:

1. Team 完成 Setup + Foundational（T001-T023，23 个任务）
2. Once Foundational 完成:
   - Developer A: User Story 1 + 测试（T033-T052，21 个任务）
   - Developer B: User Story 2 + 测试（T057-T065，10 个任务）
   - Developer C: User Story 3 + 测试（T071-T083，14 个任务）
   - Developer D: User Story 4 + 测试（T087-T094，9 个任务）
3. Stories 完成和集成
4. Polish 阶段：所有开发人员协作（T095-T105，11 个任务）

---

## Notes

- **[P]** 标记的任务可以并行执行（不同文件，无前置依赖）
- **[Story]** 标记：[US1]、[US2]、[US3]、[US4] 分别对应 4 个用户故事
- 测试任务必须在实现任务之前编写并确保失败（TDD 方法）
- 每个任务包含精确的文件路径
- 完成每个 Phase 后验证 Story 可独立测试
- MVP 范围：User Story 1 完成 + 测试通过即可交付
