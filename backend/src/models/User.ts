/**
 * 用户数据模型
 */

import type { UserEntity } from 'protohub-shared';
import { BaseRepository } from '../config/database';
import { getDatabase } from '../config/db';

export class UserRepository extends BaseRepository<UserEntity> {
  constructor() {
    super(getDatabase(), 'users', 'id');
  }

  /**
   * 根据用户名查找用户
   */
  findByUsername(username: string): UserEntity | undefined {
    return this.findOne({ username });
  }

  /**
   * 根据邮箱查找用户
   */
  findByEmail(email: string): UserEntity | undefined {
    return this.findOne({ email });
  }

  /**
   * 创建用户
   */
  create(data: Omit<UserEntity, 'id' | 'created_at' | 'updated_at'>): number {
    const result = this.insert({
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return Number(result.lastInsertRowid);
  }

  /**
   * 更新用户
   */
  updateUser(id: number, data: Partial<Omit<UserEntity, 'id'>>): void {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString(),
    };
    this.update(id, updateData);
  }
}

// 导出单例
export const userRepository = new UserRepository();
