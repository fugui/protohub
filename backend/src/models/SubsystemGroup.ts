import { BaseRepository } from '../repositories/BaseRepository';

/**
 * 子系统分组实体
 */
export interface SubsystemGroupEntity {
  id: number;
  name: string;
  layer_id?: number | null;
  parent_group_id?: number | null;
  color?: string | null;
  columns: number;
  position_x?: number | null;
  position_y?: number | null;
  width: number;
  height: number;
  collapsed: number;  // SQLite 使用 0/1
  created_by?: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * 子系统分组 Repository
 */
export class SubsystemGroupRepository extends BaseRepository<SubsystemGroupEntity> {
  constructor() {
    super('subsystem_groups', 'id');
  }

  /**
   * 根据层级获取分组
   */
  findByLayer(layerId: number): SubsystemGroupEntity[] {
    return this.findMany({ layer_id: layerId });
  }

  /**
   * 获取顶层分组（无父分组）
   */
  findRootGroups(): SubsystemGroupEntity[] {
    const stmt = this.getDb().prepare(
      `SELECT * FROM ${this.tableName} WHERE parent_group_id IS NULL`
    );
    return stmt.all() as SubsystemGroupEntity[];
  }

  /**
   * 获取子分组
   */
  findChildren(parentGroupId: number): SubsystemGroupEntity[] {
    return this.findMany({ parent_group_id: parentGroupId });
  }

  /**
   * 更新位置
   */
  updatePosition(id: number, x: number, y: number): void {
    this.update(id, {
      position_x: x,
      position_y: y,
      updated_at: new Date().toISOString()
    });
  }

  /**
   * 更新尺寸
   */
  updateSize(id: number, width: number, height: number): void {
    this.update(id, {
      width,
      height,
      updated_at: new Date().toISOString()
    });
  }

  /**
   * 切换折叠状态
   */
  toggleCollapsed(id: number, collapsed: boolean): void {
    this.update(id, {
      collapsed: collapsed ? 1 : 0,
      updated_at: new Date().toISOString()
    });
  }
}

export const subsystemGroupRepository = new SubsystemGroupRepository();
