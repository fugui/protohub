import { BaseRepository } from '../repositories/BaseRepository';

/**
 * 子系统实体（原分组）
 */
export interface SubsystemEntity {
  id: number;
  name: string;
  layer_id?: number | null;
  parent_subsystem_id?: number | null;
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
 * 子系统 Repository
 */
export class SubsystemRepository extends BaseRepository<SubsystemEntity> {
  constructor() {
    super('subsystems', 'id');
  }

  /**
   * 根据层级获取子系统
   */
  findByLayer(layerId: number): SubsystemEntity[] {
    return this.findMany({ layer_id: layerId });
  }

  /**
   * 获取顶层子系统（无父级）
   */
  findRootSubsystems(): SubsystemEntity[] {
    const stmt = this.getDb().prepare(
      `SELECT * FROM ${this.tableName} WHERE parent_subsystem_id IS NULL`
    );
    return stmt.all() as SubsystemEntity[];
  }

  /**
   * 获取子级子系统
   */
  findChildren(parentSubsystemId: number): SubsystemEntity[] {
    return this.findMany({ parent_subsystem_id: parentSubsystemId });
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

export const subsystemRepository = new SubsystemRepository();
