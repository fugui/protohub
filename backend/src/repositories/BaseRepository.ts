import type Database from 'better-sqlite3';
import { getDatabase } from '../config/db';

/**
 * 基础 Repository 类
 * 提供通用的 CRUD 操作
 */
export class BaseRepository<T = any> {
  constructor(
    protected tableName: string,
    protected idColumn: string = 'id'
  ) {}

  /**
   * 获取数据库连接
   */
  protected getDb(): Database.Database {
    return getDatabase();
  }

  /**
   * 查询所有记录
   */
  async findAll(): Promise<T[]> {
    const stmt = this.getDb().prepare(`SELECT * FROM ${this.tableName}`);
    return stmt.all() as T[];
  }

  /**
   * 根据 ID 查询
   */
  async findById(id: number): Promise<T | undefined> {
    const stmt = this.getDb().prepare(
      `SELECT * FROM ${this.tableName} WHERE ${this.idColumn} = ?`
    );
    return stmt.get(id) as T | undefined;
  }

  /**
   * 根据条件查找单条记录
   */
  async findOne(where: Record<string, any>): Promise<T | undefined> {
    const conditions = Object.keys(where);
    const whereClause = conditions.map(key => `${key} = ?`).join(' AND ');

    const stmt = this.getDb().prepare(
      `SELECT * FROM ${this.tableName} WHERE ${whereClause}`
    );
    const values = conditions.map(key => where[key as string]);

    return stmt.get(...values) as T | undefined;
  }

  /**
   * 插入记录
   */
  async insert(data: Partial<T>): Promise<number> {
    const keys = Object.keys(data);
    const placeholders = keys.map(() => '?');
    const columns = keys.join(', ');
    const values = keys.map(key => (data as any)[key]);

    const stmt = this.getDb().prepare(
      `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders.join(', ')})`
    );
    const result = stmt.run(...values);
    return Number(result.lastInsertRowid);
  }

  /**
   * 更新记录
   */
  async update(id: number, data: Partial<T>): Promise<boolean> {
    const keys = Object.keys(data);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const values = keys.map(key => (data as any)[key]);

    const stmt = this.getDb().prepare(
      `UPDATE ${this.tableName} SET ${setClause} WHERE ${this.idColumn} = ?`
    );
    const result = stmt.run(...values, id);
    return result.changes > 0;
  }

  /**
   * 删除记录
   */
  async delete(id: number): Promise<boolean> {
    const stmt = this.getDb().prepare(
      `DELETE FROM ${this.tableName} WHERE ${this.idColumn} = ?`
    );
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * 计数查询结果
   */
  async count(where?: Record<string, any>): Promise<number> {
    let stmt;

    if (where && Object.keys(where).length > 0) {
      const conditions = Object.keys(where);
      const whereClause = conditions.map(key => `${key} = ?`).join(' AND ');
      stmt = this.getDb().prepare(
        `SELECT COUNT(*) as count FROM ${this.tableName} WHERE ${whereClause}`
      );
      const values = conditions.map(key => where[key as string]);
      const result = stmt.get(...values) as { count: number };
      return result.count;
    } else {
      stmt = this.getDb().prepare(`SELECT COUNT(*) as count FROM ${this.tableName}`);
      const result = stmt.get() as { count: number };
      return result.count;
    }
  }

  /**
   * 分页查询
   */
  async findPaginated(params: { page: number; pageSize: number }): Promise<{
    data: T[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const offset = (params.page - 1) * params.pageSize;

    const countStmt = this.getDb().prepare(`SELECT COUNT(*) as count FROM ${this.tableName}`);
    const countResult = countStmt.get() as { count: number };

    const stmt = this.getDb().prepare(
      `SELECT * FROM ${this.tableName} ORDER BY ${this.idColumn} LIMIT ? OFFSET ?`
    );
    const data = stmt.all(params.pageSize, offset) as T[];

    return {
      data,
      total: countResult.count,
      page: params.page,
      pageSize: params.pageSize,
    };
  }
}
