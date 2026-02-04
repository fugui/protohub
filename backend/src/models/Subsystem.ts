/**
 * 子系统数据模型
 */

import type { SubsystemEntity } from 'protohub-shared';
import { BaseRepository } from '../config/database';
import type Database from 'better-sqlite3';
import { getDatabase } from '../config/db';

export class SubsystemRepository extends BaseRepository<SubsystemEntity> {
  constructor() {
    super('subsystems', 'id');
  }

  protected getDb(): Database.Database {
    return getDatabase();
  }

  /**
   * 根据名称查找子系统
   */
  findByName(name: string): SubsystemEntity | undefined {
    return this.findOne({ name });
  }

  /**
   * 创建子系统
   */
  async create(data: Omit<SubsystemEntity, 'id'>): Promise<number> {
    const result = await this.insert({
      ...data,
      created_at: new Date().toISOString(),
    });
    return result;
  }

  /**
   * 更新子系统
   */
  async updateSubsystem(id: number, data: Partial<Omit<SubsystemEntity, 'id' | 'created_at'>>): Promise<void> {
    await this.update(id, data);
  }
}

// 导出单例
export const subsystemRepository = new SubsystemRepository();
