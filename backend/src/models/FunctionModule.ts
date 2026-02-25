/**
 * 功能模块数据模型（原子系统）
 */

import type { FunctionModuleEntity } from 'protohub-shared';
import { BaseRepository } from '../repositories/BaseRepository';
import type Database from 'better-sqlite3';
import { getDatabase } from '../config/db';

export class FunctionModuleRepository extends BaseRepository<FunctionModuleEntity> {
  constructor() {
    super('function_modules', 'id');
  }

  public getDb(): Database.Database {
    return getDatabase();
  }

  /**
   * 根据名称查找功能模块
   */
  findByName(name: string): FunctionModuleEntity | undefined {
    return this.findOne({ name });
  }

  /**
   * 创建功能模块
   */
  create(data: Omit<FunctionModuleEntity, 'id'>): number {
    const result = this.insert({
      ...data,
      created_at: new Date().toISOString(),
    });
    return Number(result.lastInsertRowid);
  }

  /**
   * 更新功能模块
   */
  updateFunctionModule(id: number, data: Partial<Omit<FunctionModuleEntity, 'id' | 'created_at'>>): void {
    this.update(id, data);
  }
}

// 导出单例
export const functionModuleRepository = new FunctionModuleRepository();
