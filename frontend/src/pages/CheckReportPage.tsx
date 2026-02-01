/**
 * 检查报告页面
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Table, Space, Button, Tag, message, Descriptions, Spin, Breadcrumb, Progress, Empty, Alert } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined, ArrowLeftOutlined, DownloadOutlined } from '@ant-design/icons';
import type { CheckReport, Violation } from 'protohub-shared';

export function CheckReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [report, setReport] = useState<CheckReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchCheckReport();
  }, [id]);

  const fetchCheckReport = async () => {
    try {
      setLoading(true);
      const { getCheckReport } = await import('../services/checkService');
      const result = await getCheckReport(Number(id));
      setReport(result);
    } catch (error: any) {
      message.error('获取检查报告失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!report) return;

    const content = `ProtoHub 检查报告
文件ID: ${report.file?.id}
文件名: ${report.file?.filename}
检查时间: ${report.checkedAt}

违规项总数: ${report.violations?.length || 0}
通过检查: ${report.violations?.filter((v: Violation) => v.severity !== 'error').length || 0}

违规项详情:
${report.violations?.map((v: Violation) => `
- ${v.severity === 'error' ? '❌' : '⚠️'} [${v.ruleType}] ${v.violationMessage}
  位置: 行 ${v.fileLine || 'N/A'}
  ${v.suggestion ? `建议: ${v.suggestion}` : ''}
`).join('\n')}`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `check_report_${report.file?.filename}_${new Date().getTime()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloading(false);
    setTimeout(() => {
      message.success('报告下载成功');
    }, 500);
  };

  const getSeverityTag = (severity: string) => {
    const severityConfig: Record<string, { color: string; icon: string; text: string }> = {
      error: { color: 'error', icon: '❌', text: '错误' },
      warning: { color: 'warning', icon: '⚠️', text: '警告' },
      info: { color: 'default', icon: 'ℹ️', text: '信息' },
    };
    const config = severityConfig[severity] || severityConfig.info;
    return <Tag color={config.color}>{config.icon} {config.text}</Tag>;
  };

  const getRuleTypeTag = (ruleType: string) => {
    const typeMap: Record<string, string> = {
      naming_file: '文件命名',
      naming_package: '包命名',
      naming_message: '消息命名',
      naming_field: '字段命名',
      naming_service: '服务命名',
      vocabulary: '词汇规范',
      common_interface: '公共接口',
    };
    return typeMap[ruleType] || ruleType;
  };

  const violationColumns = [
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity: string) => getSeverityTag(severity),
    },
    {
      title: '规则类型',
      dataIndex: 'ruleType',
      key: 'ruleType',
      width: 120,
      render: (ruleType: string) => <span>{getRuleTypeTag(ruleType)}</span>,
    },
    {
      title: '位置',
      dataIndex: 'fileLine',
      key: 'fileLine',
      width: 80,
    },
    {
      title: '违规说明',
      dataIndex: 'violationMessage',
      key: 'violationMessage',
    },
    {
      title: '修改建议',
      dataIndex: 'suggestion',
      key: 'suggestion',
      render: (suggestion: string) => (
        <span style={{ color: '#1890ff' }}>{suggestion || '-'}</span>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!report) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <Empty description="检查报告不存在" />
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/files/${id}`)}
          style={{ marginTop: 16 }}
        >
          返回文件详情
        </Button>
      </div>
    );
  }

  const errorCount = report.violations?.filter((v: Violation) => v.severity === 'error').length || 0;
  const warningCount = report.violations?.filter((v: Violation) => v.severity === 'warning').length || 0;
  const infoCount = report.violations?.filter((v: Violation) => v.severity === 'info').length || 0;
  const totalCount = report.violations?.length || 0;

  const passed = errorCount === 0;
  const progressPercent = passed ? 100 : Math.round(((totalCount - errorCount) / totalCount) * 100);

  return (
    <div style={{ padding: 24 }}>
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate(`/files/${id}`)}>文件详情</Breadcrumb.Item>
        <Breadcrumb.Item>检查报告</Breadcrumb.Item>
      </Breadcrumb>

      <Card title={report.file?.filename} style={{ marginBottom: 16 }}>
        <Descriptions column={2} bordered>
          <Descriptions.Item label="文件名">{report.file?.filename}</Descriptions.Item>
          <Descriptions.Item label="包名">{report.file?.packageName}</Descriptions.Item>
          <Descriptions.Item label="版本">{report.file?.currentVersion}</Descriptions.Item>
          <Descriptions.Item label="检查时间">
            {new Date(report.checkedAt).toLocaleString('zh-CN')}
          </Descriptions.Item>
        </Descriptions>

        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* 检查结果摘要 */}
          <Card title="检查结果摘要">
            <Space size="large" style={{ width: '100%' }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <Progress
                  type={passed ? 'success' : 'exception'}
                  percent={progressPercent}
                  strokeColor={{
                    '0%': passed ? '#52c41a' : '#ff4d4f',
                    '100%': passed ? '#52c41a' : '#ff4d4f',
                  }}
                />
                <div style={{ marginTop: 16, fontSize: 24, fontWeight: 'bold' }}>
                  {passed ? '✓ 通过' : '✗ 失败'}
                </div>
              </div>

              <div style={{ flex: 2 }}>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <div>
                    <span style={{ color: '#52c41a', fontSize: 20, fontWeight: 'bold' }}>
                      {errorCount}
                    </span>
                    <span style={{ marginLeft: 8 }}>个错误</span>
                  </div>
                  <div>
                    <span style={{ color: '#faad14', fontSize: 16 }}>
                      {warningCount}
                    </span>
                    <span style={{ marginLeft: 8 }}>个警告</span>
                  </div>
                  <div>
                    <span style={{ color: '#1890ff', fontSize: 16 }}>
                      {infoCount}
                    </span>
                    <span style={{ marginLeft: 8 }}>个提示</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 16, fontWeight: 'bold' }}>
                      {totalCount}
                    </span>
                    <span style={{ marginLeft: 8 }}>个违规项</span>
                  </div>
                </Space>
              </div>
            </Space>
          </Card>

          {/* 违规项列表 */}
          <Card
            title={`违规项列表 (${totalCount} 条)`}
            extra={
              <Button
                icon={<DownloadOutlined />}
                onClick={handleDownload}
                loading={downloading}
              >
                下载报告
              </Button>
            }
            >
            {report.violations && report.violations.length > 0 ? (
              <Table
                dataSource={report.violations}
                columns={violationColumns}
                rowKey="id"
                pagination={false}
                size="small"
                scroll={{ y: 400 }}
                expandable={{
                  expandedRowRender: (record: Violation) => (
                    <Alert
                      message={
                        <Space direction="vertical" size="small">
                          <span><strong>建议：</strong> {record.suggestion}</span>
                          {record.fileLine && (
                            <span>位置：第 {record.fileLine} 行</span>
                          )}
                        </Space>
                      }
                      type={record.severity === 'error' ? 'error' : 'warning'}
                      showIcon
                    />
                  ),
                }}
              />
            ) : (
              <Empty description="没有发现违规项" />
            )}
          </Card>

          {passed && (
            <Alert
              message="恭喜！该文件通过了所有检查规则，可以提交审核。"
              type="success"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
        </Space>
      </Card>
    </div>
  );
}
