/**
 * 审核记录数据模型
 */

import type { ReviewEntity } from 'protohub-shared';
import { BaseRepository } from '../config/database';
import type Database from 'better-sqlite3';
import { getDatabase } from '../config/db';

export class ReviewRepository extends BaseRepository<ReviewEntity> {
  constructor() {
    super('reviews', 'id');
  }

  protected getDb(): Database.Database {
    return getDatabase();
  }

  /**
   * 根据文件 ID 查询审核记录
   */
  findByFileId(fileId: number): ReviewEntity[] {
    return this.findMany({ file_id: fileId }).sort(
      (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
    );
  }

  /**
   * 根据状态查询审核记录
   */
  findByStatus(status: string, params?: any): any {
    return this.findPaginated(params, { status });
  }

  /**
   * 查询待审核列表
   */
  findPendingReviews(params?: any): any {
    return this.findPaginated(params, { status: 'pending_review' });
  }

  /**
   * 查询审核历史 (已批准/已拒绝)
   */
  findHistory(params: any = {}): any {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const offset = (page - 1) * pageSize;

    const countStmt = this.getDb().prepare(
      `SELECT COUNT(*) as count FROM ${this.tableName} WHERE status IN ('approved', 'rejected')`
    );
    const { count } = countStmt.get() as { count: number };

    const dataStmt = this.getDb().prepare(
      `SELECT * FROM ${this.tableName} WHERE status IN ('approved', 'rejected') ORDER BY reviewed_at DESC LIMIT ? OFFSET ?`
    );
    const data = dataStmt.all(pageSize, offset);

    return {
      data,
      total: count,
      page,
      pageSize,
    };
  }

  /**
   * 创建审核记录
   */
  create(data: Omit<ReviewEntity, 'id'>): number {
    const result = this.insert({
      ...data,
      submitted_at: new Date().toISOString(),
    });
    return Number(result.lastInsertRowid);
  }

  /**
   * 批准审核
   */
  approve(
    id: number,
    reviewedBy: number,
    comment?: string
  ): void {
    this.update(id, {
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      status: 'approved',
      review_comment: comment,
    });
  }

  /**
   * 拒绝审核
   */
  reject(id: number, reviewedBy: number, comment: string): void {
    this.update(id, {
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      status: 'rejected',
      review_comment: comment,
    });
  }
}

// 导出单例
export const reviewRepository = new ReviewRepository();
