/**
 * 检查控制器
 */

import {
  checkFile as checkProtoFile,
  getReport as getReportFromDb,
} from '../../services/checkReportService';
import { checkReportRepository, violationRepository } from '../../models/CheckReport';
import { protoFileRepository } from '../../models/ProtoFile';
import type { CheckReport, Violation } from 'protohub-shared';
import { ValidationError } from '../../middlewares/errorHandler';

/**
 * 执行文件检查
 */
export async function runCheck(fileId: number) {
  return await checkProtoFile(fileId);
}

/**
 * 获取检查报告详情
 */
export async function getReport(reportId: number): Promise<CheckReport> {
  const reportEntity = checkReportRepository.findById(reportId);

  if (!reportEntity) {
    throw new ValidationError('检查报告不存在');
  }

  const file = protoFileRepository.findById(reportEntity.file_id);
  if (!file) {
    throw new ValidationError('文件不存在');
  }

  const violations = violationRepository
    .findByReportId(reportId)
    .map(
      (v) =>
        ({
          id: v.id,
          ruleType: v.rule_type,
          severity: v.severity,
          fileLine: v.file_line,
          violationMessage: v.violation_message,
          suggestion: v.suggestion,
        }) as Violation
    );

  return {
    id: reportEntity.id,
    file: {
      id: file.id,
      filename: file.filename,
      packageName: file.package_name,
      status: file.status,
      currentVersion: file.current_version,
      createdAt: file.created_at,
      updatedAt: file.updated_at,
      locked: file.locked === 1,
    },
    checkedAt: reportEntity.checked_at,
    violations,
    passed: violations.filter((v) => v.severity === 'error').length === 0,
  };
}
