/**
 * 功能模块服务
 */

import { functionModuleRepository } from '../models/FunctionModule';
import type { FunctionModule } from 'protohub-shared';

/**
 * 获取所有功能模块
 */
export function getFunctionModules(): FunctionModule[] {
  const entities = functionModuleRepository.findAll();
  return entities.map((entity) => ({
    id: entity.id,
    name: entity.name,
    description: entity.description || undefined,
    owner: entity.owner || undefined,
    createdAt: entity.created_at,
  }));
}

/**
 * 根据 ID 获取功能模块
 */
export function getFunctionModuleById(id: number): FunctionModule | undefined {
  const entity = functionModuleRepository.findById(id);
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
 * 创建功能模块
 */
export function createFunctionModule(
  data: { name: string; description?: string; owner?: string }
): FunctionModule {
  const id = functionModuleRepository.create({
    name: data.name,
    description: data.description || null,
    owner: data.owner || null,
    created_at: new Date().toISOString(),
  });

  const entity = functionModuleRepository.findById(id);
  return {
    id: entity!.id,
    name: entity!.name,
    description: entity!.description || undefined,
    owner: entity!.owner || undefined,
    createdAt: entity!.created_at,
  };
}
