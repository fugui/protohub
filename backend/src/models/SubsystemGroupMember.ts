import { BaseRepository } from '../repositories/BaseRepository';

/**
 * 子系统分组关联实体
 */
export interface SubsystemGroupMemberEntity {
  id: number;
  group_id: number;
  subsystem_id: number;
  position_x?: number;
  position_y?: number;
  created_at: string;
}

/**
 * 子系统分组关联 Repository
 */
export class SubsystemGroupMemberRepository extends BaseRepository<SubsystemGroupMemberEntity> {
  constructor() {
    super('subsystem_group_members', 'id');
  }

  /**
   * 根据分组获取成员
   */
  findByGroup(groupId: number): SubsystemGroupMemberEntity[] {
    return this.findMany({ group_id: groupId });
  }

  /**
   * 根据子系统获取所属分组
   */
  findBySubsystem(subsystemId: number): SubsystemGroupMemberEntity[] {
    return this.findMany({ subsystem_id: subsystemId });
  }

  /**
   * 将子系统添加到分组
   */
  addToGroup(groupId: number, subsystemId: number, positionX?: number, positionY?: number): number {
    const result = this.insert({
      group_id: groupId,
      subsystem_id: subsystemId,
      position_x: positionX,
      position_y: positionY,
      created_at: new Date().toISOString()
    });
    return Number(result.lastInsertRowid);
  }

  /**
   * 从分组移除子系统
   */
  removeFromGroup(groupId: number, subsystemId: number): void {
    const stmt = this.getDb().prepare(
      `DELETE FROM ${this.tableName} WHERE group_id = ? AND subsystem_id = ?`
    );
    stmt.run(groupId, subsystemId);
  }

  /**
   * 更新子系统在分组内的位置
   */
  updatePosition(groupId: number, subsystemId: number, x: number, y: number): void {
    const stmt = this.getDb().prepare(
      `UPDATE ${this.tableName} SET position_x = ?, position_y = ? WHERE group_id = ? AND subsystem_id = ?`
    );
    stmt.run(x, y, groupId, subsystemId);
  }

  /**
   * 获取子系统所在的所有分组
   */
  getGroupsForSubsystem(subsystemId: number): number[] {
    const members = this.findBySubsystem(subsystemId);
    return members.map(m => m.group_id);
  }
}

export const subsystemGroupMemberRepository = new SubsystemGroupMemberRepository();
