/**
 * 检查报告服务
 */

import fs from 'fs/promises';
import { checkReportRepository, checkViolationRepository } from '../models/CheckReport';
import { protoFileRepository } from '../models/ProtoFile';
import { fileVersionRepository } from '../models/FileVersion';
import type { CheckReport, Violation } from 'protohub-shared';
import { runAllRules } from './checkEngine';
import { vocabularyTermRepository } from '../models/VocabularyTerm';
import { NotFoundError, ValidationError } from '../middlewares/errorHandler';
import { checkVocabularyAsync } from '../utils/vocabularyRule';

/**
 * 执行文件检查
 */
export async function checkFile(fileId: number): Promise<CheckReport> {
  // 获取文件
  const file = protoFileRepository.findById(fileId);
  if (!file) {
    throw new NotFoundError('文件不存在');
  }

  // 读取文件内容
  let content = '';
  try {
    content = await fs.readFile(file.file_path, 'utf-8');
  } catch (error) {
    console.error(`读取文件失败: ${file.file_path}`, error);
    throw new ValidationError('无法读取文件内容');
  }

  // 获取标准词汇
  const standardTerms = vocabularyTermRepository.getAllTerms();

  // 执行所有检查规则
  const ruleViolations = runAllRules(content, standardTerms);

  // 执行词汇检查（包含 LLM 智能匹配）
  const vocabularyViolations = await checkVocabularyAsync(content, standardTerms, {
    enableLLM: true,
    confidenceThreshold: 0.8,
  });

  // 合并所有违规项
  const violations: Violation[] = [...ruleViolations, ...vocabularyViolations];

  // 查找文件版本的 ID
  const fileVersion = fileVersionRepository.findByFileIdAndVersion(
    fileId,
    file.current_version
  );
  if (!fileVersion) {
    throw new ValidationError('文件版本不存在');
  }

  // 创建检查报告
  const reportId = checkReportRepository.create({
    file_id: fileId,
    file_version_id: fileVersion.id,
    checked_at: new Date().toISOString(),
  });

  // 批量创建违规项
  if (violations.length > 0) {
    checkViolationRepository.createMany(
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

  // Ensure WAL checkpoint so data is immediately visible
  const db = checkReportRepository.getDb();
  db.pragma('wal_checkpoint(TRUNCATE)');

  const report = checkReportRepository.findById(reportId);

  // 返回检查报告
  return {
    id: report!.id,
    file: {
      id: file.id,
      filename: file.filename,
      packageName: file.package_name,
      subsystem: file.function_module_id || undefined,
      status: file.status,
      currentVersion: file.current_version,
      createdBy: { id: file.created_by, username: '', email: '', role: 'developer', createdAt: '' },
      createdAt: file.created_at,
      updatedAt: file.updated_at,
      locked: file.locked === 1,
    },
    checkedAt: report!.checked_at,
    violations: violations.map((v: any) => ({
      id: v.id,
      ruleType: v.ruleType,
      severity: v.severity,
      fileLine: v.fileLine ?? undefined,
      violationMessage: v.violation_message,
      suggestion: v.suggestion ?? undefined,
    })),
    passed: violations.filter((v) => v.severity === 'error').length === 0,
  };
}

/**
 * 获取文件的检查报告列表
 */
export function getFileReports(fileId: number): CheckReport[] {
  const reports = checkReportRepository.findByFileId(fileId);

  return reports.map((entity: any) => ({
    id: entity.id,
    file: {
      id: entity.file_id,
      filename: '',
      packageName: '',
      subsystem: undefined,
      status: 'draft',
      currentVersion: 1,
      createdBy: undefined,
      createdAt: '',
      updatedAt: '',
      locked: false,
    },
    checkedAt: entity.checked_at,
    violations: checkViolationRepository.findByReportId(entity.id).map((v: any) => ({
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
  const entity = checkReportRepository.findLatestByFileId(fileId);
  if (!entity) {
    return undefined;
  }

  return {
    id: entity.id,
    file: {
      id: entity.file_id,
      filename: '',
      packageName: '',
      subsystem: undefined,
      status: 'draft',
      currentVersion: 1,
      createdBy: undefined,
      createdAt: '',
      updatedAt: '',
      locked: false,
    },
    checkedAt: entity.checked_at,
    violations: checkViolationRepository.findByReportId(entity.id).map((v: any) => ({
      id: v.id,
      ruleType: v.rule_type,
      severity: v.severity,
      fileLine: v.file_line ?? undefined,
      violationMessage: v.violation_message,
      suggestion: v.suggestion ?? undefined,
    })),
    passed: false,
  };
}
