# 快速开始: 规格质量修正与测试覆盖增强

**功能**: 规格质量修正与测试覆盖增强
**日期**: 2026-02-01

## 概述

本功能是对 Proto 文件管理系统规格和实施计划的修正，不涉及新功能的开发和部署。修正的目的是确保规格文档、技术合同和任务列表的一致性、完整性和准确性。

## 前置条件

完成以下前提条件后，才能执行本功能的修正：
1. ✅ 已创建功能规格: specs/002-spec-quality/spec.md
2. ✅ 已创建实施计划: specs/002-spec-quality/plan.md
3. ✅ 已完成研究阶段: specs/002-spec-quality/research.md
4. ✅ 所有宪法检查通过（plan.md:73）

## 修正步骤

### 步骤 1: 修复 OpenAPI 引用错误

**文件**: specs/001-proto-file-manager/contracts/api.yaml
**行号**: 823

**修正内容**:
```yaml
# 修正前
lockedBy:
  $ref: '#/schemas/User'

# 修正后
lockedBy:
  $ref: '#/components/schemas/User'
```

**验证命令**:
```bash
npx @apidevtools/swagger-cli validate specs/001-proto-file-manager/contracts/api.yaml
```

**预期结果**: 验证工具报告 "No errors"

---

### 步骤 2: 重排和去重任务列表

**文件**: specs/001-proto-file-manager/tasks.md
**范围**: 行 196-202（词汇管理任务）

**修正内容**:
1. 识别重复任务：
   - T080: 创建词汇管理服务（重复）
   - T081: 创建词汇 API 路由（重复）
   - T082: 创建词汇管理服务（重复）
   - T083: 创建词汇 API 路由（重复）

2. 保留唯一任务：
   - T078: 创建词汇管理服务
   - T079: 创建词汇 API 路由

3. 重新编号后续任务：
   - 原 T080-T083（删除）
   - 原 T084-T086 改为 T080-T082
   - 原 T087-T094 改为 T083-T090
   - 原 T095-T105 改为 T091-T101

4. 验证：
   - 检查任务编号从 T001 到 T101 连续无跳过
   - 检查无重复的任务描述
   - 检查任务依赖关系引用正确

---

### 步骤 3: 补充通知渠道描述

**文件**: specs/001-proto-file-manager/spec.md
**章节**: 功能需求 - 通知渠道明确化

**补充内容**:

```markdown
#### 通知渠道明确化

- **FR-008**: 系统必须支持邮件通知渠道，通过 SMTP 服务器发送审核结果
- **FR-009**: 系统必须支持应用内通知渠道，用户可在通知中心查看审核结果
- **FR-010**: 系统必须允许管理员配置启用的通知渠道（邮件、应用内、或两者同时）
- **FR-011**: 审核批准时，系统必须向提交人发送包含文件信息和审核意见的通知
- **FR-012**: 审核拒绝时，系统必须向提交人发送包含文件信息、拒绝理由的通知
- **FR-013**: 通知发送失败时，系统必须记录错误日志，并支持重试机制
```

---

### 步骤 4: 增加单元测试任务

**文件**: specs/001-proto-file-manager/tasks.md
**章节**: Phase 3: User Story 3 - 自动检查规则 (Priority: P2)

**补充内容** (在现有测试任务之后):

```markdown
**Unit Tests for Service Modules**:

- [ ] T106 [P] [US3] Unit test for fileService in backend/tests/unit/fileService.test.ts
- [ ] T107 [P] [US3] Unit test for reviewService in backend/tests/unit/reviewService.test.ts
- [ ] T108 [P] [US3] Unit test for gitService in backend/tests/unit/gitService.test.ts
- [ ] T109 [P] [US3] Unit test for dependencyService in backend/tests/unit/dependencyService.test.ts
- [ ] T110 [P] [US3] Unit test for consistencyService in backend/tests/unit/consistencyService.test.ts

**测试覆盖要求**:
- 每个服务模块的单元测试覆盖所有业务逻辑方法
- 每个服务模块的单元测试覆盖率不低于 80%
- 单元测试必须包含正常场景、边界条件和错误处理场景
```

**更新任务编号**:
- 原 T095-T105 改为 T111-T121
- 验证最终任务编号从 T001 到 T121 连续无跳过

---

## 验证修正

### 1. OpenAPI 文档验证

```bash
npx @apidevtools/swagger-cli validate specs/001-proto-file-manager/contracts/api.yaml
```

**预期结果**: ✅ No errors

---

### 2. 任务列表验证

手动检查:
- [ ] 任务编号从 T001 到 T121 连续，无跳过
- [ ] 无重复的任务描述
- [ ] 词汇管理任务（T078-T079）职责清晰，无重复
- [ ] 新增的 5 个单元测试任务（T106-T110）已添加

---

### 3. 规格文档验证

手动检查 specs/001-proto-file-manager/spec.md:
- [ ] FR-008 到 FR-013 通知渠道需求已补充
- [ ] FR-011 明确了通知是邮件或应用内（或两者）
- [ ] 验收场景（用户故事 3）包含通知渠道的测试场景

---

### 4. 宪法合规验证

检查 specs/001-proto-file-manager/spec.md:
- [ ] FR-014 到 FR-018 单元测试需求已补充（5 个服务模块）
- [ ] FR-019 明确了每个服务模块 80% 测试覆盖率要求
- [ ] FR-020 明确了整体核心业务逻辑 80% 测试覆盖率要求
- [ ] 符合宪法"大规模团队架构规范"的测试覆盖要求

---

## 完成

完成以上所有步骤和验证后，修正工作即完成。此时可以执行 `/speckit.tasks` 生成更新后的任务列表，或直接进入 `/speckit.implement` 阶段开始实施。

## 下一步

修正完成后，建议执行:
1. 运行 `/speckit.tasks` 重新生成任务列表（包含新增的单元测试任务）
2. 运行 `/speckit.implement` 开始实施 Proto 文件管理系统的开发和测试

## 常见问题

**Q: 是否需要修改原始规格中的其他章节？**
A: 不需要。仅补充通知渠道相关的功能需求，其他章节保持不变。

**Q: 任务重新编号会影响已完成的任务标记吗？**
A: 不会。仅修正任务 ID，复选标记 `[X]` 保持不变。

**Q: 单元测试任务放在哪个 Phase？**
A: 放在 Phase 3（User Story 3 - 自动检查规则）的测试任务之后，作为该用户故事的一部分。

**Q: 为什么不创建新的 data-model.md 和 contracts/？**
A: 本功能仅修正现有文档，不涉及新的数据模型和 API 设计。
