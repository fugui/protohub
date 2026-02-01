/**
 * 版本管理路由
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middlewares/errorHandler';
import { fileVersionRepository } from '../../models/FileVersion';
import { compareFiles } from '../../utils/diffUtils';
import type { FileVersion } from 'protohub-shared';

const router = Router();

/**
 * GET /api/v1/files/:fileId/versions
 * 获取文件版本历史
 */
router.get(
  '/:fileId/versions',
  asyncHandler(async (req: Request, res: Response) => {
    const fileId = parseInt(req.params.fileId);
    const versions = fileVersionRepository.findByFileId(fileId);
    const currentVersion = fileVersionRepository.findLatestVersion(fileId)?.version || 1;

    const result = versions.map((entity): FileVersion => ({
      id: entity.id,
      version: entity.version,
      filePath: entity.file_path,
      changeNote: entity.change_note || undefined,
      modifiedBy: {
        id: entity.modified_by,
        username: '', // TODO: 从用户表获取
        email: '',
        role: 'developer',
        createdAt: '',
      },
      modifiedAt: entity.modified_at,
    }));

    res.json({
      versions: result,
      current: currentVersion,
    });
  })
);

/**
 * GET /api/v1/files/:fileId/versions/diff
 * 对比两个版本差异
 */
router.get(
  '/:fileId/versions/diff',
  asyncHandler(async (req: Request, res: Response) => {
    const fileId = parseInt(req.params.fileId);
    const version1 = parseInt(req.query.version1 as string);
    const version2 = parseInt(req.query.version2 as string);

    const v1 = fileVersionRepository.findByFileIdAndVersion(fileId, version1);
    const v2 = fileVersionRepository.findByFileIdAndVersion(fileId, version2);

    if (!v1 || !v2) {
      res.status(404).json({ error: '版本不存在' });
      return;
    }

    const comparison = compareFiles(v1.content, v2.content);

    res.json({
      diff: comparison.unifiedDiff,
      version1: {
        id: v1.id,
        version: v1.version,
        filePath: v1.file_path,
        modifiedBy: {
          id: v1.modified_by,
          username: '',
          email: '',
          role: 'developer',
          createdAt: '',
        },
        modifiedAt: v1.modified_at,
      },
      version2: {
        id: v2.id,
        version: v2.version,
        filePath: v2.file_path,
        modifiedBy: {
          id: v2.modified_by,
          username: '',
          email: '',
          role: 'developer',
          createdAt: '',
        },
        modifiedAt: v2.modified_at,
      },
    });
  })
);

export { router as versionRoutes };
