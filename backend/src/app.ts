/**
 * Express 应用入口
 * 配置所有路由和中间件
 */

import { createApp, registerErrorHandlers, startServer } from './config';
import { authMiddleware, optionalAuth } from './middlewares/auth';
import { registerRoutes } from './api/routes';

/**
 * 初始化应用
 */
export function initApp() {
  const app = createApp();

  // API v1 路由
  app.use('/api/v1', registerRoutes());

  // 注册错误处理
  registerErrorHandlers(app);

  return app;
}

/**
 * 启动服务器
 */
export { startServer };
