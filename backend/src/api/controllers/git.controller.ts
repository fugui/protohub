/**
 * Git 控制器
 */

import {
  getGitRepos as getRepos,
  createGitRepo as addGitRepo,
  importFromGit as importFromGitRepo,
  checkConsistency as checkGitConsistency,
} from '../../services/gitService';

/**
 * 获取 Git 仓库列表
 */
export async function getGitRepos(userId: number) {
  return await getRepos(userId);
}

/**
 * 创建 Git 仓库配置
 */
export async function createGitRepo(userId: number, data: any) {
  return await addGitRepo(userId, data);
}

/**
 * 从 Git 仓库导入
 */
export async function importFromGit(repoId: number, req: any) {
  return await importFromGitRepo(repoId, req);
}

/**
 * 检查一致性
 */
export async function checkConsistency(repoId: number) {
  return await checkGitConsistency(repoId);
}
