/**
 * 认证服务
 */

import bcrypt from 'bcrypt';
import { userRepository } from '../models/User';
import { generateToken } from '../middlewares/auth';
import { LoginRequest, RegisterRequest, LoginResponse, User } from 'protohub-shared';
import { ValidationError, ConflictError, NotFoundError } from '../middlewares/errorHandler';

/**
 * 用户登录
 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
  // 查找用户（支持用户名或邮箱登录）
  const user = await userRepository.findByUsername(data.username) || await userRepository.findByEmail(data.username);

  if (!user) {
    throw new ValidationError('用户名或密码错误');
  }

  // 验证密码
  const isPasswordValid = await bcrypt.compare(data.password, user.password_hash);
  if (!isPasswordValid) {
    throw new ValidationError('用户名或密码错误');
  }

  // 生成 JWT token
  const token = generateToken(user.id, user.username, user.role);

  // 返回用户信息
  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.created_at,
    },
  };
}

/**
 * 用户注册
 */
export async function register(data: RegisterRequest): Promise<User> {
  // 验证用户名是否已存在
  const existingUser = await userRepository.findByUsername(data.username);
  if (existingUser) {
    throw new ConflictError('用户名已被使用');
  }

  // 验证邮箱是否已存在
  const existingEmail = await userRepository.findByEmail(data.email);
  if (existingEmail) {
    throw new ConflictError('邮箱已被注册');
  }

  // 加密密码
  const passwordHash = await bcrypt.hash(data.password, 10);

  // 创建用户
  const userId = await userRepository.createUser({
    username: data.username,
    email: data.email,
    password_hash: passwordHash,
    role: data.role || 'developer',
  });

  // 返回用户信息
  const user = userRepository.findById(userId);
  if (!user) {
    throw new NotFoundError('用户创建失败');
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    createdAt: user.created_at,
  };
}

/**
 * 验证 Token 并获取用户信息
 */
export async function validateToken(token: string): Promise<User | null> {
  // 在 auth 中间件中已经验证了 token，这里只查询用户
  const decoded = require('../middlewares/auth').verifyToken(token);
  if (!decoded) {
    return null;
  }

  const user = await userRepository.findById(decoded.userId);
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    createdAt: user.created_at,
  };
}
