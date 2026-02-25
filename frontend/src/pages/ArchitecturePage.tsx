/**
 * 架构全景图页面 - 基于 AntV G6 Combo 模式
 * 使用 Combo 作为子系统容器，功能模块作为 Combo 内的节点
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
  AppstoreOutlined,
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
  const [selectedCombo, setSelectedCombo] = useState<ArchitectureCombo | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [edgeDrawerVisible, setEdgeDrawerVisible] = useState(false);
  const [comboDrawerVisible, setComboDrawerVisible] = useState(false);

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

  // 使用 ref 存储拖拽时的位置和节点ID，用于移出子系统时保持位置
  const dragPositionRef = useRef<{ nodeId: string; x: number; y: number } | null>(null);

  // 使用 ref 存储待保存的位置，用于防抖批量保存
  const pendingPositionsRef = useRef<any[]>([]);
  const savePositionsTimeoutRef = useRef<number | null>(null);

  // 获取架构图数据（不控制 loading，由调用方控制）
  const fetchArchitectureData = useCallback(async () => {
    try {
      const response = await api.get('/architecture/graph');
      const data: ArchitectureGraph = response.data;

      setLayers(data.layers);
      setCombos(data.combos || []);
      return data;
    } catch (error) {
      message.error('获取架构图失败');
      console.error(error);
      return null;
    }
  }, []);

  // 防抖保存位置 - 将多个保存请求合并为一个
  const debouncedSavePositions = useCallback((positions: any[]) => {
    // 合并到待保存列表
    pendingPositionsRef.current = [...pendingPositionsRef.current, ...positions];

    // 清除之前的定时器
    if (savePositionsTimeoutRef.current) {
      window.clearTimeout(savePositionsTimeoutRef.current);
    }

    // 设置新的定时器，500ms 后统一保存
    savePositionsTimeoutRef.current = window.setTimeout(async () => {
      const positionsToSave = pendingPositionsRef.current;
      pendingPositionsRef.current = []; // 清空待保存列表

      if (positionsToSave.length > 0) {
        try {
          await api.post('/architecture/node-positions', { positions: positionsToSave });
        } catch (error: any) {
          if (error.response?.status === 429) {
            console.warn('保存位置被限流，已忽略');
          } else {
            console.error('保存位置失败:', error);
          }
        }
      }
    }, 500);
  }, []);

  // 初始化 G6 图
  useEffect(() => {
    if (!containerRef.current || graphRef.current) return;

    const graph = new Graph({
      container: containerRef.current,
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight || 800,

      // 节点配置 - 功能模块
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

      // Combo 配置 - 子系统容器
      combo: {
        type: 'rect',
        style: {
          radius: 12,
          lineWidth: 2,
          lineDash: [6, 4],
          // 标签显示在子系统内部左上角
          labelText: (d: any) => d.data?.label || d.id,
          labelFontSize: 13,
          labelFontWeight: 'bold',
          labelFill: '#ad6800',
          labelBackground: true,
          labelBackgroundFill: 'rgba(255, 247, 230, 0.85)',
          labelBackgroundRadius: 4,
          labelPadding: [2, 6],
          labelPlacement: 'top-left',
          labelOffsetX: 8,
          labelOffsetY: 12,
          labelTextAlign: 'left',
          fillOpacity: 0.08,
        },
        state: {
          collapsed: {},
          dragenter: {
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

      // 布局配置 - 禁用自动布局
      layout: false as any,

      // 交互
      behaviors: [
        'drag-canvas',
        'zoom-canvas',
        'collapse-expand-combo',
        {
          type: 'drag-element',
          enable: () => editModeRef.current,
          shadow: true,
          shadowColor: '#1890ff',
          shadowBlur: 10,
        },
        {
          type: 'drag-combo',
          enable: () => editModeRef.current,
        },
        {
          type: 'drag-element',
          enable: () => editModeRef.current,
          enableDelegate: true,
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

    // Combo 点击 - 折叠/展开（编辑模式）或显示详情（预览模式）
    graph.on('combo:click', (evt: any) => {
      const comboId = evt.target?.id || evt.elementId;
      if (!comboId) return;

      const comboData = graph.getComboData(comboId);
      if (!comboData) return;

      const model = comboData.data || comboData;

      if (editMode) {
        // 编辑模式：折叠/展开
        const isCollapsed = comboData.data?.collapsed || false;
        graph.updateComboData?.([{
          id: comboId,
          data: { ...comboData.data, collapsed: !isCollapsed },
        }]);
        graph.draw();
      } else {
        // 预览模式：显示详情
        setSelectedCombo(model as unknown as ArchitectureCombo);
        setComboDrawerVisible(true);
      }
    });

    const handleDragEnd = async (evt: any) => {
      const elementId = evt.target?.id || evt.elementId;
      if (!elementId || !editModeRef.current) return;

      if (!elementId.startsWith('func_mod_') && !elementId.startsWith('sub_')) return;

      const nodeData = graph.getNodeData(elementId) || graph.getComboData(elementId);
      if (!nodeData) return;

      const model = nodeData.data || nodeData;
      const viewportPoint = evt.viewport;
      const canvasPoint = evt.canvas;
      const x = viewportPoint?.x ?? canvasPoint?.x ?? (nodeData as any).x ?? 0;
      const y = viewportPoint?.y ?? canvasPoint?.y ?? (nodeData as any).y ?? 0;

      // 检查是否是被拖拽的功能模块
      if (elementId.startsWith('func_mod_')) {
        const pointX = canvasPoint?.x || x;
        const pointY = canvasPoint?.y || y;
        let targetComboId: string | null = null;

        // 遍历所有的 Combo 判断功能模块是否落入目标范围内
        const allCombos = graph.getComboData();
        for (const combo of allCombos) {
          const comboModel = combo.data || combo;
          const cx = (combo.style as any)?.x ?? (comboModel as any)?.x ?? 0;
          const cy = (combo.style as any)?.y ?? (comboModel as any)?.y ?? 0;

          // 预估大小检测 (如果不清楚的话可以假设 combo 为 300x200 的大小)
          const halfW = 150;
          const halfH = 100;

          if (
            pointX >= cx - halfW && pointX <= cx + halfW &&
            pointY >= cy - halfH && pointY <= cy + halfH
          ) {
            targetComboId = combo.id;
            break;
          }
        }

        const currentComboId = (nodeData as any).combo || model?.combo;

        // 修复：将 undefined 统一为 null，避免 false positive
        const normalizedCurrentComboId = currentComboId ?? null;
        const normalizedTargetComboId = targetComboId ?? null;

        if (normalizedTargetComboId !== normalizedCurrentComboId) {
          try {
            const fmId = elementId.replace('func_mod_', '');
            const groupId = targetComboId ? parseInt(targetComboId.replace('sub_', '')) : null;

            // 记录拖拽位置和节点ID，用于移出子系统时保持位置
            if (!groupId) {
              const canvasPoint = evt.canvas;
              const viewportPoint = evt.viewport;
              dragPositionRef.current = {
                nodeId: elementId,
                x: canvasPoint?.x ?? viewportPoint?.x ?? 0,
                y: canvasPoint?.y ?? viewportPoint?.y ?? 0,
              };
            } else {
              dragPositionRef.current = null;
            }

            await api.put(`/architecture/function-modules/${fmId}/subsystem`, { subsystemId: groupId });

            // 如果是移出子系统，同时保存位置到后端（使用防抖避免 429）
            if (!groupId && dragPositionRef.current) {
              debouncedSavePositions([{
                nodeId: elementId,
                nodeType: 'function_module',
                x: dragPositionRef.current.x,
                y: dragPositionRef.current.y,
                layerLevel: model?.layerLevel,
                parentGroupId: null,
              }]);
            }

            message.success(groupId ? '已移入新子系统' : '已移出子系统');

            // 刷新图数据并退出，不需要保存拖拽坐标
            const data = await fetchArchitectureData();
            if (data) renderGraph(data);
            dragPositionRef.current = null; // 清空位置缓存
            return;
          } catch (e) {
            message.error('切换子系统失败');
            dragPositionRef.current = null;
          }
        }

        // 网格自动吸附与排序逻辑（同组内排序）
        const comboId = targetComboId || currentComboId;
        if (comboId) {
          const comboObj = graph.getComboData(comboId);
          if (comboObj) {
            const allNodesInGraph = graph.getNodeData();
            const nodesInCombo = allNodesInGraph.filter((n: any) => (n.combo || n.data?.combo) === comboId);

            const draggedNodeIndex = nodesInCombo.findIndex((n: any) => n.id === elementId);
            if (draggedNodeIndex > -1) {
              (nodesInCombo[draggedNodeIndex] as any).style.x = x;
              (nodesInCombo[draggedNodeIndex] as any).style.y = y;
            }

            const cx = (comboObj.style as any)?.x ?? (comboObj.data as any)?.x ?? 0;
            const cy = (comboObj.style as any)?.y ?? (comboObj.data as any)?.y ?? 0;
            const columns = (comboObj as any).data?.columns || 3;
            const nodeWidth = 160;
            const nodeHeight = 70;
            const paddingX = 20;
            const paddingY = 20;
            const comboPaddingTop = 40;

            nodesInCombo.sort((a: any, b: any) => {
              const aY = a.y ?? a.style?.y ?? 0;
              const bY = b.y ?? b.style?.y ?? 0;
              const aX = a.x ?? a.style?.x ?? 0;
              const bX = b.x ?? b.style?.x ?? 0;
              if (Math.abs(aY - bY) > nodeHeight / 2 + paddingY / 2) {
                return aY - bY;
              }
              return aX - bX;
            });

            const actualCols = Math.min(nodesInCombo.length, columns);
            const totalWidth = actualCols * nodeWidth + (actualCols - 1) * paddingX;
            const startX = cx - totalWidth / 2 + nodeWidth / 2;

            const positionsToSave: any[] = [];
            const nodesToUpdate: any[] = [];

            nodesInCombo.forEach((n: any, index: number) => {
              const row = Math.floor(index / columns);
              const col = index % columns;
              const gridX = startX + col * (nodeWidth + paddingX);
              const gridY = cy + comboPaddingTop + row * (nodeHeight + paddingY);

              nodesToUpdate.push({
                id: n.id,
                style: { x: gridX, y: gridY }
              });

              positionsToSave.push({
                nodeId: n.id,
                nodeType: 'function_module',
                x: gridX,
                y: gridY,
                layerLevel: n.data?.layerLevel || n.layerLevel || 3,
                parentGroupId: parseInt(comboId.replace('sub_', ''))
              });
            });

            // 实时更新视口上的节点位置
            if (graph.updateNodeData) {
              graph.updateNodeData(nodesToUpdate);
              graph.draw(); // 更新画布视图
            }

            if (positionsToSave.length > 0) {
              debouncedSavePositions(positionsToSave);
            }
            return;
          }
        }
      }

      // 使用防抖保存位置
      const comboId = (nodeData as any).combo;
      const parentGroupId = comboId ? parseInt(comboId.replace('sub_', '')) : null;

      debouncedSavePositions([{
        nodeId: elementId,
        nodeType: elementId.startsWith('func_mod_') ? 'function_module' : 'subsystem',
        x: x,
        y: y,
        layerLevel: model?.layerLevel,
        parentGroupId: parentGroupId,
      }]);
    };

    graph.on('node:dragend', handleDragEnd);
    graph.on('combo:dragend', handleDragEnd);

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

    // 加载数据并渲染
    setLoading(true);
    fetchArchitectureData().then(data => {
      if (data && graphRef.current) {
        renderGraph(data);
      }
    }).finally(() => {
      // 使用 requestAnimationFrame 确保渲染完成后再隐藏 loading
      requestAnimationFrame(() => {
        setLoading(false);
      });
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
      // 清除保存位置的定时器
      if (savePositionsTimeoutRef.current) {
        window.clearTimeout(savePositionsTimeoutRef.current);
      }
      if (graphRef.current) {
        graphRef.current.destroy();
        graphRef.current = null;
      }
    };
  }, [fetchArchitectureData, debouncedSavePositions]);

  // 渲染图数据
  const renderGraph = (data: ArchitectureGraph) => {
    if (!graphRef.current) return;

    // ----- 新增: 网格布局聚合与计算 -----
    const nodeWidth = 160;
    const nodeHeight = 70;
    const paddingX = 20;
    const paddingY = 20;
    const comboPaddingTop = 40;

    const comboNodesMap = new Map<string, ArchitectureNode[]>();
    data.nodes.forEach(n => {
      if (n.combo) {
        if (!comboNodesMap.has(n.combo)) comboNodesMap.set(n.combo, []);
        comboNodesMap.get(n.combo)!.push(n);
      }
    });

    const positionsToSave: any[] = [];

    comboNodesMap.forEach((nodes, comboId) => {
      const comboObj = data.combos?.find(c => c.id === comboId);
      const cx = (comboObj as any)?.x ?? 0;
      const cy = (comboObj as any)?.y ?? 0;

      // 按目前的 x, y 坐标排序（y优先，x其次）
      nodes.sort((a, b) => {
        const aY = (a as any).y ?? 0;
        const bY = (b as any).y ?? 0;
        const aX = (a as any).x ?? 0;
        const bX = (b as any).x ?? 0;
        if (Math.abs(aY - bY) > nodeHeight / 2 + paddingY / 2) {
          return aY - bY;
        }
        return aX - bX;
      });

      const columns = (comboObj as any)?.data?.columns || 3;
      const actualCols = Math.min(nodes.length, columns);
      const totalWidth = actualCols * nodeWidth + (actualCols - 1) * paddingX;
      const startX = cx - totalWidth / 2 + nodeWidth / 2;

      nodes.forEach((n, index) => {
        const row = Math.floor(index / columns);
        const col = index % columns;

        const gridX = startX + col * (nodeWidth + paddingX);
        const gridY = cy + comboPaddingTop + row * (nodeHeight + paddingY);

        if (Math.abs((n.x ?? 0) - gridX) > 0.5 || Math.abs((n.y ?? 0) - gridY) > 0.5) {
          positionsToSave.push({
            nodeId: n.id,
            nodeType: 'function_module',
            x: gridX,
            y: gridY,
            layerLevel: n.layerLevel,
            parentGroupId: parseInt(comboId.replace('sub_', ''))
          });
        }
        n.x = gridX;
        n.y = gridY;
      });
    });

    if (positionsToSave.length > 0 && editModeRef.current) {
      api.post('/architecture/node-positions', { positions: positionsToSave }).catch((e: any) => {
        if (e.response?.status === 429) {
          console.warn('保存位置被限流，已忽略');
        } else {
          console.error(e);
        }
      });
    }
    // ----------------------------

    // 转换功能模块节点 - 包含位置信息
    const g6Nodes = data.nodes.map((node: ArchitectureNode) => {
      // 判断是否是刚刚移出子系统的节点（有拖拽位置缓存且匹配当前节点ID）
      const isRecentlyRemovedFromCombo = dragPositionRef.current?.nodeId === node.id;

      // 对于没有 combo 的节点（未归属子系统），使用随机位置避免堆叠在原子系统位置
      // 但如果刚刚拖拽移出，则使用拖拽位置
      // 因为 node.x/y 可能是之前作为子系统成员时的相对坐标
      const hasValidPosition = node.x !== undefined && node.y !== undefined && node.combo;

      let nodeX: number;
      let nodeY: number;

      if (isRecentlyRemovedFromCombo) {
        // 使用拖拽时的位置
        nodeX = dragPositionRef.current!.x;
        nodeY = dragPositionRef.current!.y;
      } else if (hasValidPosition) {
        // 使用保存的位置
        nodeX = node.x!;
        nodeY = node.y!;
      } else {
        // 使用随机位置
        nodeX = 200 + Math.random() * 400;
        nodeY = 200 + Math.random() * 300;
      }

      const nodeData: any = {
        id: node.id,
        data: node,
        // G6 v5: 在 style 中设置位置
        style: {
          x: nodeX,
          y: nodeY,
          fill: node.style?.color || '#e6f7ff',
          stroke: node.style?.borderColor || '#1890ff',
        },
      };
      // 只有当 combo 有值时才设置，确保 null/undefined 不被设置
      if (node.combo) {
        nodeData.combo = node.combo;
      }
      return nodeData;
    });

    // 转换子系统为 Combo - 让 G6 根据内部功能模块自动计算位置和大小
    const g6Combos = (data.combos || []).map((combo: ArchitectureCombo) => ({
      id: combo.id,
      data: {
        ...combo,
        // 确保 label 字段在 data 中可访问到
        label: combo.label,
      },
      // 不设置位置和大小，让 G6 根据内部功能模块自动计算
      style: {
        ...(combo.style || {}),
      },
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

    // 检查是否已有数据，避免不必要的 clear
    const existingData = graphRef.current.getData();
    const hasExistingData = existingData && (existingData.nodes?.length > 0 || existingData.combos?.length > 0);

    if (hasExistingData) {
      // 增量更新：只更新变化的数据，避免闪烁
      const existingNodeIds = new Set(existingData.nodes?.map((n: any) => n.id) || []);
      const existingComboIds = new Set(existingData.combos?.map((c: any) => c.id) || []);
      const existingEdgeIds = new Set(existingData.edges?.map((e: any) => e.id) || []);

      const newNodeIds = new Set(g6Nodes.map(n => n.id));
      const newEdgeIds = new Set(g6Edges.map(e => e.id));

      // 找出新增和删除的节点/边/combo
      const nodesToAdd = g6Nodes.filter(n => !existingNodeIds.has(n.id));
      const nodesToUpdate = g6Nodes.filter(n => existingNodeIds.has(n.id));
      const nodesToRemove = (existingData.nodes || []).filter((n: any) => !newNodeIds.has(n.id));

      const combosToAdd = g6Combos.filter(c => !existingComboIds.has(c.id));
      const combosToUpdate = g6Combos.filter(c => existingComboIds.has(c.id));

      const edgesToAdd = g6Edges.filter(e => !existingEdgeIds.has(e.id));
      const edgesToRemove = (existingData.edges || []).filter((e: any) => !newEdgeIds.has(e.id));

      // 执行增量更新
      if (nodesToRemove.length > 0) {
        graphRef.current.removeNodeData(nodesToRemove.map((n: any) => n.id));
      }
      if (edgesToRemove.length > 0) {
        graphRef.current.removeEdgeData(edgesToRemove.map((e: any) => e.id));
      }
      if (nodesToAdd.length > 0) {
        graphRef.current.addNodeData(nodesToAdd);
      }
      if (edgesToAdd.length > 0) {
        graphRef.current.addEdgeData(edgesToAdd);
      }
      if (combosToAdd.length > 0) {
        graphRef.current.addComboData(combosToAdd);
      }

      // 更新现有节点和 combo 的数据和位置
      if (nodesToUpdate.length > 0) {
        graphRef.current.updateNodeData(nodesToUpdate);
      }
      if (combosToUpdate.length > 0) {
        graphRef.current.updateComboData(combosToUpdate);
      }

      graphRef.current.draw();
    } else {
      // 首次渲染：使用 setData
      graphRef.current.setData({
        nodes: g6Nodes,
        edges: g6Edges,
        combos: g6Combos,
      });
      graphRef.current.render();
    }

    // G6 v5: 在渲染后更新 Combo 位置（仅在首次渲染或 combo 位置变化时）
    requestAnimationFrame(() => {
      if (!graphRef.current) return;

      (data.combos || []).forEach((combo: ArchitectureCombo, index: number) => {
        const x = (combo as any).x ?? 150 + (index % 2) * 400;
        const y = (combo as any).y ?? 150 + Math.floor(index / 2) * 250;

        try {
          graphRef.current?.updateComboData([{
            id: combo.id,
            style: { x, y },
          }]);
        } catch (e) {
          console.warn('更新 Combo 位置失败:', combo.id, e);
        }
      });

      graphRef.current.draw();
    });
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

  // 创建子系统
  const handleCreateGroup = async (values: any) => {
    try {
      await api.post('/architecture/groups', {
        name: values.name,
        layerId: values.layerId,
        color: values.color,
        columns: values.columns || 3,
      });
      message.success('子系统创建成功');
      setCreateGroupModalVisible(false);
      groupForm.resetFields();
      const data = await fetchArchitectureData();
      if (data) renderGraph(data);
    } catch (error) {
      message.error('创建子系统失败');
    }
  };



  // 获取层级颜色
  const getLayerColor = (level: number) => {
    const layer = layers.find(l => l.level === level);
    return layer?.color || '#91cc75';
  };

  // 获取功能模块所属子系统名称
  const getComboName = (comboId?: string) => {
    if (!comboId) return null;
    const combo = combos.find(c => c.id === comboId);
    return combo?.label || combo?.data?.label;
  };

  // 获取子系统包含的功能模块列表
  const getComboFunctionModules = (comboId?: string): ArchitectureNode[] => {
    if (!comboId) return [];
    // 从图中获取所有节点，筛选出属于该 combo 的节点
    const graph = graphRef.current;
    if (!graph) return [];

    const allNodes = graph.getNodeData();
    return allNodes
      .filter((node: any) => node.combo === comboId || node.data?.combo === comboId)
      .map((node: any) => node.data || node)
      .filter(Boolean);
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
              创建子系统
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
              提示：点击打开侧边栏可修改功能模块所属子系统；拖拽功能模块块可调整画布位置。
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
            <p><strong>类型：</strong> {selectedNode.type === 'function_module' ? '功能模块' : '子系统'}</p>
            <div style={{ marginBottom: 16 }}>
              <strong>所属层级：</strong>
              {editMode && selectedNode.type === 'function_module' ? (
                <Select
                  value={selectedNode.layerLevel}
                  style={{ width: 150, marginLeft: 8 }}
                  onChange={async (val) => {
                    try {
                      const fmId = selectedNode.id.replace('func_mod_', '');
                      await api.put(`/architecture/function-modules/${fmId}/layer`, { layerLevel: val });
                      message.success('层级修改成功');
                      setDrawerVisible(false);
                      const data = await fetchArchitectureData();
                      if (data) renderGraph(data);
                    } catch (e) {
                      message.error('修改层级失败');
                    }
                  }}
                >
                  {layers.map(l => <Option key={l.id} value={l.level}>{l.name}</Option>)}
                </Select>
              ) : (
                <Tag color={getLayerColor(selectedNode.layerLevel)} style={{ marginLeft: 8 }}>
                  第 {selectedNode.layerLevel} 层
                </Tag>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <strong>所属子系统：</strong>
              {editMode && selectedNode.type === 'function_module' ? (
                <Select
                  value={selectedNode.combo || ''}
                  style={{ width: 200, marginLeft: 8 }}
                  allowClear
                  placeholder="未归属子系统"
                  onChange={async (val) => {
                    try {
                      const fmId = selectedNode.id.replace('func_mod_', '');
                      const subsystemId = val ? parseInt(val.replace('func_mod_', '')) : null;
                      await api.put(`/architecture/function-modules/${fmId}/subsystem`, { subsystemId });
                      message.success('所属子系统修改成功');
                      setDrawerVisible(false);
                      const data = await fetchArchitectureData();
                      if (data) renderGraph(data);
                    } catch (e) {
                      console.error(e);
                      message.error('修改所属子系统失败');
                    }
                  }}
                >
                  {combos.map(c => <Option key={c.id} value={c.id}>{c.label || c.data?.label}</Option>)}
                </Select>
              ) : (
                selectedNode.combo ? (
                  <Tag icon={<FolderOutlined />} color="orange" style={{ marginLeft: 8 }}>
                    {getComboName(selectedNode.combo)}
                  </Tag>
                ) : <span style={{ marginLeft: 8, color: '#999' }}>未归属子系统</span>
              )}
            </div>

            {selectedNode.functionModuleInfo && (
              <>
                <p><strong>接口文件数：</strong> {selectedNode.functionModuleInfo.fileCount}</p>
                <p><strong>被依赖数：</strong> {selectedNode.functionModuleInfo.dependenciesIn}</p>
                <p><strong>依赖其他数：</strong> {selectedNode.functionModuleInfo.dependenciesOut}</p>
              </>
            )}

            <Button
              type="primary"
              block
              style={{ marginTop: 24 }}
              onClick={() => {
                if (selectedNode.type === 'function_module') {
                  navigate(`/function-modules/${selectedNode.id.replace('func_mod_', '')}`);
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

      {/* 子系统详情抽屉 */}
      <Drawer
        title={
          <Space>
            <AppstoreOutlined />
            <span>{selectedCombo?.label || selectedCombo?.data?.label || '子系统详情'}</span>
          </Space>
        }
        placement="right"
        width={450}
        onClose={() => setComboDrawerVisible(false)}
        open={comboDrawerVisible}
      >
        {selectedCombo && (
          <div>
            <p>
              <strong>类型：</strong>
              <Tag color="orange">子系统</Tag>
            </p>
            {selectedCombo.layerLevel && (
              <p>
                <strong>所属层级：</strong>
                <Tag color={getLayerColor(selectedCombo.layerLevel)}>第 {selectedCombo.layerLevel} 层</Tag>
              </p>
            )}

            <div style={{ marginBottom: 16 }}>
              <strong>网格列数：</strong>
              {editMode ? (
                <Select
                  value={selectedCombo.data?.columns || 3}
                  style={{ width: 120, marginLeft: 8 }}
                  onChange={async (val) => {
                    try {
                      const groupId = selectedCombo.id.replace('sub_', '');
                      await api.put(`/architecture/groups/${groupId}`, { columns: val });
                      message.success('列数设置成功');

                      // 更新本地状态，以便再次编辑时同步
                      setSelectedCombo(prev => prev ? {
                        ...prev,
                        data: { ...(prev.data as any), columns: val }
                      } : null);

                      // 刷新并重排
                      const data = await fetchArchitectureData();
                      if (data) renderGraph(data);
                    } catch (e) {
                      message.error('设置失败');
                    }
                  }}
                >
                  <Option value={1}>1 列</Option>
                  <Option value={2}>2 列</Option>
                  <Option value={3}>3 列</Option>
                  <Option value={4}>4 列</Option>
                  <Option value={5}>5 列</Option>
                </Select>
              ) : (
                <span style={{ marginLeft: 8 }}>{selectedCombo.data?.columns || 3} 列</span>
              )}
            </div>

            <h4 style={{ marginTop: 24, marginBottom: 16 }}>
              <FolderOutlined /> 包含的功能模块 ({getComboFunctionModules(selectedCombo.id).length})
            </h4>
            <List
              bordered
              dataSource={getComboFunctionModules(selectedCombo.id)}
              renderItem={(functionModule: ArchitectureNode) => (
                <List.Item
                  actions={[
                    <Button
                      type="link"
                      size="small"
                      onClick={() => {
                        setComboDrawerVisible(false);
                        navigate(`/function-modules/${functionModule.id.replace('func_mod_', '')}`);
                      }}
                    >
                      查看
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    title={functionModule.name}
                    description={
                      <Space direction="vertical" size={0}>
                        <span>{functionModule.functionModuleInfo?.fileCount || 0} 个接口文件</span>
                        <span>
                          依赖: {functionModule.functionModuleInfo?.dependenciesOut || 0} 入 / {functionModule.functionModuleInfo?.dependenciesIn || 0} 出
                        </span>
                      </Space>
                    }
                  />
                </List.Item>
              )}
              locale={{ emptyText: '该子系统暂无功能模块' }}
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

      {/* 创建子系统模态框 */}
      <Modal
        title="创建子系统"
        open={createGroupModalVisible}
        onOk={() => groupForm.submit()}
        onCancel={() => {
          setCreateGroupModalVisible(false);
          groupForm.resetFields();
        }}
      >
        <Form form={groupForm} layout="vertical" onFinish={handleCreateGroup}>
          <Form.Item
            label="子系统名称"
            name="name"
            rules={[{ required: true, message: '请输入子系统名称' }]}
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

          <Form.Item
            label="网格列数"
            name="columns"
            initialValue={3}
            tooltip="同子系统下功能模块的排列列数"
          >
            <Select>
              <Option value={1}>1 列</Option>
              <Option value={2}>2 列</Option>
              <Option value={3}>3 列</Option>
              <Option value={4}>4 列</Option>
              <Option value={5}>5 列</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
