/**
 * 文件管理路由
 */

import { Router, Request, Response } from 'express';
const multer = require('multer');
import { asyncHandler } from '../../middlewares/errorHandler';
import {
  getFiles,
  getFileById,
  createFile,
  updateFile,
  deleteFile,
  lockFile,
  unlockFile,
  submitReview,
} from '../controllers/file.controller';
import { runCheck, getVocabularyReport } from '../controllers/check.controller';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

/**
 * GET /api/v1/files
 * 获取文件列表
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const params = {
      page: parseInt(req.query.page as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 20,
      subsystemId: req.query.subsystemId ? parseInt(req.query.subsystemId as string) : undefined,
      status: req.query.status as string | undefined,
      search: req.query.search as string | undefined,
    };
    const result = await getFiles(params);
    res.json(result);
  })
);

/**
 * POST /api/v1/files
 * 创建文件
 */
router.post(
  '/',
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await createFile(req, req.body);
    res.status(201).json(result);
  })
);

/**
 * GET /api/v1/files/:fileId
 * 获取文件详情
 */
router.get(
  '/:fileId',
  asyncHandler(async (req: Request, res: Response) => {
    const fileId = parseInt(req.params.fileId);
    const result = await getFileById(fileId);
    res.json(result);
  })
);

/**
 * PUT /api/v1/files/:fileId
 * 更新文件
 */
router.put(
  '/:fileId',
  asyncHandler(async (req: Request, res: Response) => {
    const fileId = parseInt(req.params.fileId);
    const result = await updateFile(fileId, req.body, req);
    res.json(result);
  })
);

/**
 * DELETE /api/v1/files/:fileId
 * 删除文件
 */
router.delete(
  '/:fileId',
  asyncHandler(async (req: Request, res: Response) => {
    const fileId = parseInt(req.params.fileId);
    await deleteFile(fileId, req);
    res.json({ message: '文件已删除' });
  })
);

/**
 * POST /api/v1/files/:fileId/lock
 * 锁定文件
 */
router.post(
  '/:fileId/lock',
  asyncHandler(async (req: Request, res: Response) => {
    const fileId = parseInt(req.params.fileId);
    const result = await lockFile(fileId, req);
    res.json(result);
  })
);

/**
 * POST /api/v1/files/:fileId/unlock
 * 解锁文件
 */
router.post(
  '/:fileId/unlock',
  asyncHandler(async (req: Request, res: Response) => {
    const fileId = parseInt(req.params.fileId);
    const result = await unlockFile(fileId, req);
    res.json(result);
  })
);

/**
 * POST /api/v1/files/:fileId/submit-review
 * 提交审核
 */
router.post(
  '/:fileId/submit-review',
  asyncHandler(async (req: Request, res: Response) => {
    const fileId = parseInt(req.params.fileId);
    const result = await submitReview(fileId, req);
    res.json(result);
  })
);

/**
 * POST /api/v1/files/:fileId/check
 * 执行文件检查
 */
router.post(
  '/:fileId/check',
  asyncHandler(async (req: Request, res: Response) => {
    const fileId = parseInt(req.params.fileId);
    const result = await runCheck(fileId);
    res.json(result);
  })
);

/**
 * GET /api/v1/files/:fileId/vocabulary-report
 * 获取文件词汇检查报告
 */
router.get(
  '/:fileId/vocabulary-report',
  asyncHandler(async (req: Request, res: Response) => {
    const fileId = parseInt(req.params.fileId);
    const result = await getVocabularyReport(fileId);
    res.json(result);
  })
);

export { router as fileRoutes };
