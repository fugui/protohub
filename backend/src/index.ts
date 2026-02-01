/**
 * 应用入口
 */

import { initApp, startServer } from './app';
import { initDatabase, runMigrations } from './config/db';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

async function main() {
  try {
    // 初始化数据库
    initDatabase();

    // 运行数据库迁移
    runMigrations();

    // 初始化应用
    const app = initApp();

    // 启动服务器
    startServer(app, PORT);
  } catch (error) {
    console.error('启动失败:', error);
    process.exit(1);
  }
}

main();
