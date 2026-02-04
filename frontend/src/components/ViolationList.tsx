/**
 * 违规格项列表组件
 */

import { useState } from 'react';
import { Table, Space, Tag, Alert, Button, Card } from 'antd';
import { CloseOutlined, EditOutlined, FileTextOutlined } from '@ant-design/icons';
import type { Violation } from 'protohub-shared';

export interface ViolationListProps {
  violations: Violation[];
  onClose?: () => void;
  title?: string;
}

export function ViolationList({ violations, onClose, title = '违规项列表' }: ViolationListProps) {
  const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');

  const filteredViolations = violations.filter((v) => {
    if (filter === 'all') return true;
    return v.severity === filter;
  });

  const getSeverityTag = (severity: string) => {
    const severityConfig: Record<string, { color: string; icon: string; text: string }> = {
      error: { color: 'error', icon: '❌', text: '错误' },
      warning: { color: 'warning', icon: '⚠️', text: '警告' },
      info: { color: 'default', icon: 'ℹ️', text: '提示' },
    };
    const config = severityConfig[severity] || severityConfig.info;
    return <Tag color={config.color}>{config.icon} {config.text}</Tag>;
  };

  const getRuleTypeText = (ruleType: string) => {
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

  const handleQuickFix = (violation: Violation) => {
    if (violation.suggestion) {
      navigator.clipboard.writeText(violation.suggestion).then(() => {
        // 可以在这里添加消息提示
      });
    }
  };

  const columns = [
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
      render: (ruleType: string) => <span>{getRuleTypeText(ruleType)}</span>,
    },
    {
      title: '位置',
      dataIndex: 'fileLine',
      key: 'fileLine',
      width: 80,
      render: (line: number) => (line ? `第 ${line} 行` : '-'),
    },
    {
      title: '违规说明',
      dataIndex: 'violationMessage',
      key: 'violationMessage',
      ellipsis: true,
      render: (message: string) => (
        <div style={{ maxWidth: 400 }}>
          {message}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_: any, record: Violation) => (
        <Space size="small">
          {record.suggestion && (
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleQuickFix(record)}
            >
              复制建议
            </Button>
          )}
          <Button
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => {
              navigator.clipboard.writeText(record.violationMessage);
            }}
          >
            复制描述
          </Button>
        </Space>
      ),
    },
    {
      title: '修改建议',
      dataIndex: 'suggestion',
      key: 'suggestion',
      ellipsis: true,
      render: (suggestion: string) => (
        <div style={{ maxWidth: 300, fontSize: 12 }}>
          {suggestion ? (
            <Alert
              message={suggestion}
              type="info"
              showIcon
              style={{ marginBottom: 0 }}
            />
          ) : (
            <span style={{ color: '#999' }}>-</span>
          )}
        </div>
      ),
    },
  ];

  const errorCount = violations.filter((v) => v.severity === 'error').length;
  const warningCount = violations.filter((v) => v.severity === 'warning').length;
  const infoCount = violations.filter((v) => v.severity === 'info').length;

  return (
    <Card
      title={
        <Space>
          <span>{title}</span>
          {onClose && (
            <Button icon={<CloseOutlined />} onClick={onClose}>
              关闭
            </Button>
          )}
        </Space>
      }
      extra={
        <Space>
          <span style={{ fontSize: 12 }}>总计：{violations.length} 条</span>
          {errorCount > 0 && (
            <Tag color="error" style={{ marginLeft: 8 }}>
              错误：{errorCount}
            </Tag>
          )}
          {warningCount > 0 && (
            <Tag color="warning" style={{ marginLeft: 8 }}>
              警告：{warningCount}
            </Tag>
          )}
          {infoCount > 0 && (
            <Tag color="default" style={{ marginLeft: 8 }}>
              提示：{infoCount}
            </Tag>
          )}
        </Space>
      }
    >
      <Space direction="vertical" size="middle" style={{ marginBottom: 16 }}>
        {/* 筛选标签 */}
        <Space style={{ marginBottom: 16 }}>
          <Button
            type={filter === 'all' ? 'primary' : 'default'}
            onClick={() => setFilter('all')}
          >
            全部
          </Button>
          <Button
            type={filter === 'error' ? 'primary' : 'default'}
            onClick={() => setFilter('error')}
          >
            错误
          </Button>
          <Button
            type={filter === 'warning' ? 'primary' : 'default'}
            onClick={() => setFilter('warning')}
          >
            警告
          </Button>
          <Button
            type={filter === 'info' ? 'primary' : 'default'}
            onClick={() => setFilter('info')}
          >
            提示
          </Button>
        </Space>

        {/* 违规项列表 */}
        {filteredViolations.length > 0 ? (
          <Table
            dataSource={filteredViolations}
            columns={columns}
            rowKey="id"
            pagination={false}
            size="small"
            scroll={{ y: 400 }}
            expandable={{
              expandedRowRender: (record: Violation) => (
                <Card size="small" style={{ margin: 8 }}>
                  <Space direction="vertical" size="small">
                    <div>
                      <strong>违规说明：</strong>
                      <p>{record.violationMessage}</p>
                    </div>
                    {record.suggestion && (
                      <div>
                        <strong>修改建议：</strong>
                        <p style={{ fontSize: 12 }}>{record.suggestion}</p>
                      </div>
                    )}
                  </Space>
                </Card>
              ),
            }}
          />
        ) : (
          <Alert
            message={`没有发现${filter === 'all' ? '违规项' : `${filter === 'error' ? '错误' : filter === 'warning' ? '警告' : '提示'}违规项`}`}
            type="info"
            showIcon
          />
        )}
      </Space>
    </Card>
  );
}
