/**
 * Git 仓库配置数据模型
 */

import type { GitRepoEntity } from 'protohub-shared';
import { BaseRepository } from '../config/database';
import type Database from 'better-sqlite3';
import { getDatabase } from '../config/db';

export class GitRepoRepository extends BaseRepository<GitRepoEntity> {
  constructor() {
    super('git_repos', 'id');
  }

  protected getDb(): Database.Database {
    return getDatabase();
  }

  /**
   * 根据用户 ID 查询仓库配置
   */
  findByUserId(userId: number): GitRepoEntity[] {
    return this.findMany({ user_id: userId });
  }

  /**
   * 统计用户的仓库数量
   */
  countByUserId(userId: number): number {
    return this.count({ user_id: userId });
  }

  /**
   * 创建仓库配置
   */
  create(data: Omit<GitRepoEntity, 'id'>): number {
    const result = this.insert({
      ...data,
      created_at: new Date().toISOString(),
    });
    return Number(result.lastInsertRowid);
  }

  /**
   * 更新最后同步时间
   */
  updateLastSync(id: number): void {
    this.update(id, {
      last_sync_at: new Date().toISOString(),
    });
  }
}

// 导出单例
export const gitRepoRepository = new GitRepoRepository();
