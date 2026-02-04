/**
 * 数据库 ORM 辅助类
 * 提供通用的 CRUD 操作
 */

import type { Database, RunResult } from 'better-sqlite3';

/**
 * 分页参数
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/**
 * 分页结果
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 数据库操作基类
 */
export abstract class BaseRepository<T = any> {
  constructor(
    protected tableName: string,
    protected idColumn: string = 'id'
  ) {}

  /**
   * 获取数据库连接 - 子类必须实现
   */
  protected abstract getDb(): Database;

  /**
   * 查询所有记录
   */
  findAll(): T[] {
    const stmt = this.getDb().prepare(`SELECT * FROM ${this.tableName}`);
    return stmt.all() as T[];
  }

  /**
   * 根据 ID 查询
   */
  findById(id: number): T | undefined {
    const stmt = this.getDb().prepare(
      `SELECT * FROM ${this.tableName} WHERE ${this.idColumn} = ?`
    );
    return stmt.get(id) as T | undefined;
  }

  /**
   * 根据条件查询单条记录
   */
  findOne(conditions: Record<string, any>): T | undefined {
    const keys = Object.keys(conditions);
    const values = keys.map(key => conditions[key as string]);
    const whereClause = keys.map(key => `${key} = ?`).join(' AND ');

    const stmt = this.getDb().prepare(
      `SELECT * FROM ${this.tableName} WHERE ${whereClause}`
    );
    return stmt.get(...values) as T | undefined;
  }

  /**
   * 根据条件查询多条记录
   */
  findMany(conditions: Record<string, any>): T[] {
    const keys = Object.keys(conditions);
    const values = keys.map(key => conditions[key as string]);
    const whereClause = keys.map(key => `${key} = ?`).join(' AND ');
    const stmt = this.getDb().prepare(
      `SELECT * FROM ${this.tableName} WHERE ${whereClause}`
    );
    return stmt.all(...values) as T[];
  }

  /**
   * 分页查询
   */
  findPaginated(
    params: PaginationParams = {},
    conditions: Record<string, any> = {}
  ): PaginatedResult<T> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const offset = (page - 1) * pageSize;

    // 构建查询条件
    const keys = Object.keys(conditions);
    const values = keys.map(key => conditions[key as string]);
    const whereClause = keys.length > 0 ? `WHERE ${keys.map(key => `${key} = ?`).join(' AND ')}` : '';

    // 查询总数
    const countStmt = this.getDb().prepare(
      `SELECT COUNT(*) as count FROM ${this.tableName} ${whereClause}`
    );
    const { count } = countStmt.get(...values) as { count: number };

    // 查询数据
    const dataStmt = this.getDb().prepare(
      `SELECT * FROM ${this.tableName} ${whereClause} LIMIT ? OFFSET ?`
    );
    const data = dataStmt.all(...values, pageSize, offset) as T[];

    return {
      data,
      total: count,
      page,
      pageSize,
    };
  }

  /**
   * 插入记录
   */
  insert(data: Omit<T, keyof T>): RunResult {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');

    const stmt = this.getDb().prepare(
      `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${placeholders})`
    );
    return stmt.run(...values);
  }

  /**
   * 更新记录
   */
  update(id: number, data: Partial<T>): RunResult {
    const keys = Object.keys(data);
    const values = Object.values(data);

    if (keys.length === 0) {
      throw new Error('Update data is empty');
    }

    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const stmt = this.getDb().prepare(
      `UPDATE ${this.tableName} SET ${setClause} WHERE ${this.idColumn} = ?`
    );
    return stmt.run(...values, id);
  }

  /**
   * 删除记录
   */
  delete(id: number): RunResult {
    const stmt = this.getDb().prepare(
      `DELETE FROM ${this.tableName} WHERE ${this.idColumn} = ?`
    );
    return stmt.run(id);
  }

  /**
   * 根据条件删除
   */
  deleteMany(conditions: Record<string, any>): RunResult {
    const keys = Object.keys(conditions);
    const values = keys.map(key => conditions[key as string]);
    const whereClause = keys.map(key => `${key} = ?`).join(' AND ');
    const stmt = this.getDb().prepare(
      `DELETE FROM ${this.tableName} WHERE ${whereClause}`
    );
    return stmt.run(...values);
  }

  /**
   * 计数
   */
  count(conditions: Record<string, any> = {}): number {
    const keys = Object.keys(conditions);
    const values = keys.map(key => conditions[key as string]);
    const whereClause = keys.length > 0 ? `WHERE ${keys.map(key => `${key} = ?`).join(' AND ')}` : '';
    const stmt = this.getDb().prepare(
      `SELECT COUNT(*) as count FROM ${this.tableName} ${whereClause}`
    );
    const result = stmt.get(...values) as { count: number };
    return result.count;
  }

  /**
   * 检查记录是否存在
   */
  exists(conditions: Record<string, any>): boolean {
    const record = this.findOne(conditions);
    return record !== undefined;
  }
}

/**
 * 事务辅助函数
 */
export function transaction<R>(
  db: Database,
  fn: () => R
): R {
  const stmt = db.prepare('BEGIN TRANSACTION');
  stmt.run();
  try {
    const result = fn();
    const commitStmt = db.prepare('COMMIT');
    commitStmt.run();
    return result;
  } catch (error) {
    const rollbackStmt = db.prepare('ROLLBACK');
    rollbackStmt.run();
    throw error;
  }
}
