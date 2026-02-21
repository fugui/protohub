import { BaseRepository } from '../repositories/BaseRepository';

/**
 * 架构图快照实体
 */
export interface ArchitectureSnapshotEntity {
  id: number;
  name: string;
  description?: string;
  data: string;
  is_default: number;  // SQLite 使用 0/1
  is_locked: number;   // SQLite 使用 0/1
  created_by?: number;
  created_at: string;
  updated_at: string;
}

/**
 * 架构图快照 Repository
 */
export class ArchitectureSnapshotRepository extends BaseRepository<ArchitectureSnapshotEntity> {
  constructor() {
    super('architecture_snapshots', 'id');
  }

  /**
   * 获取默认快照
   */
  findDefault(): ArchitectureSnapshotEntity | undefined {
    return this.findOne({ is_default: 1 });
  }

  /**
   * 获取所有快照（按创建时间倒序）
   */
  findAllOrdered(): ArchitectureSnapshotEntity[] {
    const stmt = this.getDb().prepare(
      `SELECT * FROM ${this.tableName} ORDER BY created_at DESC`
    );
    return stmt.all() as ArchitectureSnapshotEntity[];
  }

  /**
   * 设置默认快照
   */
  setDefault(id: number): void {
    const db = this.getDb();
    db.transaction(() => {
      // 先取消其他默认
      db.prepare(`UPDATE ${this.tableName} SET is_default = 0`).run();
      // 设置新的默认
      this.update(id, { is_default: 1 });
    })();
  }

  /**
   * 创建快照
   */
  createSnapshot(
    name: string, 
    data: object, 
    description?: string,
    createdBy?: number,
    isDefault: boolean = false
  ): number {
    // 如果设为默认，先取消其他默认
    if (isDefault) {
      this.getDb().prepare(`UPDATE ${this.tableName} SET is_default = 0`).run();
    }

    const result = this.insert({
      name,
      description,
      data: JSON.stringify(data),
      is_default: isDefault ? 1 : 0,
      is_locked: 0,
      created_by: createdBy,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    return Number(result.lastInsertRowid);
  }

  /**
   * 更新快照数据
   */
  updateData(id: number, data: object): void {
    this.update(id, {
      data: JSON.stringify(data),
      updated_at: new Date().toISOString()
    });
  }

  /**
   * 锁定/解锁快照
   */
  setLocked(id: number, locked: boolean): void {
    this.update(id, {
      is_locked: locked ? 1 : 0,
      updated_at: new Date().toISOString()
    });
  }

  /**
   * 解析快照数据
   */
  parseData(entity: ArchitectureSnapshotEntity): any {
    try {
      return JSON.parse(entity.data);
    } catch {
      return null;
    }
  }
}

export const architectureSnapshotRepository = new ArchitectureSnapshotRepository();
