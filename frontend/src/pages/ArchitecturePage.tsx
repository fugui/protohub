/**
 * 架构全景图页面 - 支持编辑模式
 */

import { useState, useEffect, useRef } from 'react';
import { Card, Spin, message, Descriptions, Drawer, List, Tag, Button, Modal, Select, Space } from 'antd';
import { EditOutlined, SaveOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { getDependencyGraph, getSubsystemById, createSubsystemDependency } from '../services/dependencyService';
import { getFiles } from '../services/fileService';
import type { DependencyNode, DependencyEdge, Subsystem, ProtoFile } from 'protohub-shared';

export function ArchitecturePage() {
    const [loading, setLoading] = useState(false);
    const [graphData, setGraphData] = useState<{ nodes: DependencyNode[]; edges: DependencyEdge[] }>({ nodes: [], edges: [] });
    const [selectedSubsystem, setSelectedSubsystem] = useState<Subsystem | null>(null);
    const [subsystemFiles, setSubsystemFiles] = useState<ProtoFile[]>([]);
    const [drawerVisible, setDrawerVisible] = useState(false);

    // 编辑模式相关状态
    const [editMode, setEditMode] = useState(false);
    const [sourceSubsystem, setSourceSubsystem] = useState<string | null>(null);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [targetFiles, setTargetFiles] = useState<ProtoFile[]>([]);
    const [selectedTargetFiles, setSelectedTargetFiles] = useState<number[]>([]);
    const [allFiles, setAllFiles] = useState<ProtoFile[]>([]);

    // 边详情相关状态
    const [selectedEdge, setSelectedEdge] = useState<DependencyEdge | null>(null);
    const [edgeDrawerVisible, setEdgeDrawerVisible] = useState(false);

    const chartRef = useRef<any>(null);

    const fetchGraph = async () => {
        try {
            setLoading(true);
            const result = await getDependencyGraph({ level: 'subsystem' });
            setGraphData({
                nodes: result.nodes,
                edges: result.edges,
            });
        } catch (error) {
            message.error('获取架构图失败');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllFiles = async () => {
        try {
            const result = await getFiles({ page: 1, pageSize: 1000 });
            setAllFiles(result.data);
        } catch (error) {
            message.error('获取文件列表失败');
        }
    };

    useEffect(() => {
        fetchGraph();
        fetchAllFiles();
    }, []);

    const handleNodeClick = async (params: any) => {
        if (params.dataType === 'node' && params.data.type === 'subsystem') {
            const subsystemId = parseInt(params.data.id.replace('sub_', ''));

            // 编辑模式下：选择源/目标子系统
            if (editMode) {
                if (!sourceSubsystem) {
                    // 选择源子系统
                    setSourceSubsystem(params.data.id);
                    message.info(`已选择源子系统: ${params.data.name}`);
                } else if (sourceSubsystem === params.data.id) {
                    // 取消选择
                    setSourceSubsystem(null);
                    message.info('已取消选择');
                } else {
                    // 选择目标子系统，打开文件选择对话框
                    const targetId = subsystemId;
                    const tgtFiles = allFiles.filter(f => f.subsystem === targetId);

                    if (tgtFiles.length === 0) {
                        message.error(`目标子系统没有文件，请先创建proto文件`);
                        setSourceSubsystem(null);
                        return;
                    }

                    setTargetFiles(tgtFiles);
                    setCreateModalVisible(true);
                }
            } else {
                // 查看模式：显示详情
                try {
                    setLoading(true);
                    const subsystem = await getSubsystemById(subsystemId);
                    setSelectedSubsystem(subsystem);

                    const filesResult = await getFiles({ page: 1, pageSize: 100 });
                    const files = filesResult.data.filter((f: any) => f.subsystem === subsystemId);
                    setSubsystemFiles(files);

                    setDrawerVisible(true);
                } catch (error) {
                    message.error('获取子系统详情失败');
                } finally {
                    setLoading(false);
                }
            }
        }
    };

    const handleCreateDependency = async () => {
        if (!sourceSubsystem || selectedTargetFiles.length === 0) {
            message.error('请确保选择了源子系统和至少一个目标文件');
            return;
        }

        const sourceId = parseInt(sourceSubsystem.replace('sub_', ''));

        try {
            setLoading(true);
            const result = await createSubsystemDependency(sourceId, selectedTargetFiles);
            message.success(result.message);

            // 重新加载图表
            await fetchGraph();

            // 重置状态
            setCreateModalVisible(false);
            setSourceSubsystem(null);
            setSelectedTargetFiles([]);
        } catch (error: any) {
            message.error(error.response?.data?.error || '创建依赖失败');
        } finally {
            setLoading(false);
        }
    };

    const getOption = () => {
        const data = graphData.nodes.map(node => ({
            id: node.id,
            name: node.label,
            category: 0,
            symbol: 'rect',
            symbolSize: [120, 60],
            value: node.label,
            type: node.type,
            itemStyle: {
                color: sourceSubsystem === node.id ? '#ff7875' : '#91cc75', // 高亮选中的源节点
                borderColor: sourceSubsystem === node.id ? '#ff4d4f' : undefined,
                borderWidth: sourceSubsystem === node.id ? 3 : 0,
            },
            label: {
                show: true,
                position: 'inside',
                formatter: '{b}',
                fontSize: 14,
                color: '#fff'
            }
        }));

        const links = graphData.edges.map(edge => ({
            source: edge.source,
            target: edge.target,
            value: 1,
            symbol: ['none', 'arrow'],
            lineStyle: {
                curveness: 0.2
            }
        }));

        return {
            title: {
                text: editMode ? '架构图编辑模式' : '系统架构依赖图',
                subtext: editMode ? '点击两个子系统创建依赖' : '点击节点查看详情',
                top: 'top',
                left: 'left'
            },
            tooltip: {
                trigger: 'item',
                formatter: (params: any) => {
                    if (params.dataType === 'edge') {
                        const edge = graphData.edges.find(
                            e => e.source === params.data.source && e.target === params.data.target
                        );
                        const fileCount = edge?.fileDependencies?.length || 0;
                        return `依赖文件: ${fileCount} 个<br/>点击查看详情`;
                    }
                    return params.name;
                },
            },
            series: [
                {
                    type: 'graph',
                    layout: 'force',
                    data: data,
                    links: links,
                    categories: [{ name: 'Subsystem' }],
                    roam: true,
                    label: {
                        show: true,
                        position: 'inside',
                        formatter: '{b}'
                    },
                    force: {
                        repulsion: 2000,
                        edgeLength: 300,
                        layoutAnimation: true
                    },
                    lineStyle: {
                        color: 'source',
                        curveness: 0.2,
                        width: 2
                    },
                    emphasis: {
                        focus: 'adjacency',
                        lineStyle: {
                            width: 5
                        }
                    }
                }
            ]
        };
    };

    const handleEdgeClick = (params: any) => {
        if (editMode) {
            // 编辑模式下不处理边点击
            return;
        }

        const edge = graphData.edges.find(
            e => e.source === params.data.source && e.target === params.data.target
        );

        if (edge && edge.fileDependencies && edge.fileDependencies.length > 0) {
            setSelectedEdge(edge);
            setEdgeDrawerVisible(true);
        }
    };

    const getSubsystemName = (subsystemId: string): string => {
        const node = graphData.nodes.find(n => n.id === subsystemId);
        return node?.label || subsystemId;
    };

    const onEvents = {
        click: (params: any) => {
            if (params.dataType === 'edge') {
                handleEdgeClick(params);
            } else if (params.dataType === 'node') {
                handleNodeClick(params);
            }
        },
    };

    return (
        <div style={{ height: '100%', padding: 24 }}>
            <Card
                title={
                    <Space>
                        <span>架构全景</span>
                        <Button
                            type={editMode ? 'primary' : 'default'}
                            icon={editMode ? <SaveOutlined /> : <EditOutlined />}
                            onClick={() => {
                                setEditMode(!editMode);
                                setSourceSubsystem(null);
                            }}
                        >
                            {editMode ? '退出编辑' : '编辑模式'}
                        </Button>
                    </Space>
                }
                bordered={false}
                style={{ height: '100%' }}
                bodyStyle={{ height: 'calc(100% - 58px)' }}
            >
                {loading && graphData.nodes.length === 0 ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <Spin size="large" />
                    </div>
                ) : (
                    <ReactECharts
                        ref={chartRef}
                        option={getOption()}
                        style={{ height: '100%', width: '100%' }}
                        onEvents={onEvents}
                    />
                )}
            </Card>

            {/* 子系统详情抽屉 */}
            <Drawer
                title={selectedSubsystem?.name || '子系统详情'}
                placement="right"
                width={500}
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
            >
                {selectedSubsystem && (
                    <>
                        <Descriptions column={1} bordered>
                            <Descriptions.Item label="名称">{selectedSubsystem.name}</Descriptions.Item>
                            <Descriptions.Item label="描述">{selectedSubsystem.description || '-'}</Descriptions.Item>
                            <Descriptions.Item label="创建时间">{new Date(selectedSubsystem.createdAt).toLocaleString()}</Descriptions.Item>
                        </Descriptions>

                        <div style={{ marginTop: 24 }}>
                            <h3>接口列表 ({subsystemFiles.length})</h3>
                            <List
                                dataSource={subsystemFiles}
                                renderItem={(file) => (
                                    <List.Item>
                                        <List.Item.Meta
                                            title={file.filename}
                                            description={`Package: ${file.packageName}`}
                                        />
                                        <Tag>{file.status}</Tag>
                                    </List.Item>
                                )}
                            />
                        </div>
                    </>
                )}
            </Drawer>

            {/* 创建依赖关系对话框 */}
            <Modal
                title="创建依赖关系"
                open={createModalVisible}
                onOk={handleCreateDependency}
                onCancel={() => {
                    setCreateModalVisible(false);
                    setSourceSubsystem(null);
                    setSelectedTargetFiles([]);
                }}
                okText="创建"
                cancelText="取消"
            >
                <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                        <label>选择被依赖的服务文件（可多选）：</label>
                        <Select
                            mode="multiple"
                            style={{ width: '100%', marginTop: 8 }}
                            placeholder="请选择目标文件"
                            value={selectedTargetFiles}
                            onChange={setSelectedTargetFiles}
                        >
                            {targetFiles.map(file => (
                                <Select.Option key={file.id} value={file.id}>
                                    {file.filename}
                                </Select.Option>
                            ))}
                        </Select>
                    </div>
                </Space>
            </Modal>

            {/* 依赖关系详情抽屉 */}
            <Drawer
                title="依赖关系详情"
                placement="right"
                width={600}
                onClose={() => setEdgeDrawerVisible(false)}
                open={edgeDrawerVisible}
            >
                {selectedEdge && (
                    <>
                        <Descriptions column={1} bordered>
                            <Descriptions.Item label="源子系统">
                                {getSubsystemName(selectedEdge.source)}
                            </Descriptions.Item>
                            <Descriptions.Item label="目标子系统">
                                {getSubsystemName(selectedEdge.target)}
                            </Descriptions.Item>
                            <Descriptions.Item label="依赖文件数量">
                                {selectedEdge.fileDependencies?.length || 0}
                            </Descriptions.Item>
                        </Descriptions>

                        <div style={{ marginTop: 24 }}>
                            <h3>接口文件依赖列表</h3>
                            <List
                                dataSource={selectedEdge.fileDependencies || []}
                                renderItem={(dep) => (
                                    <List.Item>
                                        <List.Item.Meta
                                            title={
                                                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                                    <div>
                                                        <Tag color="blue">源端</Tag>
                                                        {dep.sourceFile ? (
                                                            <a href={`#/files/${dep.sourceFile.id}`}>
                                                                {dep.sourceFile.filename}
                                                            </a>
                                                        ) : (
                                                            <span>整个子系统</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <Tag color="green">目标文件</Tag>
                                                        <a href={`#/files/${dep.targetFile.id}`}>
                                                            {dep.targetFile.filename}
                                                        </a>
                                                    </div>
                                                </Space>
                                            }
                                            description={
                                                <div style={{ marginTop: 8 }}>
                                                    {dep.sourceFile ? `${dep.sourceFile.packageName} → ` : ''}{dep.targetFile.packageName}
                                                </div>
                                            }
                                        />
                                    </List.Item>
                                )}
                            />
                        </div>
                    </>
                )}
            </Drawer>
        </div>
    );
}
