/**
 * 架构图 G6 画布组件 v8 — 最终稳定版
 *
 * 关键洞察（经过多次迭代得出）：
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ G6 的 drag-element 行为在启动拖拽时会调用 setPointerCapture 来    │
 * │ 捕获所有后续指针事件。一旦 captured，document 级别的 pointermove  │
 * │ 和 pointerup 事件就不会正常触发——这是之前所有自定义拖拽方案失败  │
 * │ 的根本原因。                                                      │
 * │                                                                   │
 * │ 解决方案：通过 drag-element behavior 的 enable 回调为 FM 节点返回 │
 * │ false，G6 就 永远不会对 FM 节点调用 setPointerCapture，           │
 * │ 因此 document 级别的 pointermove/pointerup 能正常工作。           │
 * │                                                                   │
 * │ 同时，通过 fmDragActiveRef 在 FM 拖拽进行时也阻断 Combo 的自动    │
 * │ drag-element，防止点击 FM 时意外拖动父 Combo。                    │
 * └─────────────────────────────────────────────────────────────────┘
 */

import {
  useEffect, useRef, useCallback, forwardRef, useImperativeHandle,
} from 'react';
import { Spin } from 'antd';
import { Graph } from '@antv/g6';
import type {
  ArchitectureGraph, ArchitectureNode, ArchitectureCombo, ArchitectureEdge,
} from '../../../services/architectureService';
import type { PositionUpdate } from '../hooks/useArchitectureGraph';

// ─── 布局常量 ────────────────────────────────────────────────────
const NODE_W = 180;
const NODE_H = 70;
const GAP_X = 24;
const GAP_Y = 20;
const COMBO_PADDING_TOP = 52;
const COMBO_PADDING_X = 20;
const COMBO_PADDING_BOTTOM = 20;
const DEFAULT_COLUMNS = 3;
const CANVAS_START_X = 220;
const CANVAS_START_Y = 200;
const COMBO_GAP_X = 40;
const COMBO_GAP_Y = 48;
const MAX_ROW_WIDTH = 1600;

export interface ArchitectureCanvasRef { reLayout: () => void; }

interface ArchitectureCanvasProps {
  data: ArchitectureGraph | null;
  loading: boolean;
  editMode: boolean;
  getLocalPosition: (nodeId: string) => { x: number; y: number } | null;
  onNodeClick: (node: ArchitectureNode) => void;
  onComboClick: (combo: ArchitectureCombo) => void;
  onEdgeClick: (edge: ArchitectureEdge) => void;
  onFMSubsystemChange: (fmId: string, targetSubsystemId: string | null) => void;
  onPositionChange: (positions: PositionUpdate[]) => void;
}

// ─── 布局工具 ────────────────────────────────────────────────────

function computeGridPositions(
  cx: number, cy: number, nodeIds: string[], columns: number
): Map<string, { x: number; y: number }> {
  const result = new Map<string, { x: number; y: number }>();
  if (!nodeIds.length) return result;
  const cols = Math.max(1, Math.min(columns, nodeIds.length));
  const rows = Math.ceil(nodeIds.length / cols);
  const gridW = cols * NODE_W + (cols - 1) * GAP_X;
  const gridH = rows * NODE_H + (rows - 1) * GAP_Y;
  const startX = cx - gridW / 2 + NODE_W / 2;
  const startY = cy - (COMBO_PADDING_TOP + gridH + COMBO_PADDING_BOTTOM) / 2 + COMBO_PADDING_TOP + NODE_H / 2;
  nodeIds.forEach((id, idx) => {
    result.set(id, {
      x: startX + (idx % cols) * (NODE_W + GAP_X),
      y: startY + Math.floor(idx / cols) * (NODE_H + GAP_Y),
    });
  });
  return result;
}

function computeComboSize(nodeCount: number, columns: number): { w: number; h: number } {
  const cols = Math.max(1, Math.min(columns, nodeCount || 1));
  const rows = Math.ceil(Math.max(1, nodeCount) / cols);
  return {
    w: cols * NODE_W + (cols - 1) * GAP_X + COMBO_PADDING_X * 2,
    h: COMBO_PADDING_TOP + rows * NODE_H + (rows - 1) * GAP_Y + COMBO_PADDING_BOTTOM,
  };
}

/** 给定图内坐标（G6 坐标系），返回包含该点的 Combo ID，否则 null */
function hitTestCombo(graph: any, gx: number, gy: number): string | null {
  const allCombos: any[] = graph.getComboData();
  for (const combo of allCombos) {
    const sx: number = (combo.style as any)?.x ?? 0;
    const sy: number = (combo.style as any)?.y ?? 0;
    const sw: number = (combo.style as any)?.width ?? 400;
    const sh: number = (combo.style as any)?.height ?? 300;
    if (gx >= sx - sw / 2 && gx <= sx + sw / 2 && gy >= sy - sh / 2 && gy <= sy + sh / 2) {
      return combo.id;
    }
  }
  return null;
}

// ─── 组件 ────────────────────────────────────────────────────────

export const ArchitectureCanvas = forwardRef<ArchitectureCanvasRef, ArchitectureCanvasProps>(
  function ArchitectureCanvas(
    { data, loading, editMode, getLocalPosition, onNodeClick, onComboClick, onEdgeClick, onFMSubsystemChange, onPositionChange },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const graphRef = useRef<any>(null);
    const editModeRef = useRef(editMode);
    const currentDataRef = useRef<ArchitectureGraph | null>(null);

    /** 稳定位置缓存（combo 和 FM 节点） */
    const stablePosRef = useRef<Map<string, { x: number; y: number }>>(new Map());
    /** combo 列数缓存 */
    const comboColumnsRef = useRef<Map<string, number>>(new Map());

    /**
     * FM 拖拽状态（跨越两个事件系统共享）
     * ★ fmDragActiveRef 被 drag-element 的 enable 回调读取，当 FM drag 进行中时
     *   阻断所有 G6 drag（防止 Combo 被意外拖动）
     */
    const fmDragActiveRef = useRef(false);
    const fmDragNodeIdRef = useRef<string | null>(null);
    const fmDragOriginalComboRef = useRef<string | null>(null);
    const fmDragGhostRef = useRef<HTMLDivElement | null>(null);
    const fmDragHighlightedComboRef = useRef<string | null>(null);

    useEffect(() => { editModeRef.current = editMode; }, [editMode]);
    useEffect(() => { currentDataRef.current = data; }, [data]);

    // ── FM 拖拽幽灵元素 ──────────────────────────────────────────
    const showOrMoveGhost = useCallback((label: string, clientX: number, clientY: number) => {
      let ghost = fmDragGhostRef.current;
      if (!ghost) {
        ghost = document.createElement('div');
        Object.assign(ghost.style, {
          position: 'fixed', pointerEvents: 'none', zIndex: '9999',
          background: '#dbeafe', border: '2px dashed #3b82f6', borderRadius: '8px',
          padding: '8px 20px', fontSize: '13px', fontWeight: '500', color: '#1e293b',
          boxShadow: '0 4px 16px rgba(59,130,246,0.25)', whiteSpace: 'nowrap',
          transform: 'translate(-50%, -50%)', opacity: '0.9',
        });
        document.body.appendChild(ghost);
        fmDragGhostRef.current = ghost;
      }
      ghost.textContent = `→ ${label}`;
      ghost.style.left = `${clientX}px`;
      ghost.style.top = `${clientY}px`;
    }, []);

    const removeGhost = useCallback(() => {
      if (fmDragGhostRef.current) {
        document.body.removeChild(fmDragGhostRef.current);
        fmDragGhostRef.current = null;
      }
    }, []);

    const setComboHighlight = useCallback((comboId: string | null) => {
      const g = graphRef.current;
      if (!g) return;
      const prev = fmDragHighlightedComboRef.current;
      if (prev === comboId) return;
      if (prev) { try { g.setElementState(prev, []); g.draw(); } catch { /**/ } }
      if (comboId) { try { g.setElementState(comboId, ['selected']); g.draw(); } catch { /**/ } }
      fmDragHighlightedComboRef.current = comboId;
    }, []);

    // ── reGridCombo ──────────────────────────────────────────────
    const reGridCombo = useCallback((comboId: string) => {
      const g = graphRef.current;
      if (!g) return;
      const comboData = g.getComboData(comboId);
      if (!comboData) return;

      const stable = stablePosRef.current.get(comboId);
      const cx: number = stable?.x ?? (comboData.style as any)?.x ?? 0;
      const cy: number = stable?.y ?? (comboData.style as any)?.y ?? 0;
      const columns: number = comboColumnsRef.current.get(comboId) || DEFAULT_COLUMNS;

      const allNodes: any[] = g.getNodeData();
      const members = allNodes.filter((n: any) => n.combo === comboId);
      if (!members.length) {
        // Combo 变空了，重置为最小尺寸
        const { w, h } = computeComboSize(0, columns);
        g.updateComboData([{ id: comboId, style: { x: cx, y: cy, width: w, height: h } }]);
        g.draw();
        return;
      }

      members.sort((a: any, b: any) => {
        const ay = (a.style as any)?.y ?? 0, by = (b.style as any)?.y ?? 0;
        const ax = (a.style as any)?.x ?? 0, bx = (b.style as any)?.x ?? 0;
        return Math.abs(ay - by) > NODE_H ? ay - by : ax - bx;
      });

      const gridPos = computeGridPositions(cx, cy, members.map((m: any) => m.id), columns);
      const nodesToUpdate: any[] = [];
      const positionsToSave: PositionUpdate[] = [];
      const groupId = parseInt(comboId.replace('sub_', ''));

      gridPos.forEach((pos, nodeId) => {
        stablePosRef.current.set(nodeId, pos);
        nodesToUpdate.push({ id: nodeId, style: { x: pos.x, y: pos.y } });
        positionsToSave.push({ nodeId, nodeType: 'function_module', x: pos.x, y: pos.y, parentGroupId: groupId });
      });

      const { w, h } = computeComboSize(members.length, columns);
      g.updateComboData([{ id: comboId, style: { x: cx, y: cy, width: w, height: h } }]);
      g.updateNodeData(nodesToUpdate);
      g.draw();

      onPositionChangeRef.current(positionsToSave);
    }, []);

    // ── Refs ─────────────────────────────────────────────────────
    const onNodeClickRef = useRef(onNodeClick);
    const onComboClickRef = useRef(onComboClick);
    const onEdgeClickRef = useRef(onEdgeClick);
    const onFMSubsystemChangeRef = useRef(onFMSubsystemChange);
    const onPositionChangeRef = useRef(onPositionChange);
    const reGridComboRef = useRef(reGridCombo);
    useEffect(() => { onNodeClickRef.current = onNodeClick; }, [onNodeClick]);
    useEffect(() => { onComboClickRef.current = onComboClick; }, [onComboClick]);
    useEffect(() => { onEdgeClickRef.current = onEdgeClick; }, [onEdgeClick]);
    useEffect(() => { onFMSubsystemChangeRef.current = onFMSubsystemChange; }, [onFMSubsystemChange]);
    useEffect(() => { onPositionChangeRef.current = onPositionChange; }, [onPositionChange]);
    useEffect(() => { reGridComboRef.current = reGridCombo; }, [reGridCombo]);

    // ── buildG6Data ──────────────────────────────────────────────
    const buildG6Data = useCallback((graphData: ArchitectureGraph) => {
      const { nodes, edges, combos } = graphData;

      const comboFMsMap = new Map<string, ArchitectureNode[]>();
      combos.forEach((c) => comboFMsMap.set(c.id, []));
      nodes.forEach((node) => {
        if (node.combo && comboFMsMap.has(node.combo)) comboFMsMap.get(node.combo)!.push(node);
      });
      combos.forEach((c) => comboColumnsRef.current.set(c.id, c.data?.columns || DEFAULT_COLUMNS));

      const comboPositionMap = new Map<string, { x: number; y: number }>();
      let curRowX = CANVAS_START_X, curRowY = CANVAS_START_Y, curRowMaxH = 0;

      combos.forEach((combo) => {
        const fms = comboFMsMap.get(combo.id) || [];
        const cols = combo.data?.columns || DEFAULT_COLUMNS;
        const { w, h } = computeComboSize(fms.length, cols);

        const stable = stablePosRef.current.get(combo.id);
        if (stable) { comboPositionMap.set(combo.id, stable); return; }

        const local = getLocalPosition(combo.id);
        if (local) { stablePosRef.current.set(combo.id, local); comboPositionMap.set(combo.id, local); return; }

        if (combo.x != null && combo.y != null) {
          const pos = { x: combo.x, y: combo.y };
          stablePosRef.current.set(combo.id, pos); comboPositionMap.set(combo.id, pos); return;
        }

        if (curRowX > CANVAS_START_X && curRowX + w / 2 > CANVAS_START_X + MAX_ROW_WIDTH) {
          curRowY += curRowMaxH + COMBO_GAP_Y; curRowX = CANVAS_START_X; curRowMaxH = 0;
        }
        const pos = { x: curRowX + w / 2, y: curRowY + h / 2 };
        stablePosRef.current.set(combo.id, pos); comboPositionMap.set(combo.id, pos);
        curRowX += w + COMBO_GAP_X; curRowMaxH = Math.max(curRowMaxH, h);
      });

      const nodePositionMap = new Map<string, { x: number; y: number }>();
      combos.forEach((combo) => {
        const fms = comboFMsMap.get(combo.id) || [];
        if (!fms.length) return;
        const { x: cx, y: cy } = comboPositionMap.get(combo.id)!;
        const cols = combo.data?.columns || DEFAULT_COLUMNS;
        const sorted = [...fms].sort((a, b) => {
          const dy = (a.y ?? 0) - (b.y ?? 0);
          return Math.abs(dy) > NODE_H ? dy : (a.x ?? 0) - (b.x ?? 0);
        });
        computeGridPositions(cx, cy, sorted.map((f) => f.id), cols).forEach((pos, id) => {
          stablePosRef.current.set(id, pos); nodePositionMap.set(id, pos);
        });
      });

      let freeIdx = 0;
      nodes.forEach((node) => {
        if (!node.combo) {
          const stable = stablePosRef.current.get(node.id);
          const pos = stable ?? { x: node.x ?? (100 + (freeIdx % 4) * 220), y: node.y ?? (80 + Math.floor(freeIdx / 4) * 120) };
          if (!stable) stablePosRef.current.set(node.id, pos);
          nodePositionMap.set(node.id, pos); freeIdx++;
        }
      });

      const g6Nodes = nodes.map((node) => {
        const pos = nodePositionMap.get(node.id) ?? { x: 200, y: 200 };
        const nd: any = { id: node.id, data: node, style: { x: pos.x, y: pos.y, fill: node.style?.color || '#dbeafe', stroke: node.style?.borderColor || '#3b82f6' } };
        if (node.combo) nd.combo = node.combo;
        return nd;
      });

      const g6Combos = combos.map((combo) => {
        const { x, y } = comboPositionMap.get(combo.id)!;
        const fms = comboFMsMap.get(combo.id) || [];
        const cols = combo.data?.columns || DEFAULT_COLUMNS;
        const { w, h } = computeComboSize(fms.length, cols);
        return { id: combo.id, data: { ...combo, label: combo.label }, style: { ...(combo.style || {}), x, y, width: w, height: h } };
      });

      const g6Edges = edges.map((edge: ArchitectureEdge) => ({
        id: edge.id, source: edge.source, target: edge.target, data: edge,
        style: {
          stroke: edge.valid ? (edge.direction === 'same' ? '#f59e0b' : '#22c55e') : '#ef4444',
          lineWidth: edge.valid ? 2 : 3, lineDash: edge.direction === 'same' ? [6, 4] : undefined,
        },
      }));

      return { nodes: g6Nodes, edges: g6Edges, combos: g6Combos };
    }, [getLocalPosition]);

    // ── renderToGraph ────────────────────────────────────────────
    const renderToGraph = useCallback((graphData: ArchitectureGraph) => {
      const g = graphRef.current;
      if (!g) return;
      const { nodes: g6Nodes, edges: g6Edges, combos: g6Combos } = buildG6Data(graphData);
      let existing: any = null;
      try { existing = g.getData(); } catch { /**/ }
      const hasData = existing && (existing.nodes?.length > 0 || existing.combos?.length > 0);

      if (!hasData) { g.setData({ nodes: g6Nodes, edges: g6Edges, combos: g6Combos }); g.render(); return; }

      const existingNIds = new Set(existing.nodes?.map((n: any) => n.id));
      const existingCIds = new Set(existing.combos?.map((c: any) => c.id));
      const existingEIds = new Set(existing.edges?.map((e: any) => e.id));
      const newNIds = new Set(g6Nodes.map((n: any) => n.id));
      const newCIds = new Set(g6Combos.map((c: any) => c.id));
      const newEIds = new Set(g6Edges.map((e: any) => e.id));

      const comboAssignChanged = g6Nodes.some((newN: any) => {
        const oldN = existing.nodes?.find((n: any) => n.id === newN.id);
        return oldN && oldN.combo !== newN.combo;
      });
      const comboSetChanged = [...existingCIds].some(id => !newCIds.has(id)) || [...newCIds].some(id => !existingCIds.has(id));

      if (comboAssignChanged || comboSetChanged) {
        g.setData({ nodes: g6Nodes, edges: g6Edges, combos: g6Combos }); g.render(); return;
      }

      const nRemove = (existing.nodes || []).filter((n: any) => !newNIds.has(n.id));
      const eRemove = (existing.edges || []).filter((e: any) => !newEIds.has(e.id));
      if (nRemove.length) g.removeNodeData(nRemove.map((n: any) => n.id));
      if (eRemove.length) g.removeEdgeData(eRemove.map((e: any) => e.id));
      const nAdd = g6Nodes.filter((n: any) => !existingNIds.has(n.id));
      const eAdd = g6Edges.filter((e: any) => !existingEIds.has(e.id));
      if (nAdd.length) g.addNodeData(nAdd);
      if (eAdd.length) g.addEdgeData(eAdd);
      const nUpdate = g6Nodes.filter((n: any) => existingNIds.has(n.id));
      const cUpdate = g6Combos.filter((c: any) => existingCIds.has(c.id));
      if (nUpdate.length) g.updateNodeData(nUpdate);
      if (cUpdate.length) g.updateComboData(cUpdate);
      g.draw();
    }, [buildG6Data]);

    // ── G6 初始化 ────────────────────────────────────────────────
    useEffect(() => {
      if (!containerRef.current || graphRef.current) return;

      const graph = new Graph({
        container: containerRef.current,
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight || 800,
        node: {
          type: 'rect',
          style: {
            size: [NODE_W, NODE_H], radius: 8, fill: '#dbeafe', stroke: '#3b82f6', lineWidth: 2,
            labelText: (d: any) => d.data?.name || d.id,
            labelFill: '#1e293b', labelFontSize: 13, labelFontWeight: 500 as any,
            labelPlacement: 'center' as any, labelMaxWidth: NODE_W - 16,
            labelWordWrap: true, labelLineHeight: 18, cursor: 'grab',
          },
          state: {
            selected: { stroke: '#ef4444', lineWidth: 3 },
            hover: { stroke: '#2563eb', lineWidth: 3, shadowBlur: 8, shadowColor: '#3b82f640' },
          },
        },
        combo: {
          type: 'rect',
          style: {
            radius: 14, lineWidth: 2, lineDash: [8, 5], fill: '#fff7ed', stroke: '#f97316', fillOpacity: 0.12,
            labelText: (d: any) => d.data?.label || d.id,
            labelFontSize: 13, labelFontWeight: 'bold', labelFill: '#c2410c',
            labelBackground: true, labelBackgroundFill: 'rgba(255,237,213,0.9)',
            labelBackgroundRadius: 4, labelPadding: [2, 8],
            labelPlacement: 'top-left', labelOffsetX: 10, labelOffsetY: 14, labelTextAlign: 'left',
          },
          state: { hover: { stroke: '#f97316', lineWidth: 3, fillOpacity: 0.2 }, selected: { stroke: '#ef4444', lineWidth: 4 } },
        },
        edge: {
          type: 'quadratic',
          style: { stroke: '#94a3b8', lineWidth: 2, endArrow: true, endArrowSize: 8 },
          state: { hover: { stroke: '#3b82f6', lineWidth: 3 } },
        },
        layout: false as any,
        behaviors: [
          'drag-canvas',
          'zoom-canvas',
          {
            type: 'drag-element',
            /**
             * ★ 关键：FM 节点和 FM 拖拽进行时，阻断 G6 的 drag-element 行为
             *
             * 当 enable 返回 false 时，G6 不会调用 setPointerCapture，
             * 因此 document 级别的 pointermove/pointerup 能正常接收到事件。
             * 这就解决了 v4 中 pointer capture 导致 document 事件丢失的问题。
             */
            enable: (event: any) => {
              if (!editModeRef.current) return false;
              // FM 拖拽进行中：阻断所有 drag（防止 combo 被误拖）
              if (fmDragActiveRef.current) return false;
              // 阻断 FM 节点本身的 drag
              const targetId: string = event.target?.id || event.elementId || '';
              return !targetId.startsWith('func_mod_');
            },
            shadow: true, shadowColor: '#f9731660', shadowBlur: 12,
          },
          { type: 'hover-activate', degree: 1, state: 'hover' },
        ],
        plugins: [],
      });

      let isDragging = false;
      let fmNodeLabel = '';

      // ── 点击 ──
      graph.on('node:click', (evt: any) => {
        if (isDragging) return;
        const nodeId = evt.target?.id || evt.elementId;
        if (!nodeId) return;
        const nd = graph.getNodeData(nodeId);
        if (nd) onNodeClickRef.current((nd.data || nd) as unknown as ArchitectureNode);
      });
      graph.on('combo:click', (evt: any) => {
        if (isDragging) return;
        const comboId = evt.target?.id || evt.elementId;
        if (!comboId) return;
        const cd = graph.getComboData(comboId);
        if (cd) onComboClickRef.current((cd.data || cd) as unknown as ArchitectureCombo);
      });
      graph.on('edge:click', (evt: any) => {
        const edgeId = evt.target?.id || evt.elementId;
        if (!edgeId) return;
        const ed = graph.getEdgeData(edgeId);
        if (ed) onEdgeClickRef.current((ed.data || ed) as unknown as ArchitectureEdge);
      });

      // ── Combo（子系统）拖拽保存位置 ──
      graph.on('combo:dragstart', () => { isDragging = true; });
      graph.on('combo:dragend', (evt: any) => {
        const comboId: string = evt.target?.id || evt.elementId || '';
        if (!comboId.startsWith('sub_') || !editModeRef.current) return;
        isDragging = false;
        const comboData = graph.getComboData(comboId);
        if (!comboData) return;
        const cx: number = (comboData.style as any)?.x ?? 0;
        const cy: number = (comboData.style as any)?.y ?? 0;
        stablePosRef.current.set(comboId, { x: cx, y: cy });
        onPositionChangeRef.current([{ nodeId: comboId, nodeType: 'subsystem', x: cx, y: cy }]);
        reGridComboRef.current(comboId);
      });

      // ══════════════════════════════════════════════════════════
      // FM 自定义拖拽（document 级别 pointer 事件）
      //
      // 因为 drag-element 的 enable 对 FM 返回 false，G6 不会对 FM
      // 调用 setPointerCapture，所以 document 级别的事件能正常接收。
      // ══════════════════════════════════════════════════════════

      graph.on('node:pointerdown', (evt: any) => {
        const nodeId: string = evt.target?.id || evt.elementId || '';
        if (!nodeId.startsWith('func_mod_') || !editModeRef.current) return;

        const nodeData = graph.getNodeData(nodeId);
        fmNodeLabel = (nodeData?.data as any)?.name || nodeId;
        fmDragNodeIdRef.current = nodeId;
        fmDragOriginalComboRef.current = (nodeData as any)?.combo ?? null;
        // fmDragActiveRef 暂不设为 true，等真正开始移动后再激活
        // 这样简单点击不会触发拖拽逻辑
      });

      const canvasEl = containerRef.current!;
      let dragStarted = false;
      const THRESHOLD = 5;  // 移动超过 5px 才认为是拖拽
      let startX = 0, startY = 0;

      const onPointerMove = (e: PointerEvent) => {
        const nodeId = fmDragNodeIdRef.current;
        if (!nodeId || !editModeRef.current) return;

        if (!dragStarted) {
          const dx = Math.abs(e.clientX - startX);
          const dy = Math.abs(e.clientY - startY);
          if (dx < THRESHOLD && dy < THRESHOLD) return;
          dragStarted = true;
          isDragging = true;
          fmDragActiveRef.current = true;
          // 设置原始节点为半透明（拖拽中状态）
          try { graph.setElementState(nodeId, ['hover']); graph.draw(); } catch { /**/ }
          canvasEl.style.cursor = 'grabbing';
        }

        // 显示/移动幽灵元素
        showOrMoveGhostRef.current(fmNodeLabel, e.clientX, e.clientY);

        try {
          const gp = graph.getCanvasByClient({ x: e.clientX, y: e.clientY } as any) as any;
          setComboHighlightRef.current(hitTestCombo(graph, gp[0] ?? gp.x, gp[1] ?? gp.y));
        } catch { /**/ }
      };

      // 记录 pointerdown 起始位置（用于判断是否真的开始拖拽）
      const onNativePointerDown = (e: PointerEvent) => {
        if (fmDragNodeIdRef.current) { startX = e.clientX; startY = e.clientY; }
      };

      const finishFMDrag = (dropClientX: number, dropClientY: number) => {
        const nodeId = fmDragNodeIdRef.current;
        if (!nodeId) return;

        removeGhostRef.current();
        setComboHighlightRef.current(null);

        if (dragStarted) {
          // 清除节点状态
          try { graph.setElementState(nodeId, []); } catch { /**/ }

          const originalComboId = fmDragOriginalComboRef.current;
          let dropComboId: string | null = null;
          try {
            const gp = graph.getCanvasByClient({ x: dropClientX, y: dropClientY } as any) as any;
            dropComboId = hitTestCombo(graph, gp[0] ?? gp.x, gp[1] ?? gp.y);
          } catch { /**/ }

          if (dropComboId !== null && dropComboId !== originalComboId) {
            // 拖入不同子系统
            if (originalComboId) reGridComboRef.current(originalComboId);
            onFMSubsystemChangeRef.current(nodeId, dropComboId);
          } else if (originalComboId) {
            // 同一子系统或空白处 → 吸附回网格
            reGridComboRef.current(originalComboId);
          } else {
            // 自由节点
            try {
              const gp2 = graph.getCanvasByClient({ x: dropClientX, y: dropClientY } as any) as any;
              const gpx = gp2[0] ?? gp2.x; const gpy = gp2[1] ?? gp2.y;
              stablePosRef.current.set(nodeId, { x: gpx, y: gpy });
              onPositionChangeRef.current([{ nodeId, nodeType: 'function_module', x: gpx, y: gpy, parentGroupId: null }]);
            } catch { /**/ }
          }

          graph.draw();
        }

        // 重置状态
        fmDragNodeIdRef.current = null;
        fmDragOriginalComboRef.current = null;
        fmDragActiveRef.current = false;
        dragStarted = false;
        isDragging = false;
        canvasEl.style.cursor = '';
      };

      const onPointerUp = (e: PointerEvent) => {
        if (!fmDragNodeIdRef.current) return;
        finishFMDrag(e.clientX, e.clientY);
      };

      const onPointerCancel = () => {
        if (!fmDragNodeIdRef.current) return;
        finishFMDrag(-99999, -99999);  // 取消拖拽：落点在画布外，不命中任何 Combo
      };

      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
      document.addEventListener('pointercancel', onPointerCancel);
      canvasEl.addEventListener('pointerdown', onNativePointerDown);

      graphRef.current = graph;

      const handleResize = () => {
        if (containerRef.current && graphRef.current) {
          graphRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        }
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
        document.removeEventListener('pointercancel', onPointerCancel);
        canvasEl.removeEventListener('pointerdown', onNativePointerDown);
        if (graphRef.current) { graphRef.current.destroy(); graphRef.current = null; }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Callback refs (stable references for use inside the useEffect closure)
    const showOrMoveGhostRef = useRef(showOrMoveGhost);
    const removeGhostRef = useRef(removeGhost);
    const setComboHighlightRef = useRef(setComboHighlight);
    useEffect(() => { showOrMoveGhostRef.current = showOrMoveGhost; }, [showOrMoveGhost]);
    useEffect(() => { removeGhostRef.current = removeGhost; }, [removeGhost]);
    useEffect(() => { setComboHighlightRef.current = setComboHighlight; }, [setComboHighlight]);

    useEffect(() => {
      if (data && graphRef.current) renderToGraph(data);
    }, [data, renderToGraph]);

    useImperativeHandle(ref, () => ({
      reLayout: () => {
        stablePosRef.current.clear();
        if (currentDataRef.current) renderToGraph(currentDataRef.current);
        try { graphRef.current?.fitView({ padding: 60 }); } catch { /**/ }
      },
    }));

    return (
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }} />
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.7)' }}>
            <Spin size="large" tip="加载架构图..." />
          </div>
        )}
      </div>
    );
  }
);
