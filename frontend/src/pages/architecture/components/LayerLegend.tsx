/**
 * 层级图例栏 + 编辑模式提示
 */

import { Space, Tag } from 'antd';
import type { ArchitectureLayer } from '../../../services/architectureService';

interface LayerLegendProps {
  layers: ArchitectureLayer[];
  editMode: boolean;
}

export function LayerLegend({ layers, editMode }: LayerLegendProps) {
  return (
    <div
      style={{
        padding: '8px 16px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#fafafa',
        flexShrink: 0,
      }}
    >
      <Space>
        <span style={{ color: '#666', fontSize: 13 }}>层级：</span>
        {layers.map((layer) => (
          <Tag key={layer.id} color={layer.color}>
            L{layer.level} {layer.name}
          </Tag>
        ))}
        <span style={{ color: '#999', fontSize: 12, marginLeft: 8 }}>
          · 橙色虚线框 = 子系统 &nbsp;· 蓝色实线框 = 功能模块 FM &nbsp;· 箭头 = Service 依赖
        </span>
      </Space>
      {editMode && (
        <Tag color="processing">
          编辑模式：拖拽 FM 可换子系统；点击节点可查看和修改属性
        </Tag>
      )}
    </div>
  );
}
