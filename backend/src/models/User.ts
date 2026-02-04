import { BaseRepository } from '../repositories/BaseRepository';
import type { UserEntity } from 'protohub-shared';
import bcrypt from 'bcrypt';

/**
 * 用户数据模型
 */
export class UserRepository extends BaseRepository<UserEntity> {
  constructor() {
    super('users', 'id');
  }

  /**
   * 根据用户名查找用户
   */
  async findByUsername(username: string): Promise<UserEntity | undefined> {
    return this.findOne({ username });
  }

  /**
   * 根据邮箱查找用户
   */
  async findByEmail(email: string): Promise<UserEntity | undefined> {
    return this.findOne({ email });
  }

  /**
   * 根据ID查找用户
   */
  async findById(id: number): Promise<UserEntity | undefined> {
    return this.findOne({ id });
  }

  /**
   * 创建新用户
   */
  async create(data: Omit<UserEntity, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const { username, email, password, password_hash, role } = data;

    // 密码哈希 (如果还没被哈希)
    let passwordHash: string;
    if (password_hash) {
      passwordHash = password_hash;
    } else if (password) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password, salt);
    } else {
      throw new Error('Password or password_hash is required');
    }

    return await this.insert({
      username,
      email,
      password_hash: passwordHash,
      role: role || 'developer',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * 更新用户信息
   */
  async update(id: number, updates: Partial<Omit<UserEntity, 'id'>>): Promise<boolean> {
    return await super.update(id, updates);
  }

  /**
   * 更新用户信息（别名方法）
   */
  async updateUser(id: number, updates: Partial<Omit<UserEntity, 'id'>>): Promise<boolean> {
    return this.update(id, updates);
  }

  /**
   * 验证用户密码
   */
  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

// 创建单例实例
export const userRepository = new UserRepository();
