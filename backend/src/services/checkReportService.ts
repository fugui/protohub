/**
 * 检查报告服务
 */

import { checkReportRepository, violationRepository, protoFileRepository } from '../models/CheckReport';
import { protoFileRepository } from '../models/ProtoFile';
import type { CheckReport, Violation, ProtoFile } from 'protohub-shared';
import { runAllRules } from './checkEngine';
import { vocabularyTermRepository } from '../models/VocabularyTerm';
import { ValidationError } from '../middlewares/errorHandler';

/**
 * 执行文件检查
 */
export async function checkFile(fileId: number): Promise<CheckReport> {
  // 获取文件
  const file = protoFileRepository.findById(fileId);
  if (!file) {
    throw new ValidationError('文件不存在');
  }

  // 读取文件内容
  // TODO: 从文件读取

  // 获取标准词汇
  const standardTerms = vocabularyTermRepository.getAllTerms().map((t) => t.term);

  // 执行所有检查规则
  const violations = runAllRules(file.content, standardTerms);

  // 创建检查报告
  const reportId = checkReportRepository.create({
    file_id: fileId,
    file_version_id: file.current_version,
  });

  // 批量创建违规项
  if (violations.length > 0) {
    violationRepository.createMany(
      violations.map((v) => ({
        report_id: reportId,
        rule_type: v.ruleType,
        severity: v.severity,
        file_line: v.fileLine,
        violation_message: v.violationMessage,
        suggestion: v.suggestion,
      }))
    );
  }

  const report = checkReportRepository.findById(reportId);

  // 返回检查报告
  return {
    id: report!.id,
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
    checkedAt: report!.checked_at,
    violations: violations.map((v) => ({
      id: v.id,
      ruleType: v.ruleType,
      severity: v.severity,
      fileLine: v.fileLine,
      violationMessage: v.violationMessage,
      suggestion: v.suggestion,
    })),
    passed: violations.filter((v) => v.severity === 'error').length === 0,
  };
}

/**
 * 获取文件的检查报告列表
 */
export function getFileReports(fileId: number): CheckReport[] {
  const reports = checkReportRepository.findByFileId(fileId);

  return reports.map((entity) => ({
    id: entity.id,
    file: {
      id: entity.file_id,
      filename: '',
      packageName: '',
      status: 'draft',
      currentVersion: 1,
      createdAt: '',
      updatedAt: '',
      locked: false,
    },
    checkedAt: entity.checked_at,
    violations: violationRepository.findByReportId(entity.id).map((v) => ({
      id: v.id,
      ruleType: v.rule_type,
      severity: v.severity,
      fileLine: v.file_line,
      violationMessage: v.violation_message,
      suggestion: v.suggestion,
    })),
    passed: false,
  }));
}

/**
 * 获取最新检查报告
 */
export function getLatestReport(fileId: number): CheckReport | undefined {
  return checkReportRepository.findLatestByFileId(fileId)?.map((entity) => ({
    id: entity.id,
    file: {
      id: entity.file_id,
      filename: '',
      packageName: '',
      status: 'draft',
      currentVersion: 1,
      createdAt: '',
      updatedAt: '',
      locked: false,
    },
    checkedAt: entity.checked_at,
    violations: violationRepository.findByReportId(entity.id).map((v) => ({
      id: v.id,
      ruleType: v.rule_type,
      severity: v.severity,
      fileLine: v.file_line,
      violationMessage: v.violation_message,
      suggestion: v.suggestion,
    })),
    passed: false,
  }))[0];
}
