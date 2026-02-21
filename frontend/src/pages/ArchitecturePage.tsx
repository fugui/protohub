/**
 * 架构全景图页面 - 基于 AntV G6 Combo 模式
 * 使用 Combo 作为分组容器，子系统作为 Combo 内的节点
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Card, Spin, message, Button, Space, Modal, Form, Input, Select, Drawer, List, Tag } from 'antd';
import { 
  EditOutlined, 
  SaveOutlined,
  ReloadOutlined,
  PlusOutlined,
  ApartmentOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Graph } from '@antv/g6';
import { api } from '../services/api';
import type { ArchitectureLayer, ArchitectureNode, ArchitectureEdge, ArchitectureGraph, ArchitectureCombo } from '../services/architectureService';

const { Option } = Select;

export function ArchitecturePage() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [layers, setLayers] = useState<ArchitectureLayer[]>([]);
  const [combos, setCombos] = useState<ArchitectureCombo[]>([]);
  
  const [selectedNode, setSelectedNode] = useState<ArchitectureNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<ArchitectureEdge | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [edgeDrawerVisible, setEdgeDrawerVisible] = useState(false);
  
  const [createGroupModalVisible, setCreateGroupModalVisible] = useState(false);
  const [createDependencyModalVisible, setCreateDependencyModalVisible] = useState(false);
  const [pendingEdge, setPendingEdge] = useState<{ source: string; target: string } | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [groupForm] = Form.useForm();
  
  // 使用 ref 跟踪编辑模式状态
  const editModeRef = useRef(editMode);
  useEffect(() => {
    editModeRef.current = editMode;
  }, [editMode]);

  // 获取架构图数据
  const fetchArchitectureData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/architecture/graph');
      const data: ArchitectureGraph = response.data;
      
      setLayers(data.layers);
      setCombos(data.combos || []);
      return data;
    } catch (error) {
      message.error('获取架构图失败');
      console.error(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化 G6 图
  useEffect(() => {
    if (!containerRef.current || graphRef.current) return;

    const graph = new Graph({
      container: containerRef.current,
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight || 800,
      
      // 节点配置 - 子系统
      node: {
        type: 'rect',
        style: {
          size: [160, 70],
          radius: 8,
          fill: '#e6f7ff',
          stroke: '#1890ff',
          lineWidth: 2,
          labelText: (d: any) => d.data?.name || d.id,
          labelFill: '#000',
          labelFontSize: 13,
          labelFontWeight: 'normal',
          labelPlacement: 'center',
          labelMaxWidth: 140,
          labelWordWrap: true,
          labelLineHeight: 18,
        },
        state: {
          selected: {
            stroke: '#ff4d4f',
            lineWidth: 3,
          },
          hover: {
            stroke: '#40a9ff',
            lineWidth: 3,
          },
        },
      },
      
      // Combo 配置 - 分组容器
      combo: {
        type: 'rect',
        style: {
          radius: 12,
          lineWidth: 2,
          lineDash: [6, 4],
          labelFontSize: 14,
          labelFontWeight: 'bold',
          labelFill: '#d46b08',
          labelPlacement: 'top',
          labelOffsetY: 8,
          fillOpacity: 0.1,
        },
        state: {
          collapsed: {
            // 折叠状态样式
          },
          dragenter: {
            // 拖拽进入时的高亮
            stroke: '#ff4d4f',
            lineWidth: 4,
          },
        },
      },
      
      // 边配置
      edge: {
        style: {
          stroke: '#a3b1bf',
          lineWidth: 2,
          endArrow: true,
        },
        state: {
          invalid: {
            stroke: '#ff4d4f',
            lineDash: [5, 5],
          },
        },
      },
      
      // 布局配置
      layout: {
        type: 'grid',
        rows: 3,
        cols: 5,
        rowGap: 80,
        colGap: 60,
      },
      
      // 交互
      behaviors: [
        'drag-canvas',
        'zoom-canvas',
        {
          type: 'drag-element',
          enable: () => editModeRef.current,
        },
        {
          type: 'hover-activate',
          degree: 1,
          state: 'hover',
        },
      ],
      
      plugins: [],
    });

    // 节点点击
    graph.on('node:click', (evt: any) => {
      const nodeId = evt.target?.id || evt.elementId;
      if (!nodeId) return;
      
      const nodeData = graph.getNodeData(nodeId);
      if (!nodeData) return;
      
      const model = nodeData.data || nodeData;

      if (editMode) {
        // 编辑模式下，选择源/目标（创建依赖）
        if (!selectedSource) {
          setSelectedSource(nodeId);
          graph.setElementState(nodeId, 'selected', true);
          message.info(`已选择源：${model?.name}`);
        } else if (selectedSource === nodeId) {
          setSelectedSource(null);
          graph.setElementState(nodeId, 'selected', false);
          message.info('取消选择');
        } else {
          handleValidateAndCreateEdge(selectedSource, nodeId);
        }
      } else {
        setSelectedNode(model as unknown as ArchitectureNode);
        setDrawerVisible(true);
      }
    });

    // Combo 点击 - 折叠/展开
    graph.on('combo:click', (evt: any) => {
      const comboId = evt.target?.id || evt.elementId;
      if (!comboId) return;
      
      // G6 v5: 通过 combo 数据获取折叠状态
      const comboData = graph.getComboData(comboId);
      if (comboData) {
        const isCollapsed = comboData.data?.collapsed || false;
        // 更新数据中的 collapsed 状态，重新渲染
        graph.updateComboData?.([{
          id: comboId,
          data: { ...comboData.data, collapsed: !isCollapsed },
        }]);
        // 触发重新渲染
        graph.draw();
      }
    });

    // 拖拽结束 - 检测是否拖入 Combo
    graph.on('element:dragend', async (evt: any) => {
      const elementId = evt.target?.id || evt.elementId;
      if (!elementId) return;
      
      // 只处理子系统节点
      if (!elementId.startsWith('sub_')) return;
      
      const nodeData = graph.getNodeData(elementId);
      if (!nodeData) return;
      
      const model = nodeData.data || nodeData;
      const x = (nodeData as any).x ?? 0;
      const y = (nodeData as any).y ?? 0;
      
      // 获取拖拽后所在的 Combo
      const parentComboId = (nodeData as any).combo;
      
      if (parentComboId) {
        // 如果已经在某个 Combo 中，提示已加入分组
        const comboData = graph.getComboData(parentComboId);
        if (comboData && editModeRef.current) {
          const comboName = comboData.data?.label || comboData.data?.name || '分组';
          message.success(`已将 "${model?.name}" 加入 "${comboName}"`);
          
          // 调用后端 API 保存归属关系
          try {
            const groupId = parseInt(parentComboId.replace('group_', ''));
            const subsystemId = parseInt(elementId.replace('sub_', ''));
            await api.post(`/architecture/groups/${groupId}/members`, {
              subsystemId,
              positionX: x,
              positionY: y,
            });
          } catch (error) {
            console.error('保存分组关系失败:', error);
          }
        }
      }
      
      // 保存位置
      try {
        await api.post('/architecture/node-positions', {
          positions: [{
            nodeId: elementId,
            nodeType: 'subsystem',
            x: x,
            y: y,
            layerLevel: model?.layerLevel,
            parentGroupId: parentComboId,
          }]
        });
      } catch (error) {
        console.error('保存位置失败:', error);
      }
    });

    // 拖拽进入 Combo - 视觉反馈
    graph.on('combo:dragenter', (evt: any) => {
      const comboId = evt.combo?.id;
      if (comboId && editModeRef.current) {
        graph.setElementState(comboId, 'dragenter', true);
      }
    });

    // 拖拽离开 Combo
    graph.on('combo:dragleave', (evt: any) => {
      const comboId = evt.combo?.id;
      if (comboId) {
        graph.setElementState(comboId, 'dragenter', false);
      }
    });

    // 边点击
    graph.on('edge:click', (evt: any) => {
      const edgeId = evt.target?.id || evt.elementId;
      if (!edgeId) return;
      
      const edgeData = graph.getEdgeData(edgeId);
      if (!edgeData) return;
      
      const model = edgeData.data || edgeData;
      setSelectedEdge(model as unknown as ArchitectureEdge);
      setEdgeDrawerVisible(true);
    });

    graphRef.current = graph;

    // 加载数据
    fetchArchitectureData().then(data => {
      if (data && graphRef.current) {
        renderGraph(data);
      }
    });

    // 窗口大小变化
    const handleResize = () => {
      if (containerRef.current && graphRef.current) {
        graphRef.current.setSize(
          containerRef.current.clientWidth,
          containerRef.current.clientHeight
        );
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (graphRef.current) {
        graphRef.current.destroy();
        graphRef.current = null;
      }
    };
  }, [fetchArchitectureData]);

  // 渲染图数据
  const renderGraph = (data: ArchitectureGraph) => {
    if (!graphRef.current) return;

    // 转换子系统节点
    const g6Nodes = data.nodes.map((node: ArchitectureNode) => ({
      id: node.id,
      data: node,
      combo: node.combo,  // 指定所属 Combo
      style: {
        fill: node.style?.color || '#e6f7ff',
        stroke: node.style?.borderColor || '#1890ff',
      },
    }));

    // 转换分组为 Combo
    const g6Combos = (data.combos || []).map((combo: ArchitectureCombo) => ({
      id: combo.id,
      data: combo,
      style: combo.style,
    }));

    // 转换边
    const g6Edges = data.edges.map((edge: ArchitectureEdge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      data: edge,
      style: {
        stroke: edge.valid ? (edge.direction === 'same' ? '#faad14' : '#52c41a') : '#ff4d4f',
        lineDash: edge.direction === 'same' ? [5, 5] : undefined,
        lineWidth: edge.valid ? 2 : 3,
      },
    }));

    graphRef.current.setData({ 
      nodes: g6Nodes, 
      edges: g6Edges,
      combos: g6Combos,
    });
    graphRef.current.render();
  };

  // 验证并创建依赖边
  const handleValidateAndCreateEdge = async (sourceId: string, targetId: string) => {
    if (!graphRef.current) return;

    try {
      const response = await api.post('/architecture/validate-dependency', {
        sourceId,
        targetId,
      });
      
      const validation = response.data;
      
      if (!validation.valid) {
        message.error(validation.reason);
        // 清除选中
        setSelectedSource(null);
        return;
      }
      
      if (validation.severity === 'warning') {
        message.warning(validation.reason);
      }
      
      setPendingEdge({ source: sourceId, target: targetId });
      setCreateDependencyModalVisible(true);
      
    } catch (error) {
      message.error('验证依赖失败');
    }
  };

  // 创建依赖
  const handleCreateDependency = async () => {
    if (!pendingEdge) return;
    
    try {
      message.success('依赖创建成功（演示）');
      setCreateDependencyModalVisible(false);
      setPendingEdge(null);
      setSelectedSource(null);
      
      // 刷新数据
      const data = await fetchArchitectureData();
      if (data) renderGraph(data);
    } catch (error) {
      message.error('创建依赖失败');
    }
  };

  // 切换编辑模式
  useEffect(() => {
    if (!graphRef.current || graphRef.current.destroyed) return;

    if (editMode) {
      message.info('进入编辑模式：可以拖拽节点、点击节点创建依赖');
    } else {
      setSelectedSource(null);
      // 清除选中状态
      const nodes = graphRef.current.getNodeData();
      nodes.forEach((node: any) => {
        graphRef.current?.setElementState(node.id, []);
      });
    }
  }, [editMode]);

  // 创建分组
  const handleCreateGroup = async (values: any) => {
    try {
      await api.post('/architecture/groups', {
        name: values.name,
        layerId: values.layerId,
        color: values.color,
      });
      message.success('分组创建成功');
      setCreateGroupModalVisible(false);
      groupForm.resetFields();
      const data = await fetchArchitectureData();
      if (data) renderGraph(data);
    } catch (error) {
      message.error('创建分组失败');
    }
  };

  // 从分组移除子系统
  const handleRemoveFromGroup = async (subsystem: ArchitectureNode) => {
    if (!subsystem.parentGroupId) {
      message.warning('该子系统不在任何分组中');
      return;
    }
    try {
      const groupId = parseInt(subsystem.parentGroupId.replace('group_', ''));
      const subsystemId = parseInt(subsystem.id.replace('sub_', ''));
      await api.delete(`/architecture/groups/${groupId}/members`, {
        data: { subsystemId },
      });
      message.success('已从分组移除');
      setDrawerVisible(false);
      // 刷新数据
      const data = await fetchArchitectureData();
      if (data) renderGraph(data);
    } catch (error) {
      message.error('移除失败');
    }
  };

  // 获取层级颜色
  const getLayerColor = (level: number) => {
    const layer = layers.find(l => l.level === level);
    return layer?.color || '#91cc75';
  };

  // 获取子系统所属分组名称
  const getComboName = (comboId?: string) => {
    if (!comboId) return null;
    const combo = combos.find(c => c.id === comboId);
    return combo?.label || combo?.data?.label;
  };

  return (
    <div style={{ height: '100%', padding: 24 }}>
      <Card
        title={
          <Space>
            <ApartmentOutlined />
            <span>架构全景图</span>
            <Tag color={editMode ? 'processing' : 'default'}>
              {editMode ? '编辑模式' : '预览模式'}
            </Tag>
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                graphRef.current?.layout();
                message.success('已重新布局');
              }}
            >
              重新布局
            </Button>
            <Button
              icon={<PlusOutlined />}
              onClick={() => setCreateGroupModalVisible(true)}
            >
              创建分组
            </Button>
            <Button
              type={editMode ? 'primary' : 'default'}
              icon={editMode ? <SaveOutlined /> : <EditOutlined />}
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? '退出编辑' : '编辑模式'}
            </Button>
          </Space>
        }
        styles={{ body: { height: 'calc(100vh - 200px)', padding: 0 } }}
        style={{ height: '100%' }}
      >
        {/* 层级图例 + 操作提示 */}
        <div style={{ padding: '8px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <span>层级：</span>
            {layers.map(layer => (
              <Tag key={layer.id} color={layer.color}>
                {layer.name}
              </Tag>
            ))}
          </Space>
          {editMode && (
            <Tag color="warning">
              提示：拖拽子系统到虚线框内可加入分组
            </Tag>
          )}
        </div>

        {/* G6 画布 */}
        <div 
          ref={containerRef}
          style={{ 
            width: '100%', 
            height: 'calc(100% - 48px)',
            background: '#fafafa',
          }}
        >
          {loading && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              height: '100%'
            }}>
              <Spin size="large" />
            </div>
          )}
        </div>
      </Card>

      {/* 节点详情抽屉 */}
      <Drawer
        title={selectedNode?.name}
        placement="right"
        width={400}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        {selectedNode && (
          <div>
            <p><strong>类型：</strong> {selectedNode.type === 'subsystem' ? '子系统' : '分组'}</p>
            <p><strong>所属层级：</strong> 
              <Tag color={getLayerColor(selectedNode.layerLevel)}>第 {selectedNode.layerLevel} 层</Tag>
            </p>
            {selectedNode.combo && (
              <p><strong>所属分组：</strong> 
                <Tag icon={<FolderOutlined />} color="orange">
                  {getComboName(selectedNode.combo)}
                </Tag>
              </p>
            )}
            {selectedNode.subsystemInfo && (
              <>
                <p><strong>接口文件数：</strong> {selectedNode.subsystemInfo.fileCount}</p>
                <p><strong>被依赖数：</strong> {selectedNode.subsystemInfo.dependenciesIn}</p>
                <p><strong>依赖其他数：</strong> {selectedNode.subsystemInfo.dependenciesOut}</p>
              </>
            )}
            
            {/* 分组操作按钮 */}
            {editMode && selectedNode.type === 'subsystem' && selectedNode.combo && (
              <Button
                danger
                block
                style={{ marginTop: 16 }}
                onClick={() => handleRemoveFromGroup(selectedNode)}
              >
                从分组移除
              </Button>
            )}
            
            <Button 
              type="primary" 
              block
              style={{ marginTop: 24 }}
              onClick={() => {
                if (selectedNode.type === 'subsystem') {
                  navigate(`/subsystems/${selectedNode.id.replace('sub_', '')}`);
                }
              }}
            >
              查看详情
            </Button>
          </div>
        )}
      </Drawer>

      {/* 依赖详情抽屉 */}
      <Drawer
        title="依赖详情"
        placement="right"
        width={500}
        onClose={() => setEdgeDrawerVisible(false)}
        open={edgeDrawerVisible}
      >
        {selectedEdge && (
          <div>
            <p>
              <strong>状态：</strong>{' '}
              {selectedEdge.valid ? (
                selectedEdge.direction === 'same' ? (
                  <Tag icon={<WarningOutlined />} color="warning">同级依赖</Tag>
                ) : (
                  <Tag icon={<CheckCircleOutlined />} color="success">合法</Tag>
                )
              ) : (
                <Tag icon={<WarningOutlined />} color="error">非法</Tag>
              )}
            </p>
            <p><strong>方向：</strong> {selectedEdge.sourceLayer} → {selectedEdge.targetLayer}</p>
            <p><strong>依赖文件数：</strong> {selectedEdge.dependencyCount}</p>

            <h4 style={{ marginTop: 24 }}>依赖文件列表</h4>
            <List
              dataSource={selectedEdge.fileDependencies || []}
              renderItem={(dep: any) => (
                <List.Item>
                  <div>
                    <div>{dep.sourceFile?.filename} → {dep.targetFile?.filename}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      {dep.sourceFile?.packageName} → {dep.targetFile?.packageName}
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </div>
        )}
      </Drawer>

      {/* 创建依赖确认模态框 */}
      <Modal
        title="创建依赖"
        open={createDependencyModalVisible}
        onOk={handleCreateDependency}
        onCancel={() => {
          setCreateDependencyModalVisible(false);
          setPendingEdge(null);
          setSelectedSource(null);
        }}
      >
        <p>确认创建从 <strong>{pendingEdge?.source}</strong> 到 <strong>{pendingEdge?.target}</strong> 的依赖？</p>
        <p style={{ color: '#666', fontSize: 14 }}>系统将自动验证依赖方向是否符合架构分层原则</p>
      </Modal>

      {/* 创建分组模态框 */}
      <Modal
        title="创建分组"
        open={createGroupModalVisible}
        onOk={() => groupForm.submit()}
        onCancel={() => {
          setCreateGroupModalVisible(false);
          groupForm.resetFields();
        }}
      >
        <Form form={groupForm} layout="vertical" onFinish={handleCreateGroup}>
          <Form.Item
            label="分组名称"
            name="name"
            rules={[{ required: true, message: '请输入分组名称' }]}
          >
            <Input placeholder="如：用户服务组" />
          </Form.Item>
          
          <Form.Item
            label="所属层级"
            name="layerId"
            rules={[{ required: true, message: '请选择层级' }]}
          >
            <Select placeholder="选择层级">
              {layers.map(layer => (
                <Option key={layer.id} value={layer.id}>{layer.name}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item label="颜色" name="color">
            <Select placeholder="选择颜色">
              <Option value="#1890ff"><span style={{ color: '#1890ff' }}>■ 蓝色</span></Option>
              <Option value="#52c41a"><span style={{ color: '#52c41a' }}>■ 绿色</span></Option>
              <Option value="#fa8c16"><span style={{ color: '#fa8c16' }}>■ 橙色</span></Option>
              <Option value="#722ed1"><span style={{ color: '#722ed1' }}>■ 紫色</span></Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
