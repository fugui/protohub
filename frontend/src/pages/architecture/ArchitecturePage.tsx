/**
 * 架构全景图页面（重写版）
 *
 * 架构：
 *   子系统 (Subsystem) → 包含 1..n 个功能模块 (FM)
 *   FM 提供/消费 Protobuf Service（通过 proto 文件管理）
 *   依赖关系在 FM 之间形成有向边
 *
 * 本文件只负责组合子组件，所有数据操作通过 useArchitectureGraph Hook 统一管理。
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Card, message } from 'antd';
import { useArchitectureGraph } from './hooks/useArchitectureGraph';
import { ArchitectureCanvas } from './components/ArchitectureCanvas';
import { ArchitectureToolbar } from './components/ArchitectureToolbar';
import { LayerLegend } from './components/LayerLegend';
import { NodeDetailDrawer } from './components/NodeDetailDrawer';
import { SubsystemDetailDrawer } from './components/SubsystemDetailDrawer';
import { EdgeDetailDrawer } from './components/EdgeDetailDrawer';
import { CreateSubsystemModal } from './components/CreateSubsystemModal';
import type {
  ArchitectureNode,
  ArchitectureCombo,
  ArchitectureEdge,
} from '../../services/architectureService';
import type { ArchitectureCanvasRef } from './components/ArchitectureCanvas';

export function ArchitecturePage() {
  const {
    graphData,
    layers,
    combos,
    loading,
    editMode,
    setEditMode,
    load,
    fetchGraphData,
    savePositions,
    getLocalPosition,
    updateFMSubsystem,
    updateFMLayer,
    createSubsystem,
    updateSubsystemInfo,
    destroy,
  } = useArchitectureGraph();

  const canvasRef = useRef<ArchitectureCanvasRef>(null);

  // 侧边栏/弹窗 state
  const [selectedNode, setSelectedNode] = useState<ArchitectureNode | null>(null);
  const [selectedCombo, setSelectedCombo] = useState<ArchitectureCombo | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<ArchitectureEdge | null>(null);
  const [nodeDrawerOpen, setNodeDrawerOpen] = useState(false);
  const [comboDrawerOpen, setComboDrawerOpen] = useState(false);
  const [edgeDrawerOpen, setEdgeDrawerOpen] = useState(false);
  const [createSubsystemOpen, setCreateSubsystemOpen] = useState(false);

  // 初始加载
  useEffect(() => {
    load();
    return () => destroy();
  }, [load, destroy]);

  // ── 节点点击 ──
  const handleNodeClick = useCallback((node: ArchitectureNode) => {
    setSelectedNode(node);
    setNodeDrawerOpen(true);
  }, []);

  // ── Combo/子系统点击 ──
  const handleComboClick = useCallback((combo: ArchitectureCombo) => {
    setSelectedCombo(combo);
    setComboDrawerOpen(true);
  }, []);

  // ── 边点击 ──
  const handleEdgeClick = useCallback((edge: ArchitectureEdge) => {
    setSelectedEdge(edge);
    setEdgeDrawerOpen(true);
  }, []);

  // ── FM 换子系统（拖拽）──
  const handleFMSubsystemChange = useCallback(
    async (fmNodeId: string, targetComboId: string | null) => {
      const fmId = parseInt(fmNodeId.replace('func_mod_', ''));
      const subsystemId = targetComboId
        ? parseInt(targetComboId.replace('sub_', ''))
        : null;

      const ok = await updateFMSubsystem(fmId, subsystemId);
      if (ok) {
        message.success(subsystemId ? '已移入新子系统' : '已移出子系统');
        // 刷新图数据
        await fetchGraphData();
      }
    },
    [updateFMSubsystem, fetchGraphData]
  );

  // ── 节点位置变化 ──
  const handlePositionChange = useCallback(
    (positions: Parameters<typeof savePositions>[0]) => {
      savePositions(positions);
    },
    [savePositions]
  );

  // ── NodeDrawer：修改 FM 所属层级 ──
  const handleLayerChange = useCallback(
    async (fmId: string, layerLevel: number) => {
      const ok = await updateFMLayer(fmId, layerLevel);
      if (ok) {
        setNodeDrawerOpen(false);
        await fetchGraphData();
      }
    },
    [updateFMLayer, fetchGraphData]
  );

  // ── NodeDrawer：修改 FM 所属子系统（下拉选择）──
  const handleSubsystemChange = useCallback(
    async (fmId: string, subsystemId: number | null) => {
      const ok = await updateFMSubsystem(fmId, subsystemId);
      if (ok) {
        message.success('所属子系统已更新');
        setNodeDrawerOpen(false);
        await fetchGraphData();
      }
    },
    [updateFMSubsystem, fetchGraphData]
  );

  // ── SubsystemDrawer：修改 FM 列数 ──
  const handleColumnsChange = useCallback(
    async (groupId: number, columns: number) => {
      const ok = await updateSubsystemInfo(groupId, { columns });
      if (ok) {
        message.success('列数已更新');
        await fetchGraphData();
      }
    },
    [updateSubsystemInfo, fetchGraphData]
  );

  // ── 创建子系统 ──
  const handleCreateSubsystem = useCallback(
    async (values: { name: string; layerId?: number; color?: string; columns?: number }) => {
      const ok = await createSubsystem(values);
      if (ok) {
        setCreateSubsystemOpen(false);
        await fetchGraphData();
      }
    },
    [createSubsystem, fetchGraphData]
  );

  // ── 重新布局 ──
  const handleReLayout = useCallback(() => {
    canvasRef.current?.reLayout();
    message.success('已重新布局');
  }, []);

  // ── 切换编辑模式 ──
  const handleToggleEditMode = useCallback(() => {
    const nextMode = !editMode;
    setEditMode(nextMode);
    if (nextMode) {
      message.info('进入编辑模式：拖拽 FM 可换子系统；点击元素查看/修改属性');
    } else {
      message.info('已退出编辑模式');
    }
  }, [editMode, setEditMode]);

  // 获取某个 Combo 内所有的 FM 节点（供 SubsystemDetailDrawer 使用）
  const getMembersOfCombo = (comboId: string): ArchitectureNode[] => {
    if (!graphData) return [];
    return graphData.nodes.filter((n) => n.combo === comboId);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Card
        styles={{
          header: { padding: '0 16px' },
          body: { padding: 0, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
        }}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        title={
          <ArchitectureToolbar
            editMode={editMode}
            onToggleEditMode={handleToggleEditMode}
            onCreateSubsystem={() => setCreateSubsystemOpen(true)}
            onReLayout={handleReLayout}
          />
        }
      >
        {/* 层级图例 */}
        <LayerLegend layers={layers} editMode={editMode} />

        {/* G6 画布 */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <ArchitectureCanvas
            ref={canvasRef}
            data={graphData}
            loading={loading}
            editMode={editMode}
            getLocalPosition={getLocalPosition}
            onNodeClick={handleNodeClick}
            onComboClick={handleComboClick}
            onEdgeClick={handleEdgeClick}
            onFMSubsystemChange={handleFMSubsystemChange}
            onPositionChange={handlePositionChange}
          />
        </div>
      </Card>

      {/* FM 详情侧边栏 */}
      <NodeDetailDrawer
        node={selectedNode}
        open={nodeDrawerOpen}
        editMode={editMode}
        layers={layers}
        combos={combos}
        onClose={() => setNodeDrawerOpen(false)}
        onLayerChange={handleLayerChange}
        onSubsystemChange={handleSubsystemChange}
      />

      {/* 子系统详情侧边栏 */}
      <SubsystemDetailDrawer
        combo={selectedCombo}
        open={comboDrawerOpen}
        editMode={editMode}
        layers={layers}
        members={selectedCombo ? getMembersOfCombo(selectedCombo.id) : []}
        onClose={() => setComboDrawerOpen(false)}
        onColumnsChange={handleColumnsChange}
      />

      {/* 依赖边详情侧边栏 */}
      <EdgeDetailDrawer
        edge={selectedEdge}
        open={edgeDrawerOpen}
        onClose={() => setEdgeDrawerOpen(false)}
      />

      {/* 创建子系统弹窗 */}
      <CreateSubsystemModal
        open={createSubsystemOpen}
        layers={layers}
        onOk={handleCreateSubsystem}
        onCancel={() => setCreateSubsystemOpen(false)}
      />
    </div>
  );
}
