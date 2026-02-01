/**
 * 子系统数据模型
 */

import type { SubsystemEntity } from 'protohub-shared';
import { BaseRepository } from '../config/database';
import { getDatabase } from '../config/db';

export class SubsystemRepository extends BaseRepository<SubsystemEntity> {
  constructor() {
    super(getDatabase(), 'subsystems', 'id');
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
  create(data: Omit<SubsystemEntity, 'id' | 'created_at'>): number {
    const result = this.insert({
      ...data,
      created_at: new Date().toISOString(),
    });
    return Number(result.lastInsertRowid);
  }

  /**
   * 更新子系统
   */
  updateSubsystem(id: number, data: Partial<Omit<SubsystemEntity, 'id' | 'created_at'>>): void {
    this.update(id, data);
  }
}

// 导出单例
export const subsystemRepository = new SubsystemRepository();
