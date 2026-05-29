/**
 * 功能模块 (FM) 节点详情侧边栏
 */

import { Drawer, Tag, Select, Button, Descriptions, Space } from 'antd';
import { FolderOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ArchitectureNode, ArchitectureCombo, ArchitectureLayer } from '../../../services/architectureService';

const { Option } = Select;

interface NodeDetailDrawerProps {
  node: ArchitectureNode | null;
  open: boolean;
  editMode: boolean;
  layers: ArchitectureLayer[];
  combos: ArchitectureCombo[];
  onClose: () => void;
  onLayerChange: (fmId: string, layerLevel: number) => Promise<void>;
  onSubsystemChange: (fmId: string, subsystemId: number | null) => Promise<void>;
}

export function NodeDetailDrawer({
  node,
  open,
  editMode,
  layers,
  combos,
  onClose,
  onLayerChange,
  onSubsystemChange,
}: NodeDetailDrawerProps) {
  const navigate = useNavigate();

  if (!node) return null;

  const fmId = node.id.replace('func_mod_', '');
  const currentLayer = layers.find((l) => l.level === node.layerLevel);
  const currentCombo = combos.find((c) => c.id === node.combo);
  const fm = node.subsystemInfo;

  return (
    <Drawer
      title={
        <Space>
          <span>{node.name}</span>
          <Tag color="blue">功能模块 FM</Tag>
        </Space>
      }
      placement="right"
      width={420}
      onClose={onClose}
      open={open}
    >
      <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
        <Descriptions.Item label="所属层级">
          {editMode ? (
            <Select
              value={node.layerLevel}
              style={{ width: '100%' }}
              onChange={(val) => onLayerChange(fmId, val)}
            >
              {layers.map((l) => (
                <Option key={l.id} value={l.level}>
                  <Tag color={l.color}>L{l.level}</Tag> {l.name}
                </Option>
              ))}
            </Select>
          ) : (
            <Tag color={currentLayer?.color}>
              L{node.layerLevel} · {currentLayer?.name || '未知'}
            </Tag>
          )}
        </Descriptions.Item>

        <Descriptions.Item label="所属子系统">
          {editMode ? (
            <Select
              value={node.combo || ''}
              style={{ width: '100%' }}
              allowClear
              placeholder="未归属子系统（独立 FM）"
              onChange={(val) => {
                const subsystemId = val ? parseInt(val.replace('sub_', '')) : null;
                onSubsystemChange(fmId, subsystemId);
              }}
            >
              {combos.map((c) => (
                <Option key={c.id} value={c.id}>
                  <FolderOutlined style={{ color: '#fa8c16', marginRight: 4 }} />
                  {c.label}
                </Option>
              ))}
            </Select>
          ) : node.combo ? (
            <Tag icon={<FolderOutlined />} color="orange">
              {currentCombo?.label || node.combo}
            </Tag>
          ) : (
            <span style={{ color: '#999' }}>未归属子系统</span>
          )}
        </Descriptions.Item>

        {fm && (
          <>
            <Descriptions.Item label="Proto 文件数">{fm.fileCount}</Descriptions.Item>
            <Descriptions.Item label="被依赖（入）">{fm.dependenciesIn}</Descriptions.Item>
            <Descriptions.Item label="依赖他人（出）">{fm.dependenciesOut}</Descriptions.Item>
          </>
        )}
      </Descriptions>

      <Button
        type="primary"
        block
        icon={<ArrowRightOutlined />}
        onClick={() => {
          onClose();
          navigate(`/function-modules`);
        }}
      >
        查看功能模块详情
      </Button>
    </Drawer>
  );
}
