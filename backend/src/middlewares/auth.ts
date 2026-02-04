/**
 * JWT 认证中间件
 */

import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// JWT 密钥（生产环境应从环境变量读取）
const JWT_SECRET = process.env.JWT_SECRET || 'protohub-secret-key-2024';

// Token 过期时间（7 天）
const TOKEN_EXPIRY = '7d';

/**
 * 生成 JWT Token
 */
export function generateToken(userId: number, username: string, role: string): string {
  return jwt.sign(
    {
      userId,
      username,
      role,
    },
    JWT_SECRET,
    {
      expiresIn: TOKEN_EXPIRY,
    }
  );
}

/**
 * 验证 JWT Token
 */
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * 认证中间件
 * 验证请求中的 JWT Token 并将用户信息附加到 req 对象
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // 从 Authorization header 获取 token
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: '未提供认证令牌' });
    return;
  }

  // 提取 Bearer token
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ error: '未提供认证令牌' });
    return;
  }

  // 验证 token
  const decoded = verifyToken(token);

  if (!decoded) {
    res.status(401).json({ error: '无效或过期的认证令牌' });
    return;
  }

  // 将用户信息附加到请求对象
  req.user = decoded;
  next();
}

/**
 * 角色验证中间件工厂函数
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user as any;

    if (!user) {
      res.status(401).json({ error: '未认证' });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({ error: '权限不足' });
      return;
    }

    next();
  };
}

/**
 * 可选的认证中间件
 * 不强制要求认证，但如果提供了 token 则验证
 */
export function optionalAuth(req: Request, _: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }

  next();
}

// 扩展 Express Request 类型
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        username: string;
        role: string;
      };
    }
  }
}
