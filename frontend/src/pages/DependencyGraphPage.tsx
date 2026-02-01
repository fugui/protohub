/**
 * 依赖关系图页面
 */

import { useState, useEffect } from 'react';
import { Card, Select, Button, Space, message, Spin, Row, Col, List, Tag } from 'antd';
import { ReloadOutlined, ApartmentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { DependencyGraph } from '../components/DependencyGraph';
import { getDependencyGraph, getImpactAnalysis, getAllSubsystems } from '../services/dependencyService';
import type { DependencyNode, DependencyEdge } from 'protohub-shared';

const { Option } = Select;

export function DependencyGraphPage() {
  const [nodes, setNodes] = useState<DependencyNode[]>([]);
  const [edges, setEdges] = useState<DependencyEdge[]>([]);
  const [circularDependencies, setCircularDependencies] = useState<string[][]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<number | undefined>();
  const [selectedSubsystemId, setSelectedSubsystemId] = useState<number | undefined>();
  const [subsystems, setSubsystems] = useState<any[]>([]);
  const [impactData, setImpactData] = useState<{
    affectedSubsystems: string[];
    affectedFiles: number;
    dependencyChain: string[];
  } | null>(null);
  const navigate = useNavigate();

  const fetchSubsystems = async () => {
    try {
      const data = await getAllSubsystems();
      setSubsystems(data);
    } catch (error: any) {
      message.error('获取子系统列表失败');
    }
  };

  const fetchGraph = async (params: { fileId?: number; subsystemId?: number } = {}) => {
    try {
      setLoading(true);
      const data = await getDependencyGraph(params);
      setNodes(data.nodes);
      setEdges(data.edges);
      setCircularDependencies(data.circularDependencies || []);
    } catch (error: any) {
      message.error('获取依赖关系图失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubsystems();
    fetchGraph();
  }, []);

  const handleRefresh = () => {
    fetchGraph({ fileId: selectedFileId, subsystemId: selectedSubsystemId });
    if (selectedFileId) {
      fetchImpactAnalysis(selectedFileId);
    } else {
      setImpactData(null);
    }
  };

  const handleFileFilter = (value: number) => {
    setSelectedFileId(value);
    fetchGraph({ fileId: value, subsystemId: selectedSubsystemId });
    fetchImpactAnalysis(value);
  };

  const handleSubsystemFilter = (value: number) => {
    setSelectedSubsystemId(value);
    setSelectedFileId(undefined);
    setImpactData(null);
    fetchGraph({ subsystemId: value });
  };

  const handleNodeClick = (node: DependencyNode) => {
    const fileId = parseInt(node.id);
    setSelectedFileId(fileId);
    fetchImpactAnalysis(fileId);
  };

  const fetchImpactAnalysis = async (fileId: number) => {
    try {
      const data = await getImpactAnalysis(fileId);
      setImpactData(data);
    } catch (error: any) {
      message.error('获取影响分析失败');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h1>
          <ApartmentOutlined /> 依赖关系图
        </h1>
        <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
          刷新
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space>
          <span>筛选:</span>
          <Select
            style={{ width: 200 }}
            placeholder="选择子系统"
            allowClear
            onChange={handleSubsystemFilter}
            value={selectedSubsystemId}
          >
            {subsystems.map((subsystem) => (
              <Option key={subsystem.id} value={subsystem.id}>
                {subsystem.name}
              </Option>
            ))}
          </Select>
        </Space>
      </Card>

      <Row gutter={16}>
        <Col span={16}>
          <Card
            title="依赖关系图"
            extra={
              circularDependencies.length > 0 && (
                <Tag color="error">发现 {circularDependencies.length} 个循环依赖</Tag>
              )
            }
          >
            <Spin spinning={loading}>
              <DependencyGraph
                nodes={nodes}
                edges={edges}
                circularDependencies={circularDependencies}
                loading={loading}
                onNodeClick={handleNodeClick}
              />
            </Spin>
          </Card>

          {circularDependencies.length > 0 && (
            <Card title="循环依赖详情" style={{ marginTop: 16 }}>
              <List
                dataSource={circularDependencies}
                renderItem={(cycle, index) => (
                  <List.Item>
                    <List.Item.Meta
                      title={`循环依赖 #${index + 1}`}
                      description={
                        <Tag color="error">{cycle.join(' → ')} → {cycle[0]}</Tag>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          )}
        </Col>

        <Col span={8}>
          {impactData && (
            <Card title="影响范围分析">
              <p>
                <strong>影响的文件数量:</strong> {impactData.affectedFiles}
              </p>
              <p>
                <strong>影响的子系统:</strong>
              </p>
              <div style={{ marginBottom: 16 }}>
                {impactData.affectedSubsystems.map((subsystem) => (
                  <Tag key={subsystem} color="blue">
                    {subsystem}
                  </Tag>
                ))}
              </div>
              <p>
                <strong>依赖链:</strong>
              </p>
              <div>
                {impactData.dependencyChain.map((file, index) => (
                  <Tag
                    key={index}
                    color={index === 0 ? 'green' : 'default'}
                    style={{ marginBottom: 4 }}
                  >
                    {file}
                    {index < impactData.dependencyChain.length - 1 && ' → '}
                  </Tag>
                ))}
              </div>
            </Card>
          )}

          <Card title="图例" style={{ marginTop: 16 }}>
            <p>
              <Tag color="#5470c6">文件节点</Tag>
            </p>
            <p>
              <Tag color="#91cc75">子系统节点</Tag>
            </p>
            <p>
              <Tag color="#fac858">服务节点</Tag>
            </p>
            <p style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
              点击节点可查看影响范围分析
            </p>
            <p style={{ fontSize: 12, color: '#666' }}>
              红色边表示循环依赖
            </p>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
