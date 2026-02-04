/**
 * Integration test for /check endpoints (T066-T075)
 * 测试检查API端点
 */

import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDatabase } from '../../src/config/db';
import { setupTestDatabase, teardownTestDatabase, getTestSubsystemId } from '../testSetup';

describe('Check API - POST /files/:id/check', () => {
  let app: express.Express;
  let developerToken: string;
  let createdFileId: number;
  let subsystemId: number;

  beforeAll(async () => {
    await setupTestDatabase();
    app = (await import('../../src/app')).default;

    // 创建开发者用户
    const timestamp = Date.now();
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: `dev_check_${timestamp}`,
        email: `dev_check_${timestamp}@example.com`,
        password: 'Test@123456',
        role: 'developer',
      })
      .expect(201);

    const devLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: `dev_check_${timestamp}`,
        password: 'Test@123456',
      })
      .expect(200);

    developerToken = devLogin.body.token;

    subsystemId = getTestSubsystemId();

    // 创建测试文件
    const createResponse = await request(app)
      .post('/api/v1/files')
      .set('Authorization', `Bearer ${developerToken}`)
      .field('file', 'syntax = "proto3";\npackage test.check;', {
        filename: 'test_check_1.proto',
        contentType: 'application/octet-stream',
      })
      .field('subsystemId', String(subsystemId))
      .expect(201);

    createdFileId = createResponse.body.id;
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('T066-P1: 应该成功执行检查', async () => {
    const response = await request(app)
      .post(`/api/v1/files/${createdFileId}/check`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('violations');
    expect(Array.isArray(response.body.violations)).toBe(true);
  });

  it('T066-P2: 应该返回404错误当文件不存在', async () => {
    const response = await request(app)
      .post('/api/v1/files/999999/check')
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(404);

    expect(response.body).toHaveProperty('error');
  });

  it('T066-P3: 应该返回401错误当缺少认证token', async () => {
    const response = await request(app)
      .post(`/api/v1/files/${createdFileId}/check`)
      .expect(401);

    expect(response.body).toHaveProperty('error');
  });
});

describe('Check API - GET /checks/:reportId', () => {
  let app: express.Express;
  let developerToken: string;
  let createdFileId: number;
  let createdReportId: number;
  let subsystemId: number;

  beforeAll(async () => {
    await setupTestDatabase();
    app = (await import('../../src/app')).default;

    // 创建开发者用户
    const timestamp = Date.now();
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: `dev_check2_${timestamp}`,
        email: `dev_check2_${timestamp}@example.com`,
        password: 'Test@123456',
        role: 'developer',
      })
      .expect(201);

    const devLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: `dev_check2_${timestamp}`,
        password: 'Test@123456',
      })
      .expect(200);

    developerToken = devLogin.body.token;

    subsystemId = getTestSubsystemId();

    // 创建测试文件
    const createResponse = await request(app)
      .post('/api/v1/files')
      .set('Authorization', `Bearer ${developerToken}`)
      .field('file', 'syntax = "proto3";\npackage test.check2;', {
        filename: 'test_check2_1.proto',
        contentType: 'application/octet-stream',
      })
      .field('subsystemId', String(subsystemId))
      .expect(201);

    createdFileId = createResponse.body.id;

    // 执行检查获取reportId
    const checkResponse = await request(app)
      .post(`/api/v1/files/${createdFileId}/check`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200);

    createdReportId = checkResponse.body.id;
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('T067-P1: 应该成功获取检查报告', async () => {
    const response = await request(app)
      .get(`/api/v1/checks/${createdReportId}`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('fileId');
    expect(response.body).toHaveProperty('violations');
    expect(response.body).toHaveProperty('status');
  });

  it('T067-P2: 应该返回404错误当报告不存在', async () => {
    const response = await request(app)
      .get('/api/v1/checks/999999')
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(404);

    expect(response.body).toHaveProperty('error');
  });

  it('T067-P3: 应该返回401错误当缺少认证token', async () => {
    const response = await request(app)
      .get(`/api/v1/checks/${createdReportId}`)
      .expect(401);

    expect(response.body).toHaveProperty('error');
  });
});
