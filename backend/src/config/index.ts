/**
 * Express 服务器配置
 */

import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { requestLogger } from '../middlewares/logger';
import { errorHandler, notFoundHandler } from '../middlewares/errorHandler';

/**
 * 创建 Express 应用
 */
export function createApp(): Express {
  const app = express();

  // 安全头
  app.use(helmet());

  // CORS
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:5176',
      ],
      credentials: true,
    })
  );

  // 请求体解析
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 速率限制
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 分钟
    max: 100, // 每个窗口最多 100 个请求
    message: '请求过于频繁，请稍后再试',
  });
  app.use('/api/', limiter);

  // 日志中间件
  app.use(requestLogger);

  // 健康检查
  app.get('/health', (_, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  return app;
}

/**
 * 启动服务器
 */
export function startServer(app: Express, port: number = 3000): void {
  const server = app.listen(port, () => {
    console.log(`\n========================================`);
    console.log(`ProtoHub 后端服务启动成功`);
    console.log(`========================================`);
    console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
    console.log(`端口: ${port}`);
    console.log(`API: http://localhost:${port}/api/v1`);
    console.log(`健康检查: http://localhost:${port}/health`);
    console.log(`========================================\n`);
  });

  // 优雅关闭
  const gracefulShutdown = (signal: string) => {
    console.log(`\n收到 ${signal} 信号，正在关闭服务器...`);
    server.close(() => {
      console.log('服务器已关闭');
      process.exit(0);
    });

    // 强制关闭超时
    setTimeout(() => {
      console.error('服务器关闭超时，强制退出');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

/**
 * 注册错误处理中间件（应在所有路由之后调用）
 */
export function registerErrorHandlers(app: Express): void {
  // 404 处理
  app.use(notFoundHandler);

  // 全局错误处理
  app.use(errorHandler);
}
