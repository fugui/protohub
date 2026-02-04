/**
 * 检查控制器
 */

import {
  checkFile as checkProtoFile,
} from '../../services/checkReportService';
import { checkReportRepository, checkViolationRepository } from '../../models/CheckReport';
import { protoFileRepository } from '../../models/ProtoFile';
import { userRepository } from '../../models/User';
import type { CheckReport } from 'protohub-shared';
import { NotFoundError } from '../../middlewares/errorHandler';

/**
 * 执行文件检查
 */
export async function runCheck(fileId: number) {
  return await checkProtoFile(fileId);
}

/**
 * 获取检查报告详情
 */
export function getReport(reportId: number): CheckReport {
  const reportEntity = checkReportRepository.findById(reportId);

  if (!reportEntity) {
    throw new NotFoundError('检查报告不存在');
  }

  const file = protoFileRepository.findById(reportEntity.file_id);
  if (!file) {
    throw new NotFoundError('文件不存在');
  }

  const createdBy = userRepository.findById(file.created_by);
  const violations = checkViolationRepository.findByReportId(reportId);

  return {
    id: reportEntity.id,
    fileId: file.id,
    file: {
      id: file.id,
      filename: file.filename,
      packageName: file.package_name,
      subsystem: file.subsystem_id,
      status: file.status,
      currentVersion: file.current_version,
      createdBy: createdBy ? {
        id: createdBy.id,
        username: createdBy.username,
        email: createdBy.email,
        role: createdBy.role,
        createdAt: createdBy.created_at,
      } : undefined,
      createdAt: file.created_at,
      updatedAt: file.updated_at,
      locked: file.locked === 1,
      lockedBy: file.locked_by ? {
        id: file.locked_by,
        username: '',
        email: '',
        role: 'developer',
        createdAt: '',
      } : null,
      lockedAt: file.locked_at,
    },
    checkedAt: reportEntity.checked_at,
    violations: violations.map((v: any) => ({
      id: v.id,
      ruleType: v.rule_type,
      severity: v.severity,
      fileLine: v.file_line ?? undefined,
      violationMessage: v.violation_message,
      suggestion: v.suggestion ?? undefined,
    })),
    status: violations.filter((v: any) => v.severity === 'error').length === 0 ? 'passed' : 'failed',
    passed: violations.filter((v: any) => v.severity === 'error').length === 0,
  };
}
