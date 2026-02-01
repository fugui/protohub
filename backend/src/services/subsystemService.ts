/**
 * 子系统服务
 */

import { subsystemRepository } from '../models/Subsystem';
import type { Subsystem } from 'protohub-shared';

/**
 * 获取所有子系统
 */
export function getSubsystems(): Subsystem[] {
  const entities = subsystemRepository.findAll();
  return entities.map((entity) => ({
    id: entity.id,
    name: entity.name,
    description: entity.description || undefined,
    owner: entity.owner || undefined,
    createdAt: entity.created_at,
  }));
}

/**
 * 根据 ID 获取子系统
 */
export function getSubsystemById(id: number): Subsystem | undefined {
  const entity = subsystemRepository.findById(id);
  if (!entity) {
    return undefined;
  }

  return {
    id: entity.id,
    name: entity.name,
    description: entity.description || undefined,
    owner: entity.owner || undefined,
    createdAt: entity.created_at,
  };
}

/**
 * 创建子系统
 */
export function createSubsystem(
  data: { name: string; description?: string; owner?: string },
  userId?: number
): Subsystem {
  const id = subsystemRepository.create({
    name: data.name,
    description: data.description || null,
    owner: data.owner || null,
  });

  const entity = subsystemRepository.findById(id);
  return {
    id: entity!.id,
    name: entity!.name,
    description: entity!.description || undefined,
    owner: entity!.owner || undefined,
    createdAt: entity!.created_at,
  };
}
