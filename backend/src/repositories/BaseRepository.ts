import type Database from 'better-sqlite3';
import type { RunResult } from 'better-sqlite3';
import { getDatabase } from '../config/db';

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
 * 基础 Repository 类
 * 提供通用的 CRUD 操作
 * 
 * 注意：better-sqlite3 是同步的，所以方法都返回同步结果
 */
export class BaseRepository<T = any> {
  constructor(
    protected tableName: string,
    protected idColumn: string = 'id'
  ) {}

  /**
   * 获取数据库连接 (public 以便 Service 层使用)
   */
  getDb(): Database.Database {
    return getDatabase();
  }

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
   * 根据条件查找单条记录
   */
  findOne(where: Record<string, any>): T | undefined {
    const conditions = Object.keys(where);
    const whereClause = conditions.map(key => `${key} = ?`).join(' AND ');

    const stmt = this.getDb().prepare(
      `SELECT * FROM ${this.tableName} WHERE ${whereClause}`
    );
    const values = conditions.map(key => where[key as string]);

    return stmt.get(...values) as T | undefined;
  }

  /**
   * 根据条件查找多条记录
   */
  findMany(where: Record<string, any>): T[] {
    const conditions = Object.keys(where);
    const whereClause = conditions.map(key => `${key} = ?`).join(' AND ');

    const stmt = this.getDb().prepare(
      `SELECT * FROM ${this.tableName} WHERE ${whereClause}`
    );
    const values = conditions.map(key => where[key as string]);

    return stmt.all(...values) as T[];
  }

  /**
   * 插入记录
   */
  insert(data: Partial<T>): RunResult {
    const keys = Object.keys(data);
    const placeholders = keys.map(() => '?');
    const columns = keys.join(', ');
    const values = keys.map(key => (data as any)[key]);

    const stmt = this.getDb().prepare(
      `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders.join(', ')})`
    );
    return stmt.run(...values);
  }

  /**
   * 更新记录
   */
  update(id: number, data: Partial<T>): RunResult {
    const keys = Object.keys(data);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const values = keys.map(key => (data as any)[key]);

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
   * 计数查询结果
   */
  count(where?: Record<string, any>): number {
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
    const sql = `SELECT * FROM ${this.tableName} ${whereClause} ORDER BY ${this.idColumn} LIMIT ? OFFSET ?`;
    const dataStmt = this.getDb().prepare(sql);
    const data = dataStmt.all(...values, pageSize, offset) as T[];

    return {
      data,
      total: count,
      page,
      pageSize,
    };
  }

  /**
   * 检查记录是否存在
   */
  exists(conditions: Record<string, any>): boolean {
    const record = this.findOne(conditions);
    return record !== undefined;
  }
}
