/**
 * API 路由定义
 */

import express, { type Router } from 'express';
import { authMiddleware, optionalAuth } from '../middlewares/auth';
import { authRoutes } from './routes/auth.routes';
import { fileRoutes } from './routes/file.routes';
import { versionRoutes } from './routes/version.routes';
import { userRoutes } from './routes/user.routes';
import { reviewRoutes } from './routes/review.routes';
import { gitRoutes } from './routes/git.routes';
import { subsystemRoutes } from './routes/subsystem.routes';
import { checkRoutes } from './routes/check.routes';
import { dependencyRoutes } from './routes/dependency.routes';
import { vocabularyRoutes } from './routes/vocabulary.routes';
import architectureRoutes from './routes/architecture.routes';

/**
 * 注册所有路由
 */
export function registerRoutes(): Router {
  const router = express.Router();

  // 认证路由（无需认证）
  router.use('/auth', authRoutes);

  // 用户管理路由
  router.use('/users', authMiddleware, userRoutes);

  // 文件管理路由
  router.use('/files', authMiddleware, fileRoutes);
  router.use('/files', authMiddleware, versionRoutes);

  // 审核路由
  router.use('/reviews', authMiddleware, reviewRoutes);

  // Git 仓库路由
  router.use('/git-repos', authMiddleware, gitRoutes);

  // 子系统路由
  router.use('/subsystems', optionalAuth, subsystemRoutes);

  // 检查路由
  router.use('/checks', authMiddleware, checkRoutes);

  // 依赖关系路由
  router.use('/dependencies', authMiddleware, dependencyRoutes);

  // 词汇管理路由
  router.use('/vocabulary', authMiddleware, vocabularyRoutes);

  // 架构图路由
  router.use('/architecture', architectureRoutes);

  return router;
}
