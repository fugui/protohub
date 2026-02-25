import { BaseRepository } from '../repositories/BaseRepository';

/**
 * 子系统成员实体（子系统与功能模块的关联）
 */
export interface SubsystemMemberEntity {
  id: number;
  subsystem_id: number;
  function_module_id: number;
  position_x?: number;
  position_y?: number;
  created_at: string;
}

/**
 * 子系统成员 Repository
 */
export class SubsystemMemberRepository extends BaseRepository<SubsystemMemberEntity> {
  constructor() {
    super('subsystem_members', 'id');
  }

  /**
   * 根据子系统获取成员
   */
  findBySubsystem(subsystemId: number): SubsystemMemberEntity[] {
    return this.findMany({ subsystem_id: subsystemId });
  }

  /**
   * 根据功能模块获取所属子系统
   */
  findByFunctionModule(functionModuleId: number): SubsystemMemberEntity[] {
    return this.findMany({ function_module_id: functionModuleId });
  }

  /**
   * 将功能模块添加到子系统
   */
  addToSubsystem(subsystemId: number, functionModuleId: number, positionX?: number, positionY?: number): number {
    const result = this.insert({
      subsystem_id: subsystemId,
      function_module_id: functionModuleId,
      position_x: positionX,
      position_y: positionY,
      created_at: new Date().toISOString()
    });
    return Number(result.lastInsertRowid);
  }

  /**
   * 从子系统移除功能模块
   */
  removeFromSubsystem(subsystemId: number, functionModuleId: number): void {
    const stmt = this.getDb().prepare(
      `DELETE FROM ${this.tableName} WHERE subsystem_id = ? AND function_module_id = ?`
    );
    stmt.run(subsystemId, functionModuleId);
  }

  /**
   * 更新功能模块在子系统内的位置
   */
  updatePosition(subsystemId: number, functionModuleId: number, x: number, y: number): void {
    const stmt = this.getDb().prepare(
      `UPDATE ${this.tableName} SET position_x = ?, position_y = ? WHERE subsystem_id = ? AND function_module_id = ?`
    );
    stmt.run(x, y, subsystemId, functionModuleId);
  }

  /**
   * 获取功能模块所在的所有子系统
   */
  getSubsystemsForFunctionModule(functionModuleId: number): number[] {
    const members = this.findByFunctionModule(functionModuleId);
    return members.map(m => m.subsystem_id);
  }
}

export const subsystemMemberRepository = new SubsystemMemberRepository();
