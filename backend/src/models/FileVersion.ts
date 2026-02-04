/**
 * 文件版本数据模型
 */

import type { FileVersionEntity } from 'protohub-shared';
import { BaseRepository } from '../config/database';
import type Database from 'better-sqlite3';
import { getDatabase } from '../config/db';

export class FileVersionRepository extends BaseRepository<FileVersionEntity> {
  constructor() {
    super('file_versions', 'id');
  }

  protected getDb(): Database.Database {
    return getDatabase();
  }

  /**
   * 根据文件 ID 查询所有版本
   */
  findByFileId(fileId: number): FileVersionEntity[] {
    return this.findMany({ file_id: fileId }).sort((a, b) => b.version - a.version);
  }

  /**
   * 根据文件 ID 和版本号查询
   */
  findByFileIdAndVersion(fileId: number, version: number): FileVersionEntity | undefined {
    return this.findOne({ file_id: fileId, version });
  }

  /**
   * 获取文件的最新版本
   */
  findLatestVersion(fileId: number): FileVersionEntity | undefined {
    const versions = this.findByFileId(fileId);
    return versions.length > 0 ? versions[0] : undefined;
  }

  /**
   * 创建版本记录
   */
  create(data: Omit<FileVersionEntity, 'id'>): number {
    const result = this.insert({
      ...data,
      modified_at: new Date().toISOString(),
    });
    return Number(result.lastInsertRowid);
  }

  /**
   * 删除文件的所有版本
   */
  deleteByFileId(fileId: number): void {
    this.deleteMany({ file_id: fileId });
  }
}

// 导出单例
export const fileVersionRepository = new FileVersionRepository();
