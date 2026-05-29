/**
 * 子系统 (Subsystem/Combo) 详情侧边栏
 */

import { Drawer, Tag, Select, List, Button, Descriptions, Space } from 'antd';
import { FolderOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type {
  ArchitectureCombo,
  ArchitectureNode,
  ArchitectureLayer,
} from '../../../services/architectureService';

const { Option } = Select;

interface SubsystemDetailDrawerProps {
  combo: ArchitectureCombo | null;
  open: boolean;
  editMode: boolean;
  layers: ArchitectureLayer[];
  /** All FM nodes belonging to this combo */
  members: ArchitectureNode[];
  onClose: () => void;
  onColumnsChange: (groupId: number, columns: number) => Promise<void>;
}

export function SubsystemDetailDrawer({
  combo,
  open,
  editMode,
  layers,
  members,
  onClose,
  onColumnsChange,
}: SubsystemDetailDrawerProps) {
  const navigate = useNavigate();

  if (!combo) return null;

  const groupId = parseInt(combo.id.replace('sub_', ''));
  const currentLayer = layers.find((l) => l.level === combo.layerLevel);
  const columns = combo.data?.columns || 3;

  return (
    <Drawer
      title={
        <Space>
          <FolderOutlined style={{ color: '#fa8c16' }} />
          <span>{combo.label}</span>
          <Tag color="orange">子系统</Tag>
        </Space>
      }
      placement="right"
      width={460}
      onClose={onClose}
      open={open}
    >
      <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
        <Descriptions.Item label="架构层级">
          {currentLayer ? (
            <Tag color={currentLayer.color}>
              L{combo.layerLevel} · {currentLayer.name}
            </Tag>
          ) : (
            <span style={{ color: '#999' }}>未指定</span>
          )}
        </Descriptions.Item>

        <Descriptions.Item label="包含 FM 数量">{members.length}</Descriptions.Item>

        <Descriptions.Item label="FM 排列列数">
          {editMode ? (
            <Select
              value={columns}
              style={{ width: 120 }}
              onChange={(val) => onColumnsChange(groupId, val)}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <Option key={n} value={n}>
                  {n} 列
                </Option>
              ))}
            </Select>
          ) : (
            <span>{columns} 列</span>
          )}
        </Descriptions.Item>
      </Descriptions>

      <div style={{ marginBottom: 8, fontWeight: 600, color: '#666' }}>
        <FolderOutlined style={{ marginRight: 6 }} />
        包含的功能模块（{members.length}）
      </div>

      <List
        bordered
        dataSource={members}
        size="small"
        renderItem={(fm: ArchitectureNode) => (
          <List.Item
            actions={[
              <Button
                key="view"
                type="link"
                size="small"
                icon={<ArrowRightOutlined />}
                onClick={() => {
                  onClose();
                  navigate('/function-modules');
                }}
              >
                查看
              </Button>,
            ]}
          >
            <List.Item.Meta
              title={fm.name}
              description={
                <span style={{ fontSize: 12, color: '#999' }}>
                  {fm.subsystemInfo?.fileCount ?? 0} 个 Proto 文件 ·{' '}
                  入 {fm.subsystemInfo?.dependenciesIn ?? 0} /{' '}
                  出 {fm.subsystemInfo?.dependenciesOut ?? 0} 依赖
                </span>
              }
            />
          </List.Item>
        )}
        locale={{ emptyText: '该子系统暂无 FM' }}
      />
    </Drawer>
  );
}
