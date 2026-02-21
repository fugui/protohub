import { BaseRepository } from '../repositories/BaseRepository';

/**
 * 架构层级实体
 */
export interface ArchitectureLayerEntity {
  id: number;
  name: string;
  level: number;
  color?: string;
  description?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * 架构层级 Repository
 */
export class ArchitectureLayerRepository extends BaseRepository<ArchitectureLayerEntity> {
  constructor() {
    super('architecture_layers', 'id');
  }

  /**
   * 根据层级获取
   */
  findByLevel(level: number): ArchitectureLayerEntity | undefined {
    return this.findOne({ level });
  }

  /**
   * 获取所有层级（按排序）
   */
  findAllOrdered(): ArchitectureLayerEntity[] {
    const stmt = this.getDb().prepare(
      `SELECT * FROM ${this.tableName} ORDER BY sort_order ASC`
    );
    return stmt.all() as ArchitectureLayerEntity[];
  }
}

export const architectureLayerRepository = new ArchitectureLayerRepository();
