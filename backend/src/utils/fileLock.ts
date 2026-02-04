import { logger } from '../middlewares/logger';
import { getDatabase } from '../config/db';

/**
 * 文件锁配置
 */
const LOCK_TIMEOUT = 5 * 60 * 1000; // 5 分钟超时

/**
 * 获取文件锁
 */
export async function acquireFileLock(fileId: number, userId: number): Promise<{
  success: boolean;
  error?: string;
}> {
  const db = getDatabase();

  try {
    // 查询当前锁状态
    const currentLock = db.prepare(`
      SELECT id, locked, locked_by, locked_at
      FROM proto_files
      WHERE id = ?
    `).get(fileId) as {
      id: number;
      locked: number;
      locked_by: number | null;
      locked_at: string;
    } | undefined;

    if (!currentLock) {
      return {
        success: false,
        error: '文件不存在',
      };
    }

    // 检查是否已锁定
    if (currentLock.locked) {
      const lockAge = new Date().getTime() - new Date(currentLock.locked_at).getTime();
      if (lockAge < LOCK_TIMEOUT) {
        // 检查是否是同一用户
        if (currentLock.locked_by !== userId) {
          return {
            success: false,
            error: '文件已被其他用户锁定',
          };
        }

        // 刷新锁（延长锁时间）
        const newLockedAt = new Date().toISOString();
        db.prepare('UPDATE proto_files SET locked_at = ? WHERE id = ?').run(newLockedAt, fileId);

        logger.debug(`文件锁已刷新: ${fileId}`);
        return {
          success: true
        };
      }
    }

    // 获取锁（文件未锁定或锁已超时）
    const stmt = db.prepare(`
      UPDATE proto_files
      SET locked = 1, locked_by = ?, locked_at = ?
      WHERE id = ?
    `);

    stmt.run(userId, new Date().toISOString(), fileId);

    logger.info(`文件已锁定: ${fileId}`);
    return { success: true };
  } catch (error) {
    logger.error('获取文件锁失败', error);
    return {
      success: false,
      error: '获取文件锁失败'
    };
  }
}

/**
 * 释放文件锁
 */
export async function releaseFileLock(fileId: number, userId: number): Promise<void> {
  const db = getDatabase();

  try {
    // 查询当前锁状态
    const currentLock = db.prepare(`
      SELECT id, locked_by, locked_at
      FROM proto_files
      WHERE id = ?
    `).get(fileId) as {
      id: number;
      locked_by: number | null;
      locked_at: string;
    } | undefined;

    if (!currentLock) {
      throw new Error('文件不存在');
    }

    // 检查是否持有锁
    if (currentLock.locked_by !== userId) {
      throw new Error('只有文件锁持有者才能解锁文件');
    }

    // 释放锁
    const stmt = db.prepare(`
      UPDATE proto_files
      SET locked = 0, locked_by = NULL, locked_at = NULL
      WHERE id = ?
    `);

    stmt.run(fileId);

    logger.info(`文件锁已释放: ${fileId}`);
  } catch (error) {
    logger.error('释放文件锁失败', error);
    throw error;
  }
}

/**
 * 检查文件是否被锁定
 */
export async function isFileLocked(fileId: number, userId: number): Promise<boolean> {
  const db = getDatabase();

  try {
    const currentLock = db.prepare(`
      SELECT id, locked, locked_by, locked_at
      FROM proto_files
      WHERE id = ?
    `).get(fileId) as {
      id: number;
      locked: number;
      locked_by: number | null;
      locked_at: string;
    } | undefined;

    if (!currentLock) {
      return false;
    }

    // 检查是否已锁定且是否超时
    if (currentLock.locked) {
      const lockAge = new Date().getTime() - new Date(currentLock.locked_at).getTime();
      return lockAge < LOCK_TIMEOUT;
    }

    return currentLock.locked_by === userId;
  } catch (error) {
    logger.error('检查文件锁状态失败', error);
    return false;
  }
}
