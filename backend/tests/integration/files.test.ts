/**
 * Integration test for /files endpoints (T025-T032)
 * 测试文件管理API端点
 */

import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../../src/config/db';
import { setupTestDatabase, teardownTestDatabase, getTestSubsystemId } from '../testSetup';

describe('Files API - POST /files', () => {
  let app: express.Express;
  let authToken: string;
  let subsystemId: number;

  beforeAll(async () => {
    await setupTestDatabase();
    app = (await import('../../src/app')).default;

    // 创建测试用户并获取token
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'testuser_files',
        email: 'testuser_files@example.com',
        password: 'Test@123456',
        role: 'developer',
      })
      .expect(201);

    // 登录获取token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'testuser_files',
        password: 'Test@123456',
      })
      .expect(200);

    authToken = loginResponse.body.token;
    subsystemId = getTestSubsystemId();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('T025-P1: 应该成功创建新的proto文件', async () => {
    const fileContent = `
      syntax = "proto3";
      package test.files;

      message User {
        string name = 1;
        int32 id = 2;
      }
    `;

    const response = await request(app)
      .post('/api/v1/files')
      .set('Authorization', `Bearer ${authToken}`)
      .field('file', fileContent, {
        filename: 'test_files_1.proto',
        contentType: 'application/octet-stream',
      })
      .field('subsystemId', String(subsystemId))
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('filename');
    expect(response.body.filename).toBe('test_files_1.proto');
    expect(response.body).toHaveProperty('packageName');
    expect(response.body.packageName).toBe('test.files');
    expect(response.body).toHaveProperty('status');
    expect(response.body.status).toBe('draft');
  });

  it('T025-P2: 应该返回400错误当缺少认证token', async () => {
    const response = await request(app)
      .post('/api/v1/files')
      .field('file', 'syntax = "proto3";', {
        filename: 'test.proto',
        contentType: 'application/octet-stream',
      })
      .expect(401);

    expect(response.body).toHaveProperty('error');
  });

  it('T025-P3: 应该返回422错误当缺少文件', async () => {
    const response = await request(app)
      .post('/api/v1/files')
      .set('Authorization', `Bearer ${authToken}`)
      .field('subsystemId', String(subsystemId))
      .expect(422);

    expect(response.body).toHaveProperty('error');
  });

  it('T025-P4: 应该返回422错误当缺少子系统ID', async () => {
    const response = await request(app)
      .post('/api/v1/files')
      .set('Authorization', `Bearer ${authToken}`)
      .field('file', 'syntax = "proto3";', {
        filename: 'test.proto',
        contentType: 'application/octet-stream',
      })
      .expect(422);

    expect(response.body).toHaveProperty('error');
  });

  it('T025-P5: 应该正确解析proto文件内容', async () => {
    const fileContent = `
      syntax = "proto3";
      package test.parser;

      message TestMsg {
        string test_field = 1;
        string test_value = 2;
      }
    `;

    const response = await request(app)
      .post('/api/v1/files')
      .set('Authorization', `Bearer ${authToken}`)
      .field('file', fileContent, {
        filename: 'test_parser_1.proto',
        contentType: 'application/octet-stream',
      })
      .field('subsystemId', String(subsystemId))
      .expect(201);

    expect(response.body.packageName).toBe('test.parser');
    expect(response.body.status).toBe('draft');
  });
});

describe('Files API - GET /files/{id}', () => {
  let app: express.Express;
  let authToken: string;
  let createdFileId: number;
  let subsystemId: number;

  beforeAll(async () => {
    await setupTestDatabase();
    app = (await import('../../src/app')).default;

    await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'testuser_get',
        email: 'testuser_get@example.com',
        password: 'Test@123456',
        role: 'developer',
      })
      .expect(201);

    // 登录获取token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'testuser_get',
        password: 'Test@123456',
      })
      .expect(200);

    authToken = loginResponse.body.token;
    subsystemId = getTestSubsystemId();

    // 创建测试文件
    const createResponse = await request(app)
      .post('/api/v1/files')
      .set('Authorization', `Bearer ${authToken}`)
      .field('file', 'syntax = "proto3";\npackage test.get;', {
        filename: 'test_get_1.proto',
        contentType: 'application/octet-stream',
      })
      .field('subsystemId', String(subsystemId))
      .expect(201);

    createdFileId = createResponse.body.id;
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('T026-P1: 应该成功获取文件详情', async () => {
    const response = await request(app)
      .get(`/api/v1/files/${createdFileId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('id');
    expect(response.body.id).toBe(createdFileId);
    expect(response.body).toHaveProperty('filename');
    expect(response.body).toHaveProperty('packageName');
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('content');
  });

  it('T026-P2: 应该返回404错误当文件不存在', async () => {
    const response = await request(app)
      .get('/api/v1/files/999999')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);

    expect(response.body).toHaveProperty('error');
  });

  it('T026-P3: 应该返回401错误当缺少认证token', async () => {
    const response = await request(app)
      .get(`/api/v1/files/${createdFileId}`)
      .expect(401);

    expect(response.body).toHaveProperty('error');
  });
});

describe('Files API - PUT /files/{id}', () => {
  let app: express.Express;
  let authToken: string;
  let createdFileId: number;
  let subsystemId: number;

  beforeAll(async () => {
    await setupTestDatabase();
    app = (await import('../../src/app')).default;

    await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'testuser_put',
        email: 'testuser_put@example.com',
        password: 'Test@123456',
        role: 'developer',
      })
      .expect(201);

    // 登录获取token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'testuser_put',
        password: 'Test@123456',
      })
      .expect(200);

    authToken = loginResponse.body.token;
    subsystemId = getTestSubsystemId();

    const createResponse = await request(app)
      .post('/api/v1/files')
      .set('Authorization', `Bearer ${authToken}`)
      .field('file', 'syntax = "proto3";\npackage test.put;', {
        filename: 'test_put_1.proto',
        contentType: 'application/octet-stream',
      })
      .field('subsystemId', String(subsystemId))
      .expect(201);

    createdFileId = createResponse.body.id;
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('T027-P1: 应该成功更新文件内容', async () => {
    const newContent = `
      syntax = "proto3";
      package test.updated;

      message UpdatedMsg {
        string new_field = "updated_value";
      }
    `;

    const response = await request(app)
      .put(`/api/v1/files/${createdFileId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: newContent })
      .expect(200);

    expect(response.body).toHaveProperty('id');
    expect(response.body.id).toBe(createdFileId);
  });

  it('T027-P2: 应该返回404错误当文件不存在', async () => {
    const response = await request(app)
      .put('/api/v1/files/999999')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: 'syntax = "proto3";' })
      .expect(404);

    expect(response.body).toHaveProperty('error');
  });

  it('T027-P3: 应该返回400错误当缺少content', async () => {
    const response = await request(app)
      .put(`/api/v1/files/${createdFileId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({})
      .expect(422);

    expect(response.body).toHaveProperty('error');
  });

  it('T027-P4: 应该返回401错误当缺少认证token', async () => {
    const response = await request(app)
      .put(`/api/v1/files/${createdFileId}`)
      .send({ content: 'syntax = "proto3";' })
      .expect(401);

    expect(response.body).toHaveProperty('error');
  });
});

describe('Files API - DELETE /files/{id}', () => {
  let app: express.Express;
  let authToken: string;
  let createdFileId: number;
  let subsystemId: number;

  beforeAll(async () => {
    await setupTestDatabase();
    app = (await import('../../src/app')).default;

    await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'testuser_delete',
        email: 'testuser_delete@example.com',
        password: 'Test@123456',
        role: 'developer',
      })
      .expect(201);

    // 登录获取token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'testuser_delete',
        password: 'Test@123456',
      })
      .expect(200);

    authToken = loginResponse.body.token;
    subsystemId = getTestSubsystemId();

    const createResponse = await request(app)
      .post('/api/v1/files')
      .set('Authorization', `Bearer ${authToken}`)
      .field('file', 'syntax = "proto3";\npackage test.delete;', {
        filename: 'test_delete_1.proto',
        contentType: 'application/octet-stream',
      })
      .field('subsystemId', String(subsystemId))
      .expect(201);

    createdFileId = createResponse.body.id;
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('T028-P1: 应该成功删除文件', async () => {
    const response = await request(app)
      .delete(`/api/v1/files/${createdFileId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('message');
  });

  it('T028-P2: 应该返回404错误当文件不存在', async () => {
    const response = await request(app)
      .delete('/api/v1/files/999999')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);

    expect(response.body).toHaveProperty('error');
  });

  it('T028-P3: 应该返回401错误当缺少认证token', async () => {
    const response = await request(app)
      .delete(`/api/v1/files/${createdFileId}`)
      .expect(401);

    expect(response.body).toHaveProperty('error');
  });
});

describe('Files API - POST /files/{id}/lock', () => {
  let app: express.Express;
  let authToken: string;
  let createdFileId: number;
  let subsystemId: number;

  beforeAll(async () => {
    await setupTestDatabase();
    app = (await import('../../src/app')).default;

    await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'testuser_lock',
        email: 'testuser_lock@example.com',
        password: 'Test@123456',
        role: 'developer',
      })
      .expect(201);

    // 登录获取token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'testuser_lock',
        password: 'Test@123456',
      })
      .expect(200);

    authToken = loginResponse.body.token;
    subsystemId = getTestSubsystemId();

    const createResponse = await request(app)
      .post('/api/v1/files')
      .set('Authorization', `Bearer ${authToken}`)
      .field('file', 'syntax = "proto3";\npackage test.lock;', {
        filename: 'test_lock_1.proto',
        contentType: 'application/octet-stream',
      })
      .field('subsystemId', String(subsystemId))
      .expect(201);

    createdFileId = createResponse.body.id;
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('T029-P1: 应该成功锁定文件', async () => {
    const response = await request(app)
      .post(`/api/v1/files/${createdFileId}/lock`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('locked');
    expect(response.body.locked).toBe(true);
    expect(response.body).toHaveProperty('lockedBy');
  });

  it('T029-P2: 应该返回404错误当文件不存在', async () => {
    const response = await request(app)
      .post(`/api/v1/files/999999/lock`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);

    expect(response.body).toHaveProperty('error');
  });

  it('T029-P3: 应该返回401错误当缺少认证token', async () => {
    const response = await request(app)
      .post(`/api/v1/files/${createdFileId}/lock`)
      .expect(401);

    expect(response.body).toHaveProperty('error');
  });
});

describe('Files API - POST /files/{id}/unlock', () => {
  let app: express.Express;
  let authToken: string;
  let createdFileId: number;
  let subsystemId: number;

  beforeAll(async () => {
    await setupTestDatabase();
    app = (await import('../../src/app')).default;

    await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'testuser_unlock',
        email: 'testuser_unlock@example.com',
        password: 'Test@123456',
        role: 'developer',
      })
      .expect(201);

    // 登录获取token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'testuser_unlock',
        password: 'Test@123456',
      })
      .expect(200);

    authToken = loginResponse.body.token;
    subsystemId = getTestSubsystemId();

    const createResponse = await request(app)
      .post('/api/v1/files')
      .set('Authorization', `Bearer ${authToken}`)
      .field('file', 'syntax = "proto3";\npackage test.unlock;', {
        filename: 'test_unlock_1.proto',
        contentType: 'application/octet-stream',
      })
      .field('subsystemId', String(subsystemId))
      .expect(201);

    createdFileId = createResponse.body.id;
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('T030-P1: 应该成功解锁文件', async () => {
    const response = await request(app)
      .post(`/api/v1/files/${createdFileId}/unlock`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('locked');
    expect(response.body.locked).toBe(false);
  });

  it('T030-P2: 应该返回404错误当文件不存在', async () => {
    const response = await request(app)
      .post(`/api/v1/files/999999/unlock`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);

    expect(response.body).toHaveProperty('error');
  });

  it('T030-P3: 应该返回401错误当缺少认证token', async () => {
    const response = await request(app)
      .post(`/api/v1/files/${createdFileId}/unlock`)
      .expect(401);

    expect(response.body).toHaveProperty('error');
  });
});
