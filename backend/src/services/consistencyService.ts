/**
 * 一致性检查服务
 */

import { gitRepoRepository } from '../models/GitRepo';
import { protoFileRepository } from '../models/ProtoFile';
import { NotFoundError } from '../middlewares/errorHandler';

/**
 * 一致性检查结果
 */
export interface ConsistencyDifference {
  file: string;
  type: 'added' | 'modified' | 'deleted';
  details: string;
}

/**
 * 检查 Git 仓库与本地文件一致性
 */
export async function checkGitConsistency(
  repoId: number
): Promise<{ consistent: boolean; differences: ConsistencyDifference[] }> {
  const entity = gitRepoRepository.findById(repoId);
  if (!entity) {
    throw new NotFoundError('Git 仓库配置不存在');
  }

  // 获取数据库中的文件
  const dbFiles = protoFileRepository.findMany({ git_repo_id: repoId });
  const dbFilePaths = new Set(
    dbFiles
      .filter((f) => f.git_file_path)
      .map((f) => f.git_file_path!)
  );

  // 获取 Git 中的文件（通过 Git 服务）
  // TODO: 与 gitService 集成，这里简化处理
  const gitFilePaths: Set<string> = new Set();

  const differences: ConsistencyDifference[] = [];

  // 检查新增的文件
  for (const filePath of gitFilePaths) {
    if (!dbFilePaths.has(filePath)) {
      differences.push({
        file: filePath,
        type: 'added',
        details: 'Git 中存在但数据库中不存在',
      });
    }
  }

  // 检查删除的文件
  for (const filePath of dbFilePaths) {
    if (!gitFilePaths.has(filePath)) {
      differences.push({
        file: filePath,
        type: 'deleted',
        details: '数据库中存在但 Git 中不存在',
      });
    }
  }

  return {
    consistent: differences.length === 0,
    differences,
  };
}

/**
 * 计算文件哈希（用于检测修改）
 */
export function calculateFileHash(content: string): string {
  // 简单的哈希算法，生产环境应使用更安全的算法
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}
