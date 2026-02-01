/**
 * 审核工作台页面
 */

import { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, message, Modal, Input, Form, Select } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { getReviews, approveReview, rejectReview, getFileReviews } from '../services/reviewService';
import type { Review } from 'protohub-shared';

const { Column } = Table;

export function ReviewPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const fetchReviews = async (pageNum = 1) => {
    try {
      setLoading(true);
      const result = await getReviews({ page: pageNum, pageSize: 20 });
      setReviews(result.data);
      setTotal(result.total);
      setPage(pageNum);
    } catch (error: any) {
      message.error('获取审核列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleApprove = async (review: Review) => {
    Modal.confirm({
      title: '确认批准',
      content: `确定要批准文件 "${review.file?.filename || ''}" 的审核吗？`,
      onOk: async () => {
        try {
          setApproving(true);
          await approveReview(review.id);
          message.success('审核已批准');
          await fetchReviews();
        } catch (error: any) {
          message.error('操作失败');
        } finally {
          setApproving(false);
        }
      },
    });
  };

  const showRejectModal = (review: Review) => {
    setSelectedReview(review);
    setRejectModalVisible(true);
    setRejectReason('');
  };

  const handleReject = async () => {
    if (!selectedReview || !rejectReason.trim()) {
      message.warning('请填写拒绝原因');
      return;
    }

    try {
      setRejecting(true);
      await rejectReview(selectedReview.id, rejectReason);
      message.success('审核已拒绝');
      setRejectModalVisible(false);
      setRejectReason('');
      setSelectedReview(null);
      await fetchReviews();
    } catch (error: any) {
      message.error('操作失败');
    } finally {
      setRejecting(false);
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending_review: { color: 'processing', text: '待审核' },
      approved: { color: 'success', text: '已批准' },
      rejected: { color: 'error', text: '已拒绝' },
    };
    const { color, text } = statusMap[status] || { color: 'default', text: status };
    return <Tag color={color}>{text}</Tag>;
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <h1>审核工作台</h1>
        <p>管理待审核的 Proto 文件变更请求</p>
      </div>

      <Table
        dataSource={reviews}
        loading={loading}
        rowKey="id"
        pagination={{
          current: page,
          total,
          pageSize: 20,
          onChange: (newPage) => fetchReviews(newPage),
        }}
        columns={[
          {
            title: '文件名',
            dataIndex: ['file'],
            key: 'filename',
            render: (file: any) => file?.filename || '-',
          },
          {
            title: '提交时间',
            dataIndex: 'submittedAt',
            key: 'submittedAt',
            render: (date) => new Date(date).toLocaleString('zh-CN'),
          },
          {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (status) => getStatusTag(status),
          },
          {
            title: '提交人',
            dataIndex: 'submittedBy',
            key: 'submittedBy',
            render: (submitter: any) => submitter?.username || '-',
          },
          {
            title: '审核人',
            dataIndex: 'reviewedBy',
            key: 'reviewedBy',
            render: (reviewer: any) => reviewer?.username || '-',
          },
          {
            title: '审核时间',
            dataIndex: 'reviewedAt',
            key: 'reviewedAt',
            render: (date) => (date ? new Date(date).toLocaleString('zh-CN') : '-'),
          },
          {
            title: '审核意见',
            dataIndex: 'reviewComment',
            key: 'reviewComment',
            render: (comment) => comment || '-',
          },
          {
            title: '操作',
            key: 'actions',
            render: (_: any, record: Review) => {
              if (record.status === 'pending_review') {
                return (
                  <Space>
                    <Button
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      onClick={() => handleApprove(record)}
                      loading={approving && selectedReview?.id === record.id}
                      size="small"
                    >
                      批准
                    </Button>
                    <Button
                      icon={<CloseCircleOutlined />}
                      danger
                      onClick={() => showRejectModal(record)}
                      loading={rejecting && selectedReview?.id === record.id}
                      size="small"
                    >
                      拒绝
                    </Button>
                  </Space>
                );
              }
              return <span>-</span>;
            },
          },
        ]}
      />

      <Modal
        title="拒绝审核"
        open={rejectModalVisible}
        onOk={handleReject}
        onCancel={() => {
          setRejectModalVisible(false);
          setRejectReason('');
          setSelectedReview(null);
        }}
        confirmLoading={rejecting}
        okText="确定拒绝"
        okButtonProps={{ danger: true }}
      >
        <Form layout="vertical">
          <Form.Item label="拒绝原因" required>
            <Input.TextArea
              rows={4}
              placeholder="请输入拒绝原因"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
