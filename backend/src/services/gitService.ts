/**
 * Git 服务
 */

import fs from 'fs/promises';
import path from 'path';
import simpleGit, { SimpleGit } from 'simple-git';
import { gitRepoRepository } from '../models/GitRepo';
import { protoFileRepository } from '../models/ProtoFile';
import { GitRepo, ProtoFile, GitImportResponse } from 'protohub-shared';
import { NotFoundError } from '../middlewares/errorHandler';
import { parseProtoFile } from '../utils/protoParser';

// Git 缓存目录
const GIT_CACHE_DIR = path.join(process.cwd(), '../../storage/git-cache');

/**
 * 确保 Git 缓存目录存在
 */
async function ensureGitCacheDir(repoId: number): Promise<string> {
  const repoDir = path.join(GIT_CACHE_DIR, repoId.toString());
  await fs.mkdir(repoDir, { recursive: true });
  return repoDir;
}

/**
 * 获取 Git 实例
 */
async function getGitInstance(repoId: number, repo: GitRepo): Promise<SimpleGit> {
  const repoDir = await ensureGitCacheDir(repoId);

  // 检查是否已克隆
  const exists = await fs.access(repoDir).then(() => true).catch(() => false);

  if (!exists) {
    // 克隆仓库
    const git = simpleGit();

    if (repo.username && repo.password) {
      // HTTPS 认证
      const url = repo.repoUrl.replace('https://', `https://${repo.username}:${repo.password}@`);
      await git.clone(url, repoDir);
    } else if (repo.sshKey) {
      // SSH 认证
      // TODO: 配置 SSH key
      await git.clone(repo.repoUrl, repoDir);
    } else {
      // 无认证
      await git.clone(repo.repoUrl, repoDir);
    }
  }

  return simpleGit(repoDir);
}

/**
 * 扫描 Proto 文件
 */
async function scanProtoFiles(git: SimpleGit, repoDir: string): Promise<string[]> {
  const protoFiles: string[] = [];

  try {
    const result = await git.raw(['ls-tree', '-r', 'HEAD', '--name-only']);
    const lines = result.trim().split('\n');

    for (const line of lines) {
      if (line.endsWith('.proto')) {
        protoFiles.push(path.join(repoDir, line));
      }
    }
  } catch (error) {
    console.error('扫描 Proto 文件失败:', error);
  }

  return protoFiles;
}

/**
 * 获取 Git 仓库列表
 */
export function getGitRepos(userId: number): GitRepo[] {
  const entities = gitRepoRepository.findByUserId(userId);
  return entities.map((entity) => ({
    id: entity.id,
    userId: entity.user_id,
    name: entity.name,
    repoUrl: entity.repo_url,
    branch: entity.branch,
    lastSyncAt: entity.last_sync_at || undefined,
    createdAt: entity.created_at,
  }));
}

/**
 * 创建 Git 仓库配置
 */
export async function createGitRepo(userId: number, data: any): Promise<GitRepo> {
  // 验证仓库数量限制
  const count = gitRepoRepository.countByUserId(userId);
  if (count >= 5) {
    throw new Error('最多只能配置 5 个 Git 仓库');
  }

  // 验证 URL 格式
  const urlPattern = /^(https?:\/\/|git@|ssh:\/\/)/;
  if (!urlPattern.test(data.repoUrl)) {
    throw new Error('无效的 Git 仓库 URL');
  }

  // 创建仓库配置
  const repoId = gitRepoRepository.create({
    user_id: userId,
    name: data.name,
    repo_url: data.repoUrl,
    branch: data.branch || 'main',
    username: data.username || null,
    password: data.password || null,
    ssh_key: data.sshKey || null,
    created_at: new Date().toISOString(),
  });

  const entity = gitRepoRepository.findById(repoId);
  if (!entity) {
    throw new Error('Git 仓库配置创建失败');
  }

  return {
    id: entity.id,
    userId: entity.user_id,
    name: entity.name,
    repoUrl: entity.repo_url,
    branch: entity.branch,
    lastSyncAt: entity.last_sync_at || undefined,
    createdAt: entity.created_at,
  };
}

/**
 * 从 Git 仓库导入
 */
export async function importFromGit(repoId: number, req: any): Promise<GitImportResponse> {
  const userId = (req.user as any).userId;

  // 获取仓库配置
  const entity = gitRepoRepository.findById(repoId);
  if (!entity) {
    throw new NotFoundError('Git 仓库配置不存在');
  }

  if (entity.user_id !== userId && (req.user as any).role !== 'admin') {
    throw new Error('无权限访问此仓库');
  }

  const repo: GitRepo = {
    id: entity.id,
    userId: entity.user_id,
    name: entity.name,
    repoUrl: entity.repo_url,
    branch: entity.branch,
    username: entity.username || undefined,
    password: entity.password || undefined,
    sshKey: entity.ssh_key || undefined,
    lastSyncAt: entity.last_sync_at || undefined,
    createdAt: entity.created_at,
  };

  const git = await getGitInstance(repoId, repo);

  // 拉取最新代码
  try {
    await git.fetch();
    await git.checkout(entity.branch);
    await git.pull('origin', entity.branch);
  } catch (error) {
    console.error('Git 拉取失败:', error);
    throw new Error('Git 拉取失败，请检查网络和认证信息');
  }

  // 扫描 Proto 文件
  const repoDir = await ensureGitCacheDir(repoId);
  const protoFiles = await scanProtoFiles(git, repoDir);

  // 导入文件
  const importedFiles: ProtoFile[] = [];
  const errors: Array<{ file: string; error: string }> = [];

  for (const filePath of protoFiles) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const relativePath = path.relative(repoDir, filePath);

      // 解析 Proto 文件
      const parsed = parseProtoFile(content);
      if (!parsed.packageName) {
        errors.push({ file: relativePath, error: '缺少 package 声明' });
        continue;
      }

      // 检查是否已存在
      const existing = protoFileRepository.findByPackageName(parsed.packageName);
      if (existing) {
        errors.push({ file: relativePath, error: '包名已存在' });
        continue;
      }

      // 创建文件记录
      const fileId = protoFileRepository.create({
        filename: path.basename(filePath),
        file_path: filePath,
        package_name: parsed.packageName,
        function_module_id: null,
        git_repo_id: repoId,
        git_file_path: relativePath,
        status: 'draft',
        current_version: 1,
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        locked: 0,
      });

      const fileEntity = protoFileRepository.findById(fileId);
      if (fileEntity) {
        importedFiles.push({
          id: fileEntity.id,
          filename: fileEntity.filename,
          packageName: fileEntity.package_name,
          subsystem: fileEntity.function_module_id,
          status: fileEntity.status,
          currentVersion: fileEntity.current_version,
          createdBy: { id: fileEntity.created_by, username: '', email: '', role: 'developer', createdAt: '' },
          createdAt: fileEntity.created_at,
          updatedAt: fileEntity.updated_at,
          locked: fileEntity.locked === 1,
          lockedBy: fileEntity.locked_by ? { id: fileEntity.locked_by, username: '', email: '', role: 'developer', createdAt: '' } : null,
          lockedAt: fileEntity.locked_at,
        });
      }
    } catch (error: any) {
      errors.push({ file: path.basename(filePath), error: error.message });
    }
  }

  // 更新最后同步时间
  gitRepoRepository.updateLastSync(repoId);

  return {
    importedCount: importedFiles.length,
    files: importedFiles,
    errors,
  };
}

/**
 * 检查一致性
 */
export async function checkConsistency(repoId: number): Promise<{
  consistent: boolean;
  differences: Array<{ file: string; type: 'added' | 'modified' | 'deleted'; details: string }>;
}> {
  const entity = gitRepoRepository.findById(repoId);
  if (!entity) {
    throw new NotFoundError('Git 仓库配置不存在');
  }

  const repo: GitRepo = {
    id: entity.id,
    userId: entity.user_id,
    name: entity.name,
    repoUrl: entity.repo_url,
    branch: entity.branch,
    lastSyncAt: entity.last_sync_at || undefined,
    createdAt: entity.created_at,
  };

  // 获取 Git 实例并拉取
  const git = await getGitInstance(repoId, repo);
  const repoDir = await ensureGitCacheDir(repoId);

  await git.fetch();
  await git.checkout(entity.branch);

  // 扫描 Git 中的 Proto 文件
  const gitFiles = await scanProtoFiles(git, repoDir);

  // 获取数据库中的文件
  const dbFiles = protoFileRepository.findMany({ git_repo_id: repoId });

  const differences: Array<{ file: string; type: 'added' | 'modified' | 'deleted'; details: string }> = [];

  // 检查新增的文件
  for (const filePath of gitFiles) {
    const relativePath = path.relative(repoDir, filePath);
    const exists = dbFiles.find((f) => f.git_file_path === relativePath);
    if (!exists) {
      differences.push({ file: relativePath, type: 'added', details: 'Git 中存在但数据库中不存在' });
    }
  }

  // 检查删除的文件
  for (const dbFile of dbFiles) {
    if (dbFile.git_file_path) {
      const exists = gitFiles.find((f) => path.relative(repoDir, f) === dbFile.git_file_path);
      if (!exists) {
        differences.push({ file: dbFile.git_file_path, type: 'deleted', details: '数据库中存在但 Git 中不存在' });
      }
    }
  }

  // TODO: 检查修改的文件（需要比较文件内容或哈希）

  return {
    consistent: differences.length === 0,
    differences,
  };
}
