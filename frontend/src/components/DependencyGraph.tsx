/**
 * 依赖关系图组件 - 使用 ECharts 实现
 */

import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { DependencyNode, DependencyEdge } from 'protohub-shared';

interface DependencyGraphProps {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  circularDependencies?: string[][];
  loading?: boolean;
  onNodeClick?: (node: DependencyNode) => void;
}

/**
 * 将节点和边转换为 ECharts 图谱数据
 */
function convertToGraphData(
  nodes: DependencyNode[],
  edges: DependencyEdge[],
  circularDependencies: string[][] = []
) {
  // 构建节点数据
  const nodeData = nodes.map((node) => ({
    id: node.id,
    name: node.label,
    category: node.category || 'default',
    symbolSize: 50,
    itemStyle: {
      color: getNodeColor(node.type),
    },
    label: {
      show: true,
      formatter: node.label.length > 15 ? node.label.substring(0, 15) + '...' : node.label,
    },
  }));

  // 构建边数据
  const edgeData = edges.map((edge) => ({
    source: edge.source,
    target: edge.target,
    lineStyle: {
      color: '#999',
      width: 1,
      curveness: 0.2,
    },
  }));

  // 高亮循环依赖的边
  const circularDepEdges = new Set<string>();
  circularDependencies.forEach((cycle) => {
    for (let i = 0; i < cycle.length - 1; i++) {
      circularDepEdges.add(`${cycle[i]}-${cycle[i + 1]}`);
    }
    // 闭环
    if (cycle.length > 1) {
      circularDepEdges.add(`${cycle[cycle.length - 1]}-${cycle[0]}`);
    }
  });

  // 更新循环依赖边的样式
  edgeData.forEach((edge) => {
    if (circularDepEdges.has(`${edge.source}-${edge.target}`)) {
      edge.lineStyle.color = '#ff4d4f';
      edge.lineStyle.width = 2;
    }
  });

  // 构建分类数据
  const categories = Array.from(new Set(nodes.map((n) => n.category || 'default'))).map(
    (cat, index) => ({
      name: cat,
      itemStyle: {
        color: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272'][
          index % 6
        ],
      },
    })
  );

  return { nodeData, edgeData, categories };
}

/**
 * 根据节点类型获取颜色
 */
function getNodeColor(type: string): string {
  const colors: Record<string, string> = {
    file: '#5470c6',
    subsystem: '#91cc75',
    service: '#fac858',
  };
  return colors[type] || '#91cc75';
}

/**
 * 依赖关系图组件
 */
export const DependencyGraph: React.FC<DependencyGraphProps> = ({
  nodes,
  edges,
  circularDependencies = [],
  loading = false,
  onNodeClick,
}) => {
  const { nodeData, edgeData, categories } = useMemo(
    () => convertToGraphData(nodes, edges, circularDependencies),
    [nodes, edges, circularDependencies]
  );

  const option = {
    title: {
      text: 'Proto 文件依赖关系图',
      subtext: circularDependencies.length > 0
        ? `发现 ${circularDependencies.length} 个循环依赖`
        : '无循环依赖',
      left: 'center',
      top: 10,
    },
    tooltip: {
      formatter: (params: any) => {
        if (params.dataType === 'node') {
          return `<strong>${params.name}</strong><br/>类型: ${params.data.category || 'default'}`;
        }
        if (params.dataType === 'edge') {
          return `${params.data.source} → ${params.data.target}`;
        }
        return '';
      },
    },
    legend: {
      data: categories.map((cat) => cat.name),
      top: 50,
    },
    series: [
      {
        type: 'graph',
        layout: 'force',
        data: nodeData,
        links: edgeData,
        categories: categories,
        roam: true,
        label: {
          show: true,
          position: 'right',
          formatter: '{b}',
        },
        lineStyle: {
          color: 'source',
          curveness: 0.3,
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: {
            width: 4,
          },
        },
        force: {
          repulsion: 300,
          edgeLength: 100,
          gravity: 0.1,
        },
      },
    ],
  };

  const onEvents = {
    click: (params: any) => {
      if (params.dataType === 'node' && onNodeClick) {
        const node = nodes.find((n) => n.id === params.data.id);
        if (node) {
          onNodeClick(node);
        }
      }
    },
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '500px',
        }}
      >
        加载中...
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '500px' }}>
      <ReactECharts option={option} onEvents={onEvents} style={{ height: '100%' }} />
    </div>
  );
};
