/**
 * Git 仓库服务
 */

import { api } from './api';
import type { GitRepo } from 'protohub-shared';

/**
 * 创建 Git 仓库配置
 */
export async function createGitRepo(data: {
  name: string;
  repoUrl: string;
  branch?: string;
  username?: string;
  password?: string;
  sshKey?: string;
}): Promise<GitRepo> {
  const response = await api.post('/git-repos', data);
  return response.data;
}

/**
 * 从 Git 仓库导入
 */
export async function importFromGit(repoId: number): Promise<{
  importedCount: number;
  files: any[];
  errors: Array<{ file: string; error: string }>;
}> {
  const response = await api.post(`/git-repos/${repoId}/import`);
  return response.data;
}
