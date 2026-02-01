/**
 * Git 仓库路由
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middlewares/errorHandler';
import {
  getGitRepos,
  createGitRepo,
  importFromGit,
  checkConsistency,
} from '../controllers/git.controller';

const router = Router();

/**
 * GET /api/v1/git-repos
 * 获取 Git 仓库列表
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req.user as any).userId;
    const result = await getGitRepos(userId);
    res.json({ repos: result });
  })
);

/**
 * POST /api/v1/git-repos
 * 添加 Git 仓库配置
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req.user as any).userId;
    const result = await createGitRepo(userId, req.body);
    res.status(201).json(result);
  })
);

/**
 * POST /api/v1/git-repos/:repoId/import
 * 从 Git 仓库导入
 */
router.post(
  '/:repoId/import',
  asyncHandler(async (req: Request, res: Response) => {
    const repoId = parseInt(req.params.repoId);
    const result = await importFromGit(repoId, req);
    res.json(result);
  })
);

/**
 * GET /api/v1/git-repos/:repoId/check-consistency
 * 检查一致性
 */
router.get(
  '/:repoId/check-consistency',
  asyncHandler(async (req: Request, res: Response) => {
    const repoId = parseInt(req.params.repoId);
    const result = await checkConsistency(repoId);
    res.json(result);
  })
);

export { router as gitRoutes };
