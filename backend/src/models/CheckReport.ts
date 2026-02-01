/**
 * 检查报告数据模型
 */

import type { CheckReportEntity, ViolationEntity } from 'protohub-shared';
import { BaseRepository } from '../config/database';
import { getDatabase } from '../config/db';

export class CheckReportRepository extends BaseRepository<CheckReportEntity> {
  constructor() {
    super(getDatabase(), 'check_reports', 'id');
  }

  /**
   * 根据文件 ID 查询检查报告
   */
  findByFileId(fileId: number): CheckReportEntity[] {
    return this.findMany({ file_id: fileId }).sort(
      (a, b) => new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime()
    );
  }

  /**
   * 获取文件的最新检查报告
   */
  findLatestByFileId(fileId: number): CheckReportEntity | undefined {
    const reports = this.findByFileId(fileId);
    return reports.length > 0 ? reports[0] : undefined;
  }

  /**
   * 创建检查报告
   */
  create(data: Omit<CheckReportEntity, 'id' | 'checked_at'>): number {
    const result = this.insert({
      ...data,
      checked_at: new Date().toISOString(),
    });
    return Number(result.lastInsertRowid);
  }
}

/**
 * 违规项数据模型
 */
export class ViolationRepository extends BaseRepository<ViolationEntity> {
  constructor() {
    super(getDatabase(), 'violations', 'id');
  }

  /**
   * 根据报告 ID 查询违规项
   */
  findByReportId(reportId: number): ViolationEntity[] {
    return this.findMany({ report_id: reportId });
  }

  /**
   * 批量创建违规项
   */
  createMany(violations: Omit<ViolationEntity, 'id'>[]): void {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO violations (report_id, rule_type, severity, file_line, violation_message, suggestion)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((items) => {
      for (const item of items) {
        stmt.run(
          item.report_id,
          item.rule_type,
          item.severity,
          item.file_line,
          item.violation_message,
          item.suggestion
        );
      }
    });

    insertMany(violations);
  }
}

// 导出单例
export const checkReportRepository = new CheckReportRepository();
export const violationRepository = new ViolationRepository();
