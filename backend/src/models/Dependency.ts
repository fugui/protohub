/**
 * 依赖关系数据模型
 */

import type { DependencyEntity } from 'protohub-shared';
import { BaseRepository } from '../repositories/BaseRepository';
import type Database from 'better-sqlite3';
import { getDatabase } from '../config/db';

export class DependencyRepository extends BaseRepository<DependencyEntity> {
  constructor() {
    super('dependencies', 'id');
  }

  public getDb(): Database.Database {
    return getDatabase();
  }

  /**
   * 根据源文件 ID 查询依赖关系
   */
  findBySourceFileId(sourceFileId: number): DependencyEntity[] {
    return this.findMany({ source_file_id: sourceFileId });
  }

  /**
   * 根据目标文件 ID 查询被依赖关系
   */
  findByTargetFileId(targetFileId: number): DependencyEntity[] {
    return this.findMany({ target_file_id: targetFileId });
  }

  /**
   * 创建依赖关系
   */
  create(data: Omit<DependencyEntity, 'id'>): number {
    const result = this.insert({
      ...data,
      created_at: new Date().toISOString(),
    });
    return Number(result.lastInsertRowid);
  }

  /**
   * 删除文件的所有依赖关系
   */
  deleteByFileId(fileId: number): void {
    const db = this.getDb();
    db.prepare(`DELETE FROM dependencies WHERE source_file_id = ?`).run(fileId);
    db.prepare(`DELETE FROM dependencies WHERE target_file_id = ?`).run(fileId);
  }

  /**
   * 删除单个依赖关系
   */
  deleteDependency(id: number): void {
    this.delete(id);
  }

  /**
   * 检查依赖关系是否存在
   */
  dependencyExists(sourceFileId: number, targetFileId: number): boolean {
    const existing = this.findOne({ source_file_id: sourceFileId, target_file_id: targetFileId });
    return existing !== undefined;
  }

  /**
   * 查询所有依赖关系
   */
  findAll(): DependencyEntity[] {
    return super.findAll();
  }

  /**
   * 检测循环依赖
   */
  detectCircularDependencies(): string[][] {
    const db = this.getDb();
    const allDeps = db
      .prepare(`
        SELECT source_file_id, target_file_id
        FROM dependencies
      `)
      .all() as Array<{ source_file_id: number; target_file_id: number }>;

    // 构建邻接表
    const graph = new Map<number, number[]>();
    for (const dep of allDeps) {
      if (!graph.has(dep.source_file_id)) {
        graph.set(dep.source_file_id, []);
      }
      graph.get(dep.source_file_id)!.push(dep.target_file_id);
    }

    // DFS 检测环
    const cycles: string[][] = [];
    const visited = new Set<number>();
    const recursionStack = new Set<number>();
    const path: number[] = [];

    const dfs = (nodeId: number): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const neighbors = graph.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) {
            return true;
          }
        } else if (recursionStack.has(neighbor)) {
          // 发现环
          const cycleIndex = path.indexOf(neighbor);
          cycles.push(path.slice(cycleIndex).map((id) => id.toString()));
          return true;
        }
      }

      path.pop();
      recursionStack.delete(nodeId);
      return false;
    };

    for (const nodeId of graph.keys()) {
      if (!visited.has(nodeId)) {
        dfs(nodeId);
      }
    }

    return cycles;
  }
}

// 导出单例
export const dependencyRepository = new DependencyRepository();
