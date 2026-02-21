/**
 * 审核工作台页面
 */

import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, message, Modal, Input, Form, Tabs, Badge, Card, List, Tooltip, Divider } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, EyeOutlined, FileTextOutlined, WarningOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { getReviews, approveReview, rejectReview, getVocabularyReport } from '../services/reviewService';
import type { Review, Violation } from 'protohub-shared';
import type { VocabularyReport } from '../services/reviewService';

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

  const [activeStatus, setActiveStatus] = useState('pending_review');

  // 详情模态框状态
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [vocabularyReport, setVocabularyReport] = useState<VocabularyReport | null>(null);
  const [loadingVocabulary, setLoadingVocabulary] = useState(false);
  const [detailActiveTab, setDetailActiveTab] = useState('info');

  const fetchReviews = async (pageNum = 1, status = activeStatus) => {
    try {
      setLoading(true);
      // Pass status to API. Assuming getReviews supports it now.
      // Need to update getReviews service in frontend too?
      // Step 419 shows `import { getReviews ... }`. Check frontend service.
      const result = await getReviews({ page: pageNum, pageSize: 20, status });
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

  const getSeverityTag = (severity: string) => {
    const severityMap: Record<string, { color: string; icon: React.ReactNode; text: string }> = {
      error: { color: 'error', icon: <CloseCircleOutlined />, text: '错误' },
      warning: { color: 'warning', icon: <WarningOutlined />, text: '警告' },
      info: { color: 'default', icon: <InfoCircleOutlined />, text: '提示' },
    };
    const config = severityMap[severity] || severityMap.info;
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  const showDetailModal = async (review: Review) => {
    setSelectedReview(review);
    setDetailModalVisible(true);
    setDetailActiveTab('info');
    await loadVocabularyReport(review.file?.id);
  };

  const loadVocabularyReport = async (fileId?: number) => {
    if (!fileId) return;
    try {
      setLoadingVocabulary(true);
      const report = await getVocabularyReport(fileId);
      setVocabularyReport(report);
    } catch (error) {
      message.error('加载术语检查报告失败');
      console.error('加载术语检查报告失败:', error);
    } finally {
      setLoadingVocabulary(false);
    }
  };

  const handleGenerateTermComment = (violation: Violation) => {
    const comment = `术语规范建议：${violation.violationMessage}`;
    if (violation.suggestion) {
      setRejectReason(prev => prev ? `${prev}\n${comment}，${violation.suggestion}` : `${comment}，${violation.suggestion}`);
    } else {
      setRejectReason(prev => prev ? `${prev}\n${comment}` : comment);
    }
    message.success('已生成评论到拒绝原因');
  };

  const handleGenerateAllTermsComment = () => {
    if (!vocabularyReport?.violations.length) {
      message.info('没有术语违规项');
      return;
    }
    const comments = vocabularyReport.violations.map(v => `• ${v.violationMessage}`);
    const fullComment = `术语规范检查发现问题：\n${comments.join('\n')}`;
    setRejectReason(prev => prev ? `${prev}\n\n${fullComment}` : fullComment);
    message.success('已生成所有术语评论到拒绝原因');
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <h1>审核工作台</h1>
        <p>管理待审核的 Proto 文件变更请求</p>
      </div>

      <Tabs
        activeKey={activeStatus}
        onChange={(key) => {
          setActiveStatus(key);
          setPage(1);
          fetchReviews(1, key);
        }}
        items={[
          { key: 'pending_review', label: '待审核' },
          { key: 'history', label: '审核历史' },
        ]}
        style={{ marginBottom: 16 }}
      />

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
            render: (_: any, record: Review) => (
              <Space>
                <Button
                  icon={<EyeOutlined />}
                  onClick={() => showDetailModal(record)}
                  size="small"
                >
                  详情
                </Button>
                {record.status === 'pending_review' && (
                  <>
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
                  </>
                )}
              </Space>
            ),
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

      {/* 审核详情模态框 */}
      <Modal
        title={`审核详情 - ${selectedReview?.file?.filename || ''}`}
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedReview(null);
          setVocabularyReport(null);
          setDetailActiveTab('info');
        }}
        footer={[
          <Button key="close" onClick={() => {
            setDetailModalVisible(false);
            setSelectedReview(null);
            setVocabularyReport(null);
            setDetailActiveTab('info');
          }}>
            关闭
          </Button>,
          selectedReview?.status === 'pending_review' && (
            <Button
              key="reject"
              danger
              onClick={() => {
                setDetailModalVisible(false);
                showRejectModal(selectedReview);
              }}
            >
              拒绝
            </Button>
          ),
          selectedReview?.status === 'pending_review' && (
            <Button
              key="approve"
              type="primary"
              onClick={() => {
                setDetailModalVisible(false);
                handleApprove(selectedReview);
              }}
            >
              批准
            </Button>
          ),
        ].filter(Boolean)}
        width={800}
      >
        <Tabs
          activeKey={detailActiveTab}
          onChange={setDetailActiveTab}
          items={[
            {
              key: 'info',
              label: '基本信息',
              children: selectedReview && (
                <div>
                  <p><strong>文件名:</strong> {selectedReview.file?.filename}</p>
                  <p><strong>包名:</strong> {selectedReview.file?.packageName || '-'}</p>
                  <p><strong>状态:</strong> {getStatusTag(selectedReview.status)}</p>
                  <p><strong>提交人:</strong> {selectedReview.submittedBy?.username || '-'}</p>
                  <p><strong>提交时间:</strong> {new Date(selectedReview.submittedAt).toLocaleString('zh-CN')}</p>
                  {selectedReview.reviewedBy && (
                    <>
                      <p><strong>审核人:</strong> {selectedReview.reviewedBy.username}</p>
                      <p><strong>审核时间:</strong> {selectedReview.reviewedAt ? new Date(selectedReview.reviewedAt).toLocaleString('zh-CN') : '-'}</p>
                    </>
                  )}
                  {selectedReview.reviewComment && (
                    <p><strong>审核意见:</strong> {selectedReview.reviewComment}</p>
                  )}
                </div>
              ),
            },
            {
              key: 'vocabulary',
              label: (
                <span>
                  术语检查报告
                  {vocabularyReport && vocabularyReport.violationCount > 0 && (
                    <Badge
                      count={vocabularyReport.violationCount}
                      style={{ marginLeft: 8 }}
                      showZero={false}
                    />
                  )}
                </span>
              ),
              children: (
                <div>
                  {loadingVocabulary ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>加载中...</div>
                  ) : vocabularyReport ? (
                    <>
                      <Card size="small" style={{ marginBottom: 16 }}>
                        <Space split={<Divider type="vertical" />}>
                          <span>术语总数: <strong>{vocabularyReport.totalTerms}</strong></span>
                          <span style={{ color: '#ff4d4f' }}>错误: <strong>{vocabularyReport.errorCount}</strong></span>
                          <span style={{ color: '#faad14' }}>警告: <strong>{vocabularyReport.warningCount}</strong></span>
                          <span style={{ color: '#8c8c8c' }}>提示: <strong>{vocabularyReport.infoCount}</strong></span>
                        </Space>
                      </Card>

                      {vocabularyReport.violations.length > 0 ? (
                        <>
                          {selectedReview?.status === 'pending_review' && (
                            <Button
                              type="primary"
                              icon={<FileTextOutlined />}
                              onClick={handleGenerateAllTermsComment}
                              style={{ marginBottom: 16 }}
                              block
                            >
                              一键生成术语评论
                            </Button>
                          )}
                          <List
                            dataSource={vocabularyReport.violations}
                            renderItem={(violation) => (
                              <List.Item>
                                <Card
                                  size="small"
                                  style={{ width: '100%' }}
                                  title={
                                    <Space>
                                      {getSeverityTag(violation.severity)}
                                      <span>第 {violation.fileLine || '-'} 行</span>
                                    </Space>
                                  }
                                  extra={
                                    selectedReview?.status === 'pending_review' && (
                                      <Tooltip title="生成评论到拒绝原因">
                                        <Button
                                          size="small"
                                          icon={<FileTextOutlined />}
                                          onClick={() => handleGenerateTermComment(violation)}
                                        >
                                          生成评论
                                        </Button>
                                      </Tooltip>
                                    )
                                  }
                                >
                                  <p><strong>问题:</strong> {violation.violationMessage}</p>
                                  {violation.suggestion && (
                                    <p style={{ color: '#1890ff' }}>
                                      <strong>建议:</strong> {violation.suggestion}
                                    </p>
                                  )}
                                </Card>
                              </List.Item>
                            )}
                          />
                        </>
                      ) : (
                        <div style={{ textAlign: 'center', padding: 40, color: '#52c41a' }}>
                          <CheckCircleOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                          <p>恭喜！未发现术语违规项</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                      无法加载术语检查报告
                    </div>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Modal>
    </div>
  );
}
