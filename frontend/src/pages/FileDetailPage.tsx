/**
 * 文件详情页面
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Space, message, Modal, Input, Tag, Spin, Breadcrumb } from 'antd';
import { LockOutlined, UnlockOutlined, EditOutlined, ArrowLeftOutlined, CheckOutlined, DownloadOutlined } from '@ant-design/icons';
import { getFileById, updateFile, lockFile, unlockFile, submitReview } from '../services/fileService';
import { useAuthStore } from '../store';
import type { ProtoFileDetail } from 'protohub-shared';

const { TextArea } = Input;

export function FileDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [file, setFile] = useState<ProtoFileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState('');
  const [changeNote, setChangeNote] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchFileDetail();
  }, [id]);

  const fetchFileDetail = async () => {
    try {
      setLoading(true);
      const result = await getFileById(Number(id));
      setFile(result);
      setContent(result.content || '');
    } catch (error: any) {
      message.error('获取文件详情失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (content === file?.content) {
      setEditing(false);
      return;
    }

    try {
      const result = await updateFile(Number(id), { content, changeNote: null });
      message.success('文件更新成功');
      setFile({ ...file!, ...result });
      setEditing(false);
    } catch (error: any) {
      message.error('文件更新失败');
      console.error(error);
    }
  };

  const handleLock = async () => {
    try {
      await lockFile(Number(id));
      message.success('文件已锁定');
      setFile({ ...file!, locked: true, lockedBy: user, lockedAt: new Date().toISOString() });
    } catch (error: any) {
      message.error('文件锁定失败');
      console.error(error);
    }
  };

  const handleUnlock = async () => {
    try {
      await unlockFile(Number(id));
      message.success('文件已解锁');
      setFile({ ...file!, locked: false, lockedBy: null, lockedAt: null });
    } catch (error: any) {
      message.error('文件解锁失败');
      console.error(error);
    }
  };

  const handleSubmitReview = async () => {
    try {
      setSubmittingReview(true);
      await submitReview(Number(id));
      message.success('审核请求已提交');
      setFile({ ...file!, status: 'pending_review' });
      setEditing(false);
    } catch (error: any) {
      message.error('提交审核失败');
      console.error(error);
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      draft: { color: 'default', text: '草稿' },
      pending_review: { color: 'processing', text: '待审核' },
      approved: { color: 'success', text: '已批准' },
      rejected: { color: 'error', text: '已拒绝' },
    };
    const { color, text } = statusMap[status] || { color: 'default', text: status };
    return <Tag color={color}>{text}</Tag>;
  };

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!file) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <p>文件不存在</p>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/files')}>
          返回文件列表
        </Button>
      </div>
    );
  }

  const canEdit = !editing && !file.locked;
  const canLock = !file.locked && (user?.id === file.createdBy.id);
  const canUnlock = file.locked && (user?.id === file.lockedBy?.id);
  const canSubmitReview = !file.locked && file.status === 'draft';

  return (
    <div style={{ padding: 24 }}>
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate('/files')}>文件管理</Breadcrumb.Item>
        <Breadcrumb.Item>文件详情</Breadcrumb.Item>
      </Breadcrumb>

      <Space direction="vertical" size="large" style={{ marginTop: 16 }}>
        <Card
          title={
            <Space>
              <h2 style={{ margin: 0 }}>{file.filename}</h2>
              <Space>
                {getStatusTag(file.status)}
                {file.locked && <Tag color="warning">已锁定</Tag>}
              </Space>
            </Space>
          }
          extra={
            <Space>
              {canEdit && (
                <Button icon={<EditOutlined />} onClick={() => setEditing(true)}>
                  编辑
                </Button>
              )}
              {canLock && (
                <Button icon={<LockOutlined />} onClick={handleLock}>
                  锁定
                </Button>
              )}
              {canUnlock && (
                <Button icon={<UnlockOutlined />} onClick={handleUnlock}>
                  解锁
                </Button>
              )}
              {canSubmitReview && (
                <Button type="primary" icon={<CheckOutlined />} onClick={handleSubmitReview}>
                  提交审核
                </Button>
              )}
            </Space>
          }
        >
          <Descriptions column={2} bordered>
            <Descriptions.Item label="文件名">{file.filename}</Descriptions.Item>
            <Descriptions.Item label="包名">{file.packageName}</Descriptions.Item>
            <Descriptions.Item label="版本">{file.currentVersion}</Descriptions.Item>
            <Descriptions.Item label="状态">{getStatusTag(file.status)}</Descriptions.Item>
            <Descriptions.Item label="锁定状态">
              {file.locked ? (
                <Tag color="warning">已锁定</Tag>
              ) : (
                <Tag>未锁定</Tag>
              )}
            </Descriptions.Item>
            {file.lockedBy && (
              <Descriptions.Item label="锁定人">{file.lockedBy.username}</Descriptions.Item>
            )}
            {file.lockedAt && (
              <Descriptions.Item label="锁定时间">
                {new Date(file.lockedAt).toLocaleString('zh-CN')}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="子系统">{file.subsystem?.name || '-'}</Descriptions.Item>
            <Descriptions.Item label="Git 仓库">{file.gitRepo?.name || '-'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {new Date(file.createdAt).toLocaleString('zh-CN')}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {new Date(file.updatedAt).toLocaleString('zh-CN')}
            </Descriptions.Item>
            <Descriptions.Item label="创建人">{file.createdBy.username}</Descriptions.Item>
          </Descriptions>

          <Card title="文件内容" style={{ marginTop: 16 }}>
            {editing ? (
              <>
                <TextArea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="请输入 Proto 文件内容..."
                  autoSize={{ minRows: 10, maxRows: 30 }}
                  style={{ marginBottom: 16, fontFamily: 'monospace' }}
                />
                <Space>
                  <Button type="primary" onClick={handleEdit}>
                    保存
                  </Button>
                  <Button onClick={() => setEditing(false)}>
                    取消
                  </Button>
                </Space>
              </>
            ) : (
              <pre
                style={{
                  padding: 16,
                  background: '#f5f5f5',
                  borderRadius: 4,
                  overflow: 'auto',
                  fontFamily: 'monospace',
                  fontSize: 14,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {file.content}
              </pre>
            )}
          </Card>

          {file.status === 'rejected' && file.review?.reviewComment && (
            <Card title="审核意见" style={{ marginTop: 16 }}>
              <p style={{ color: '#ff4d4f' }}>{file.review.reviewComment}</p>
            </Card>
          )}
        </Card>
      </Space>
    </div>
  );
}
