import { BaseRepository } from '../repositories/BaseRepository';

/**
 * 架构节点位置实体
 */
export interface ArchitectureNodePositionEntity {
  id: number;
  node_id: string;           // 节点ID：sub_123 或 group_456
  node_type: string;         // 'subsystem' 或 'group'
  x: number;
  y: number;
  width: number;
  height: number;
  layer_level?: number;
  parent_group_id?: number;
  created_at: string;
  updated_at: string;
}

/**
 * 架构节点位置 Repository
 */
export class ArchitectureNodePositionRepository extends BaseRepository<ArchitectureNodePositionEntity> {
  constructor() {
    super('architecture_node_positions', 'id');
  }

  /**
   * 根据节点ID查找
   */
  findByNodeId(nodeId: string): ArchitectureNodePositionEntity | undefined {
    return this.findOne({ node_id: nodeId });
  }

  /**
   * 根据层级获取节点
   */
  findByLayer(layerLevel: number): ArchitectureNodePositionEntity[] {
    return this.findMany({ layer_level: layerLevel });
  }

  /**
   * 根据分组获取节点
   */
  findByGroup(groupId: number): ArchitectureNodePositionEntity[] {
    return this.findMany({ parent_group_id: groupId });
  }

  /**
   * 保存或更新节点位置
   */
  savePosition(
    nodeId: string, 
    nodeType: string, 
    x: number, 
    y: number, 
    layerLevel?: number,
    parentGroupId?: number,
    width: number = 120,
    height: number = 60
  ): void {
    const existing = this.findByNodeId(nodeId);
    
    if (existing) {
      this.update(existing.id, {
        x, y, width, height,
        layer_level: layerLevel,
        parent_group_id: parentGroupId,
        updated_at: new Date().toISOString()
      });
    } else {
      this.insert({
        node_id: nodeId,
        node_type: nodeType,
        x, y, width, height,
        layer_level: layerLevel,
        parent_group_id: parentGroupId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  }

  /**
   * 批量保存位置
   */
  batchSavePositions(positions: Array<{
    nodeId: string;
    nodeType: string;
    x: number;
    y: number;
    layerLevel?: number;
    parentGroupId?: number;
    width?: number;
    height?: number;
  }>): void {
    const db = this.getDb();
    const insertStmt = db.prepare(`
      INSERT INTO ${this.tableName} 
      (node_id, node_type, x, y, layer_level, parent_group_id, width, height, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const updateStmt = db.prepare(`
      UPDATE ${this.tableName} 
      SET x = ?, y = ?, layer_level = ?, parent_group_id = ?, width = ?, height = ?, updated_at = ?
      WHERE node_id = ?
    `);

    db.transaction(() => {
      for (const pos of positions) {
        const existing = this.findByNodeId(pos.nodeId);
        const now = new Date().toISOString();
        
        if (existing) {
          updateStmt.run(
            pos.x, pos.y, pos.layerLevel, pos.parentGroupId,
            pos.width || 120, pos.height || 60, now, pos.nodeId
          );
        } else {
          insertStmt.run(
            pos.nodeId, pos.nodeType, pos.x, pos.y,
            pos.layerLevel, pos.parentGroupId,
            pos.width || 120, pos.height || 60, now, now
          );
        }
      }
    })();
  }

  /**
   * 删除节点位置
   */
  deleteByNodeId(nodeId: string): void {
    const stmt = this.getDb().prepare(
      `DELETE FROM ${this.tableName} WHERE node_id = ?`
    );
    stmt.run(nodeId);
  }

  /**
   * 清空所有位置（重置布局）
   */
  clearAll(): void {
    this.getDb().exec(`DELETE FROM ${this.tableName}`);
  }
}

export const architectureNodePositionRepository = new ArchitectureNodePositionRepository();
