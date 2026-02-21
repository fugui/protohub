import { BaseRepository } from '../repositories/BaseRepository';
import type { Violation } from 'protohub-shared';

/**
 * 违规项数据模型
 */
export class ViolationRepository extends BaseRepository<Violation> {
  constructor() {
    super('violations', 'id');
  }

  /**
   * 创建违规项
   */
  create(data: Omit<Violation, 'id'>): number {
    const result = this.insert(data);
    return Number(result.lastInsertRowid);
  }

  /**
   * 根据报告ID查找违规项
   */
  findByReportId(reportId: number): Violation[] {
    const stmt = this.getDb().prepare(`
      SELECT * FROM violations
      WHERE report_id = ?
      ORDER BY id
    `);

    return stmt.all(reportId) as Violation[];
  }
}

// 创建单例实例
export const violationRepository = new ViolationRepository();
