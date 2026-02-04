# 研究报告: 规格质量修正与测试覆盖增强

**功能**: 规格质量修正与测试覆盖增强
**日期**: 2026-02-01
**输入**: [spec.md](spec.md)

## 研究决策

本功能是对现有文档的修正，不涉及新技术选型。以下是基于现有项目技术栈的研究结果和决策。

### 1. OpenAPI 引用错误修正

**问题**: contracts/api.yaml 第 823 行存在错误的引用路径 `$ref: '#/schemas/User'`，应为 `$ref: '#/components/schemas/User'`

**决策**: 使用标准 OpenAPI 3.0 引用路径格式

**理由**: 根据 OpenAPI 3.0 规范，schema 引用必须使用完整路径 `#/components/schemas/{schema_name}`。错误的引用会导致代码生成工具和验证工具失败。

**已考虑的替代方案**:
- 使用短路径 `#/User` - 不符合 OpenAPI 3.0 规范，仅适用于 Swagger 2.0
- 忽略错误继续使用 - 会导致代码生成失败，违背接口文档化与规范原则

**实施方式**: 手动修正 api.yaml:823 中的引用路径，从 `#/schemas/User` 改为 `#/components/schemas/User`

---

### 2. 任务列表重排和去重

**问题**: tasks.md 中 T078-T083 存在重复任务和编号混乱

**决策**: 检查 tasks.md:196-202 中的词汇管理任务，删除重复项，重新编号以保持连续性

**理由**:
- 重复任务会导致开发人员执行重复工作
- 编号混乱会破坏任务依赖关系的引用
- 修正后确保每个任务 ID 唯一且连续

**已考虑的替代方案**:
- 保留重复任务并标注为"已废弃" - 增加文档复杂度，不推荐
- 仅删除重复任务不重新编号 - 导致编号跳过，违反 FR-005

**实施方式**:
1. 识别 T080-T083 中的重复任务描述
2. 保留唯一且职责明确的任务
3. 检查任务依赖关系（如其他任务引用 T080-T083）
4. 重新编号从第一个重复任务开始的所有后续任务，确保连续性
5. 验证最终任务列表从 T001 到最后一个任务号连续无跳过

---

### 3. 通知渠道明确化

**问题**: 原始规格（001-proto-file-manager/spec.md）的 FR-011 未明确通知渠道是邮件还是应用内

**决策**: 系统同时支持邮件和应用内两种通知渠道，由管理员配置启用策略

**理由**:
- 邮件通知适用于需要及时接收但可能不立即查看的场景
- 应用内通知适用于用户在线时的实时通知
- 支持两种渠道可满足不同用户偏好和使用场景

**已考虑的替代方案**:
- 仅支持邮件通知 - 无法满足需要实时通知的场景
- 仅支持应用内通知 - 用户离线时无法接收通知
- 强制同时发送两种通知 - 可能导致通知泛滥，用户体验不佳

**实施方式**:
在 specs/001-proto-file-manager/spec.md 中补充以下需求：
- FR-008: 系统必须支持邮件通知渠道，通过 SMTP 服务器发送审核结果
- FR-009: 系统必须支持应用内通知渠道，用户可在通知中心查看审核结果
- FR-010: 系统必须允许管理员配置启用的通知渠道（邮件、应用内、或两者同时）

---

### 4. 单元测试覆盖增强

**问题**: 现有 tasks.md 仅 US3（自动检查规则）包含单元测试任务，缺少其他核心服务模块的测试任务

**决策**: 为 5 个核心服务模块补充单元测试任务，确保每个服务覆盖率不低于 80%

**理由**:
- 宪法要求"核心业务逻辑必须有单元测试，覆盖率不低于 80%"
- fileService、reviewService、gitService、dependencyService、consistencyService 是核心业务逻辑层
- 缺少测试任务会导致实施阶段忽略这些模块的测试编写

**已考虑的替代方案**:
- 仅在代码审查时检查覆盖率 - 无法确保实施阶段编写测试
- 使用集成测试替代单元测试 - 集成测试不能替代单元测试的快速反馈和隔离性

**实施方式**:
在 specs/001-proto-file-manager/tasks.md 的 Phase 5 (User Story 3) 测试任务中补充：
- T106 [P] [US3] Unit test for fileService in backend/tests/unit/fileService.test.ts
- T107 [P] [US3] Unit test for reviewService in backend/tests/unit/reviewService.test.ts
- T108 [P] [US3] Unit test for gitService in backend/tests/unit/gitService.test.ts
- T109 [P] [US3] Unit test for dependencyService in backend/tests/unit/dependencyService.test.ts
- T110 [P] [US3] Unit test for consistencyService in backend/tests/unit/consistencyService.test.ts

测试覆盖目标：
- 每个服务模块覆盖所有业务逻辑方法（正常场景、边界条件、错误处理）
- 每个服务模块单元测试覆盖率不低于 80%
- 使用 Jest 的覆盖率报告验证（nyc/istanbul）

---

## 技术依赖验证

### OpenAPI 验证工具

**工具选择**: swagger-cli validate

**理由**:
- 业界标准工具，支持 OpenAPI 3.0 规范
- 轻量级命令行工具，易于集成到 CI/CD
- 提供清晰的错误定位和修正建议

**验证方式**:
```bash
npx @apidevtools/swagger-cli validate contracts/api.yaml
```

### 单元测试框架

**现有工具**: Jest (已在项目 plan.md 中配置)

**覆盖率工具**: nyc/istanbul (Jest 内置支持)

**使用方式**:
```bash
npm test -- --coverage
```

覆盖率报告输出: `coverage/` 目录，包含：
- lcov.info (LCOV 格式)
- HTML 报告（coverage/index.html）
- 终端摘要（覆盖率百分比）

---

## 总结

本研究的所有决策均基于：
1. 项目现有技术栈（TypeScript、Node.js、Jest、SQLite）
2. 项目宪法要求（中文文档、架构规范、接口文档化、测试覆盖率）
3. 行业最佳实践（OpenAPI 3.0 规范、TDD 方法论）

所有决策无 NEEDS CLARIFICATION，可直接进入 Phase 1（设计与合同阶段）。
