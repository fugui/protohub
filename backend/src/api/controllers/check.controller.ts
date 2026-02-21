/**
 * 检查控制器
 */

import {
  checkFile as checkProtoFile,
} from '../../services/checkReportService';
import { checkReportRepository, checkViolationRepository } from '../../models/CheckReport';
import { protoFileRepository } from '../../models/ProtoFile';
import { userRepository } from '../../models/User';
import { vocabularyTermRepository } from '../../models/VocabularyTerm';
import type { CheckReport, Violation } from 'protohub-shared';
import { NotFoundError } from '../../middlewares/errorHandler';
import { checkVocabularyAsync } from '../../utils/vocabularyRule';

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
    passed: violations.filter((v: any) => v.severity === 'error').length === 0,
  };
}

/**
 * 词汇检查报告详情
 */
export interface VocabularyReport {
  fileId: number;
  fileName: string;
  checkedAt: string;
  violations: Violation[];
  standardTerms: string[];
  totalTerms: number;
  violationCount: number;
  warningCount: number;
  errorCount: number;
  infoCount: number;
}

/**
 * 获取文件词汇检查报告
 */
export async function getVocabularyReport(fileId: number): Promise<VocabularyReport> {
  const file = protoFileRepository.findById(fileId);
  if (!file) {
    throw new NotFoundError('文件不存在');
  }

  // 读取文件内容
  const fs = await import('fs/promises');
  let content = '';
  try {
    content = await fs.readFile(file.file_path, 'utf-8');
  } catch (error) {
    console.error(`读取文件失败: ${file.file_path}`, error);
    throw new NotFoundError('无法读取文件内容');
  }

  // 获取标准词汇
  const standardTerms = vocabularyTermRepository.getAllTerms();

  // 执行词汇检查（包含 LLM 智能匹配）
  const violations = await checkVocabularyAsync(content, standardTerms, {
    enableLLM: true,
    confidenceThreshold: 0.8,
  });

  // 统计各严重程度数量
  const warningCount = violations.filter(v => v.severity === 'warning').length;
  const errorCount = violations.filter(v => v.severity === 'error').length;
  const infoCount = violations.filter(v => v.severity === 'info').length;

  return {
    fileId: file.id,
    fileName: file.filename,
    checkedAt: new Date().toISOString(),
    violations,
    standardTerms,
    totalTerms: standardTerms.length,
    violationCount: violations.length,
    warningCount,
    errorCount,
    infoCount,
  };
}
