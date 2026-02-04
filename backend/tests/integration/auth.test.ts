/**
 * Integration test for /auth/login endpoint (T024)
 * 测试用户登录功能
 */

import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import { setupTestDatabase, teardownTestDatabase } from '../testSetup';
import { getDatabase } from '../../src/config/db';

describe('Auth API - POST /auth/login', () => {
  let app: express.Express;
  let authToken: string;

  beforeAll(async () => {
    await setupTestDatabase();
    app = (await import('../../src/app')).default;
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('T024-P1: 应该成功登录并返回token和用户信息', async () => {
    // 首先注册一个测试用户
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'testuser_login',
        email: 'testuser_login@example.com',
        password: 'Test@123456',
        role: 'developer',
      })
      .expect(201);

    // 测试登录
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'testuser_login',
        password: 'Test@123456',
      })
      .expect(200);

    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toHaveProperty('id');
    expect(response.body.user).toHaveProperty('username');
    expect(response.body.user).toHaveProperty('email');
    expect(response.body.user).toHaveProperty('role');

    authToken = response.body.token;
    expect(typeof authToken).toBe('string');
    expect(authToken.length).toBeGreaterThan(0);
  });

  it('T024-P2: 应该返回422错误当用户名不存在', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'nonexistent_user',
        password: 'Test@123456',
      })
      .expect(422);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('用户名或密码错误');
  });

  it('T024-P3: 应该返回422错误当密码错误', async () => {
    // 先创建用户
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'testuser_wrongpass',
        email: 'testuser_wrongpass@example.com',
        password: 'Test@123456',
        role: 'developer',
      })
      .expect(201);

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'testuser_wrongpass',
        password: 'WrongPassword123',
      })
      .expect(422);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('用户名或密码错误');
  });

  it('T024-P4: 应该返回422错误当缺少用户名', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        password: 'Test@123456',
      })
      .expect(422);

    expect(response.body).toHaveProperty('error');
  });

  it('T024-P5: 应该返回422错误当缺少密码', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'testuser',
      })
      .expect(422);

    expect(response.body).toHaveProperty('error');
  });

  it('T024-P6: 应该返回422错误当请求体为空', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({})
      .expect(422);

    expect(response.body).toHaveProperty('error');
  });
});
