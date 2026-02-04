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
  async create(data: Omit<Violation, 'id'>): Promise<number> {
    return this.insert(data);
  }

  /**
   * 根据报告ID查找违规项
   */
  async findByReportId(reportId: number): Promise<Violation[]> {
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
