/**
 * Proto 文件数据模型
 */

import type { ProtoFileEntity } from 'protohub-shared';
import { BaseRepository, PaginatedResult } from '../config/database';
import { getDatabase } from '../config/db';

export class ProtoFileRepository extends BaseRepository<ProtoFileEntity> {
  constructor() {
    super(getDatabase(), 'proto_files', 'id');
  }

  /**
   * 根据子系统查询文件
   */
  findBySubsystem(subsystemId: number, params?: any): PaginatedResult<ProtoFileEntity> {
    return this.findPaginated(params, { subsystem_id: subsystemId });
  }

  /**
   * 根据状态查询文件
   */
  findByStatus(status: string, params?: any): PaginatedResult<ProtoFileEntity> {
    return this.findPaginated(params, { status });
  }

  /**
   * 根据包名查询文件
   */
  findByPackageName(packageName: string): ProtoFileEntity | undefined {
    return this.findOne({ package_name: packageName });
  }

  /**
   * 创建文件
   */
  create(data: Omit<ProtoFileEntity, 'id' | 'created_at' | 'updated_at'>): number {
    const result = this.insert({
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return Number(result.lastInsertRowid);
  }

  /**
   * 更新文件
   */
  updateFile(id: number, data: Partial<Omit<ProtoFileEntity, 'id'>>): void {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString(),
    };
    this.update(id, updateData);
  }

  /**
   * 锁定文件
   */
  lockFile(id: number, lockedBy: number): void {
    this.update(id, {
      locked: 1,
      locked_by: lockedBy,
      locked_at: new Date().toISOString(),
    });
  }

  /**
   * 解锁文件
   */
  unlockFile(id: number): void {
    this.update(id, {
      locked: 0,
      locked_by: null,
      locked_at: null,
    });
  }

  /**
   * 更新文件版本
   */
  incrementVersion(id: number): void {
    const db = getDatabase();
    db.prepare(`UPDATE proto_files SET current_version = current_version + 1 WHERE id = ?`).run(id);
  }

  /**
   * 检查文件锁是否超时
   */
  checkLockTimeout(id: number): boolean {
    const file = this.findById(id);
    if (!file || file.locked !== 1) {
      return false;
    }

    if (!file.locked_at) {
      return false;
    }

    const lockedAt = new Date(file.locked_at).getTime();
    const now = Date.now();
    const timeout = 30 * 60 * 1000; // 30 分钟

    return now - lockedAt > timeout;
  }

  /**
   * 释放超时的文件锁
   */
  releaseExpiredLocks(): void {
    const db = getDatabase();
    const timeout = 30 * 60 * 1000; // 30 分钟
    const timeoutDate = new Date(Date.now() - timeout).toISOString();

    db.prepare(`
      UPDATE proto_files
      SET locked = 0, locked_by = NULL, locked_at = NULL
      WHERE locked = 1 AND locked_at < ?
    `).run(timeoutDate);
  }
}

// 导出单例
export const protoFileRepository = new ProtoFileRepository();
