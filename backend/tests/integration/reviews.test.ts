/**
 * Integration test for /reviews endpoints (T053-T056)
 * 测试审核API端点
 */

import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDatabase } from '../../src/config/db';
import { setupTestDatabase, teardownTestDatabase, getTestSubsystemId } from '../testSetup';

describe('Reviews API - GET /reviews', () => {
  let app: express.Express;
  let developerToken: string;
  let reviewerToken: string;
  let adminToken: string;
  let createdFileId: number;
  let createdReviewId: number;
  let subsystemId: number;

  beforeAll(async () => {
    await setupTestDatabase();
    app = (await import('../../src/app')).default;

    const timestamp = Date.now();

    // 创建开发者用户
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: `dev_review_${timestamp}`,
        email: `dev_review_${timestamp}@example.com`,
        password: 'Test@123456',
        role: 'developer',
      })
      .expect(201);

    const devLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: `dev_review_${timestamp}`,
        password: 'Test@123456',
      })
      .expect(200);

    developerToken = devLogin.body.token;

    // 创建审核员用户
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: `reviewer_${timestamp}`,
        email: `reviewer_${timestamp}@example.com`,
        password: 'Test@123456',
        role: 'reviewer',
      })
      .expect(201);

    const reviewerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: `reviewer_${timestamp}`,
        password: 'Test@123456',
      })
      .expect(200);

    reviewerToken = reviewerLogin.body.token;

    // 创建管理员用户
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: `admin_review_${timestamp}`,
        email: `admin_review_${timestamp}@example.com`,
        password: 'Test@123456',
        role: 'admin',
      })
      .expect(201);

    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: `admin_review_${timestamp}`,
        password: 'Test@123456',
      })
      .expect(200);

    adminToken = adminLogin.body.token;

    subsystemId = getTestSubsystemId();

    // 创建测试文件
    const createResponse = await request(app)
      .post('/api/v1/files')
      .set('Authorization', `Bearer ${developerToken}`)
      .field('file', 'syntax = "proto3";\npackage test.review;', {
        filename: 'test_review_1.proto',
        contentType: 'application/octet-stream',
      })
      .field('subsystemId', String(subsystemId))
      .expect(201);

    createdFileId = createResponse.body.id;

    // 提交审核
    const submitResponse = await request(app)
      .post(`/api/v1/files/${createdFileId}/submit-review`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200);

    createdReviewId = submitResponse.body.review.id;
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('T053-P1: 应该成功获取待审核列表', async () => {
    const response = await request(app)
      .get('/api/v1/reviews')
      .set('Authorization', `Bearer ${reviewerToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('reviews');
    expect(Array.isArray(response.body.reviews)).toBe(true);
    expect(response.body).toHaveProperty('total');
    expect(typeof response.body.total).toBe('number');
  });

  it('T053-P2: 应该返回401错误当缺少认证token', async () => {
    const response = await request(app)
      .get('/api/v1/reviews')
      .expect(401);

    expect(response.body).toHaveProperty('error');
  });

  it('T053-P3: 应该返回403错误当用户权限不足', async () => {
    const response = await request(app)
      .get('/api/v1/reviews')
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(403);

    expect(response.body).toHaveProperty('error');
  });
});

describe('Reviews API - POST /reviews/:id/approve', () => {
  let app: express.Express;
  let developerToken: string;
  let reviewerToken: string;
  let createdFileId: number;
  let createdReviewId: number;
  let subsystemId: number;

  beforeAll(async () => {
    await setupTestDatabase();
    app = (await import('../../src/app')).default;

    const timestamp = Date.now();

    // 创建开发者用户
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: `dev_approve_${timestamp}`,
        email: `dev_approve_${timestamp}@example.com`,
        password: 'Test@123456',
        role: 'developer',
      })
      .expect(201);

    const devLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: `dev_approve_${timestamp}`,
        password: 'Test@123456',
      })
      .expect(200);

    developerToken = devLogin.body.token;

    // 创建审核员用户
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: `reviewer_approve_${timestamp}`,
        email: `reviewer_approve_${timestamp}@example.com`,
        password: 'Test@123456',
        role: 'reviewer',
      })
      .expect(201);

    const reviewerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: `reviewer_approve_${timestamp}`,
        password: 'Test@123456',
      })
      .expect(200);

    reviewerToken = reviewerLogin.body.token;

    subsystemId = getTestSubsystemId();

    // 创建测试文件
    const createResponse = await request(app)
      .post('/api/v1/files')
      .set('Authorization', `Bearer ${developerToken}`)
      .field('file', 'syntax = "proto3";\npackage test.approve;', {
        filename: 'test_approve_1.proto',
        contentType: 'application/octet-stream',
      })
      .field('subsystemId', String(subsystemId))
      .expect(201);

    createdFileId = createResponse.body.id;

    // 提交审核
    const submitResponse = await request(app)
      .post(`/api/v1/files/${createdFileId}/submit-review`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200);

    createdReviewId = submitResponse.body.review.id;
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('T054-P1: 应该成功批准审核', async () => {
    const response = await request(app)
      .post(`/api/v1/reviews/${createdReviewId}/approve`)
      .set('Authorization', `Bearer ${reviewerToken}`)
      .send({ comment: '通过' })
      .expect(200);

    expect(response.body).toHaveProperty('status');
    expect(response.body.status).toBe('approved');
    expect(response.body).toHaveProperty('review_comment');
    expect(response.body.review_comment).toBe('通过');
  });

  it('T054-P2: 应该返回404错误当审核不存在', async () => {
    const response = await request(app)
      .post('/api/v1/reviews/999999/approve')
      .set('Authorization', `Bearer ${reviewerToken}`)
      .send({ comment: '通过' })
      .expect(404);

    expect(response.body).toHaveProperty('error');
  });

  it('T054-P3: 应该返回401错误当缺少认证token', async () => {
    const response = await request(app)
      .post(`/api/v1/reviews/${createdReviewId}/approve`)
      .send({ comment: '通过' })
      .expect(401);

    expect(response.body).toHaveProperty('error');
  });

  it('T054-P4: 应该返回403错误当用户权限不足', async () => {
    const response = await request(app)
      .post(`/api/v1/reviews/${createdReviewId}/approve`)
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ comment: '通过' })
      .expect(403);

    expect(response.body).toHaveProperty('error');
  });
});

describe('Reviews API - POST /reviews/:id/reject', () => {
  let app: express.Express;
  let developerToken: string;
  let reviewerToken: string;
  let createdFileId: number;
  let createdReviewId: number;
  let subsystemId: number;

  beforeAll(async () => {
    await setupTestDatabase();
    app = (await import('../../src/app')).default;

    const timestamp = Date.now();

    // 创建开发者用户
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: `dev_reject_${timestamp}`,
        email: `dev_reject_${timestamp}@example.com`,
        password: 'Test@123456',
        role: 'developer',
      })
      .expect(201);

    const devLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: `dev_reject_${timestamp}`,
        password: 'Test@123456',
      })
      .expect(200);

    developerToken = devLogin.body.token;

    // 创建审核员用户
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: `reviewer_reject_${timestamp}`,
        email: `reviewer_reject_${timestamp}@example.com`,
        password: 'Test@123456',
        role: 'reviewer',
      })
      .expect(201);

    const reviewerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: `reviewer_reject_${timestamp}`,
        password: 'Test@123456',
      })
      .expect(200);

    reviewerToken = reviewerLogin.body.token;

    subsystemId = getTestSubsystemId();

    // 创建测试文件
    const createResponse = await request(app)
      .post('/api/v1/files')
      .set('Authorization', `Bearer ${developerToken}`)
      .field('file', 'syntax = "proto3";\npackage test.reject;', {
        filename: 'test_reject_1.proto',
        contentType: 'application/octet-stream',
      })
      .field('subsystemId', String(subsystemId))
      .expect(201);

    createdFileId = createResponse.body.id;

    // 提交审核
    const submitResponse = await request(app)
      .post(`/api/v1/files/${createdFileId}/submit-review`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200);

    createdReviewId = submitResponse.body.review.id;
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('T055-P1: 应该成功拒绝审核', async () => {
    const response = await request(app)
      .post(`/api/v1/reviews/${createdReviewId}/reject`)
      .set('Authorization', `Bearer ${reviewerToken}`)
      .send({ comment: '需要修改' })
      .expect(200);

    expect(response.body).toHaveProperty('status');
    expect(response.body.status).toBe('rejected');
    expect(response.body).toHaveProperty('review_comment');
    expect(response.body.review_comment).toBe('需要修改');
  });

  it('T055-P2: 应该返回404错误当审核不存在', async () => {
    const response = await request(app)
      .post('/api/v1/reviews/999999/reject')
      .set('Authorization', `Bearer ${reviewerToken}`)
      .send({ comment: '需要修改' })
      .expect(404);

    expect(response.body).toHaveProperty('error');
  });

  it('T055-P3: 应该返回401错误当缺少认证token', async () => {
    const response = await request(app)
      .post(`/api/v1/reviews/${createdReviewId}/reject`)
      .send({ comment: '需要修改' })
      .expect(401);

    expect(response.body).toHaveProperty('error');
  });

  it('T055-P4: 应该返回403错误当用户权限不足', async () => {
    const response = await request(app)
      .post(`/api/v1/reviews/${createdReviewId}/reject`)
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ comment: '需要修改' })
      .expect(403);

    expect(response.body).toHaveProperty('error');
  });
});
