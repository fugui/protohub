/**
 * 仪表板/首页页面
 */

import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Space,
  List,
  Tag,
  Typography,
  Divider,
} from 'antd';
import {
  FileTextOutlined,
  CheckSquareOutlined,
  ApartmentOutlined,
  PartitionOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getFiles } from '../services/fileService';
import type { ProtoFile } from 'protohub-shared';

const { Title, Text } = Typography;

export function DashboardPage() {
  const [loading, setLoading] = useState(false);
  const [fileStats, setFileStats] = useState({
    total: 0,
    draft: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [recentFiles, setRecentFiles] = useState<ProtoFile[]>([]);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await getFiles({ page: 1, pageSize: 10 });
      const files = result.data;

      const stats = {
        total: result.total,
        draft: files.filter((f) => f.status === 'draft').length,
        pending: files.filter((f) => f.status === 'pending_review').length,
        approved: files.filter((f) => f.status === 'approved').length,
        rejected: files.filter((f) => f.status === 'rejected').length,
      };

      setFileStats(stats);
      setRecentFiles(files.slice(0, 5));
    } catch (error: any) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between' }}>
        <Title level={2}>仪表板</Title>
        <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
          刷新
        </Button>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="文件总数"
              value={fileStats.total}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="草稿"
              value={fileStats.draft}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#8c8c8c' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待审核"
              value={fileStats.pending}
              prefix={<CheckSquareOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已批准"
              value={fileStats.approved}
              prefix={<CheckSquareOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 快捷操作 */}
      <Card title="快捷操作" style={{ marginBottom: 24 }}>
        <Space size="large">
          <Button type="primary" size="large" onClick={() => navigate('/files')}>
            <FileTextOutlined /> 文件管理
          </Button>
          <Button size="large" onClick={() => navigate('/reviews')}>
            <CheckSquareOutlined /> 审核工作台
          </Button>
          <Button size="large" onClick={() => navigate('/architecture')}>
            <ApartmentOutlined /> 架构全景图
          </Button>
          <Button size="large" onClick={() => navigate('/function-modules')}>
            <PartitionOutlined /> 功能模块管理
          </Button>
        </Space>
      </Card>

      <Row gutter={16}>
        {/* 最近文件 */}
        <Col span={12}>
          <Card
            title="最近文件"
            extra={<Button type="link" onClick={() => navigate('/files')}>查看全部</Button>}
          >
            <List
              dataSource={recentFiles}
              loading={loading}
              renderItem={(file) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <a
                        onClick={() => navigate(`/files/${file.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        {file.filename}
                      </a>
                    }
                    description={
                      <Space>
                        <Text type="secondary">{file.packageName}</Text>
                        {getStatusTag(file.status)}
                      </Space>
                    }
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {new Date(file.createdAt).toLocaleDateString('zh-CN')}
                  </Text>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 系统信息 */}
        <Col span={12}>
          <Card title="系统信息">
            <Divider orientation="left">功能概览</Divider>
            <List
              size="small"
              dataSource={[
                { icon: <FileTextOutlined />, text: 'Proto 文件管理 - 上传、编辑、删除文件', desc: '支持版本控制和文件锁定' },
                { icon: <CheckSquareOutlined />, text: '审核流程 - 提交、审核、批准/拒绝', desc: '完整的审核工作流和通知' },
                { icon: <CheckSquareOutlined />, text: '自动检查 - 命名规范、词汇规范', desc: '自动检测违规并提供修改建议' },
                { icon: <ApartmentOutlined />, text: '依赖分析 - 关系图、循环检测', desc: '可视化的依赖关系和影响范围分析' },
              ]}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<div style={{ fontSize: 20 }}>{item.icon}</div>}
                    title={item.text}
                    description={item.desc}
                  />
                </List.Item>
              )}
            />
            <Divider />
            <Text type="secondary" style={{ fontSize: 12 }}>
              ProtoHub - 专业的 Proto 文件管理系统
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
