/**
 * 文件服务
 */

import fs from 'fs/promises';
import path from 'path';
import { protoFileRepository } from '../models/ProtoFile';
import { fileVersionRepository } from '../models/FileVersion';
import { dependencyRepository } from '../models/Dependency';
import { subsystemRepository } from '../models/Subsystem';
import { FileStatus, ProtoFile, PaginatedResponse } from 'protohub-shared';
import { NotFoundError, ConflictError, ValidationError } from '../middlewares/errorHandler';
import { parseProtoFile, extractDependencies } from '../utils/protoParser';

// 文件存储根目录
const STORAGE_DIR = path.join(process.cwd(), '../../storage/proto-files');

/**
 * 确保文件存储目录存在
 */
async function ensureStorageDir(fileId: number): Promise<string> {
  const fileDir = path.join(STORAGE_DIR, fileId.toString());
  await fs.mkdir(fileDir, { recursive: true });
  return fileDir;
}

/**
 * 获取文件列表
 */
export function getFiles(params: {
  page: number;
  pageSize: number;
  subsystemId?: number;
  status?: string;
  search?: string;
}): PaginatedResponse<ProtoFile> {
  let query: any = {};

  if (params.subsystemId !== undefined) {
    query.subsystem_id = params.subsystemId;
  }

  if (params.status) {
    query.status = params.status;
  }

  // TODO: 实现搜索功能
  // if (params.search) { ... }

  const result = protoFileRepository.findPaginated({
    page: params.page,
    pageSize: params.pageSize,
  });

  return {
    data: result.data.map(mapEntityToProtoFile),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
  };
}

/**
 * 根据 ID 获取文件
 */
export async function getFileById(fileId: number): Promise<ProtoFile & { content: string }> {
  const entity = protoFileRepository.findById(fileId);
  if (!entity) {
    throw new NotFoundError('文件不存在');
  }

  // 读取文件内容
  let content = '';
  try {
    content = await fs.readFile(entity.file_path, 'utf-8');
  } catch (error) {
    console.error(`读取文件失败: ${entity.file_path}`, error);
  }

  return {
    ...mapEntityToProtoFile(entity),
    content,
  };
}

/**
 * 创建文件
 */
export async function createFile(
  req: any,
  data: { subsystemId: number; filename?: string; content?: string }
): Promise<ProtoFile> {
  const userId = (req.user as any).userId;

  // 验证子系统是否存在
  const subsystem = subsystemRepository.findById(data.subsystemId);
  if (!subsystem) {
    throw new ValidationError('子系统不存在');
  }

  // 获取文件内容
  let content = data.content;
  let filename = data.filename;

  if (req.file) {
    content = req.file.buffer.toString('utf-8');
    filename = req.file.originalname;
  }

  if (!content) {
    throw new ValidationError('文件内容不能为空');
  }

  // 解析 Proto 文件
  const parsed = parseProtoFile(content);
  if (!parsed.packageName) {
    throw new ValidationError('无效的 Proto 文件：缺少 package 声明');
  }

  // 验证文件名和包名格式
  const filenamePattern = /^[a-z0-9]+_[a-z0-9]+_[0-9]+\.[a-z]+$/;
  if (filename && !filenamePattern.test(filename)) {
    throw new ValidationError('文件名格式不正确，应为：{子系统}_{模块}_{版本}.proto');
  }

  const packagePattern = /^[a-z0-9]+\.[a-z0-9]+$/;
  if (!packagePattern.test(parsed.packageName)) {
    throw new ValidationError('包名格式不正确，应为：{子系统}.{模块}');
  }

  // 创建文件记录
  const fileId = protoFileRepository.create({
    filename: filename || 'unnamed.proto',
    file_path: '', // 稍后设置
    package_name: parsed.packageName,
    subsystem_id: data.subsystemId,
    status: 'draft',
    current_version: 1,
    created_by: userId,
    locked: 0,
  });

  // 创建存储目录
  const fileDir = await ensureStorageDir(fileId);
  const filePath = path.join(fileDir, 'current.proto');

  // 写入文件
  await fs.writeFile(filePath, content, 'utf-8');

  // 更新文件路径
  protoFileRepository.updateFile(fileId, { file_path: filePath });

  // 创建初始版本记录
  fileVersionRepository.create({
    file_id: fileId,
    version: 1,
    content,
    file_path: filePath,
    modified_by: userId,
  });

  // 解析并存储依赖关系
  const deps = extractDependencies(content);
  for (const dep of deps) {
    // 查找被依赖的文件
    const targetFile = protoFileRepository.findByPackageName(dep);
    if (targetFile) {
      dependencyRepository.create({
        source_file_id: fileId,
        target_file_id: targetFile.id,
        dependency_type: 'import',
      });
    }
  }

  const entity = protoFileRepository.findById(fileId);
  return mapEntityToProtoFile(entity!);
}

/**
 * 更新文件
 */
export async function updateFile(
  fileId: number,
  data: { content: string; changeNote?: string },
  req: any
): Promise<ProtoFile> {
  const userId = (req.user as any).userId;

  const entity = protoFileRepository.findById(fileId);
  if (!entity) {
    throw new NotFoundError('文件不存在');
  }

  // 检查文件锁
  if (entity.locked === 1 && entity.locked_by !== userId) {
    throw new ConflictError('文件已被其他用户锁定');
  }

  // 解析 Proto 文件
  const parsed = parseProtoFile(data.content);
  if (!parsed.packageName) {
    throw new ValidationError('无效的 Proto 文件：缺少 package 声明');
  }

  // 更新文件内容
  const fileDir = await ensureStorageDir(fileId);
  const filePath = path.join(fileDir, 'current.proto');

  await fs.writeFile(filePath, data.content, 'utf-8');

  // 创建新版本
  const newVersion = entity.current_version + 1;
  const versionFilePath = path.join(fileDir, `v${newVersion}.proto`);
  await fs.writeFile(versionFilePath, data.content, 'utf-8');

  fileVersionRepository.create({
    file_id: fileId,
    version: newVersion,
    content: data.content,
    file_path: versionFilePath,
    change_note: data.changeNote || null,
    modified_by: userId,
  });

  // 更新文件记录
  protoFileRepository.updateFile(fileId, {
    package_name: parsed.packageName,
    file_path: filePath,
    current_version: newVersion,
  });

  // 清空审核状态（文件被修改）
  if (entity.status === 'approved') {
    protoFileRepository.updateFile(fileId, { status: 'draft' });
  }

  const updated = protoFileRepository.findById(fileId);
  return mapEntityToProtoFile(updated!);
}

/**
 * 删除文件
 */
export function deleteFile(fileId: number, req: any): void {
  const entity = protoFileRepository.findById(fileId);
  if (!entity) {
    throw new NotFoundError('文件不存在');
  }

  // 检查是否有其他文件依赖此文件
  const dependents = dependencyRepository.findByTargetFileId(fileId);
  if (dependents.length > 0) {
    throw new ValidationError('文件被以下文件引用，无法删除');
  }

  // 删除文件版本
  fileVersionRepository.deleteByFileId(fileId);

  // 删除依赖关系
  dependencyRepository.deleteByFileId(fileId);

  // 删除数据库记录
  protoFileRepository.delete(fileId);

  // TODO: 删除文件系统中的文件
}

/**
 * 锁定文件
 */
export function lockFile(fileId: number, req: any): any {
  const userId = (req.user as any).userId;
  const entity = protoFileRepository.findById(fileId);

  if (!entity) {
    throw new NotFoundError('文件不存在');
  }

  // 检查是否已被锁定
  if (entity.locked === 1) {
    if (entity.locked_by === userId) {
      return { message: '文件已被您锁定', lockedBy: (req.user as any).username, lockedAt: entity.locked_at };
    }
    if (protoFileRepository.checkLockTimeout(fileId)) {
      // 锁已超时，自动释放
      protoFileRepository.unlockFile(fileId);
    } else {
      throw new ConflictError('文件已被其他用户锁定');
    }
  }

  // 锁定文件
  protoFileRepository.lockFile(fileId, userId);

  return {
    message: '文件已锁定',
    lockedBy: (req.user as any).username,
    lockedAt: new Date().toISOString(),
  };
}

/**
 * 解锁文件
 */
export function unlockFile(fileId: number, req: any): any {
  const userId = (req.user as any).userId;
  const entity = protoFileRepository.findById(fileId);

  if (!entity) {
    throw new NotFoundError('文件不存在');
  }

  // 只有锁定者或管理员可以解锁
  if (entity.locked_by !== userId && (req.user as any).role !== 'admin') {
    throw new Error('无权限解锁此文件');
  }

  protoFileRepository.unlockFile(fileId);

  return { message: '文件已解锁' };
}

/**
 * 实体转 ProtoFile
 */
function mapEntityToProtoFile(entity: any): ProtoFile {
  return {
    id: entity.id,
    filename: entity.filename,
    packageName: entity.package_name,
    status: entity.status,
    currentVersion: entity.current_version,
    createdAt: entity.created_at,
    updatedAt: entity.updated_at,
    locked: entity.locked === 1,
    lockedBy: entity.locked_by ? { id: entity.locked_by, username: '', email: '', role: 'developer', createdAt: '' } : null,
    lockedAt: entity.locked_at,
  };
}
