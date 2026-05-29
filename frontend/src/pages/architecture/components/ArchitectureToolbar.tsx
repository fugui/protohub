/**
 * 架构图工具栏
 */

import { Space, Button, Tag } from 'antd';
import {
  EditOutlined,
  SaveOutlined,
  ReloadOutlined,
  PlusOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';

interface ArchitectureToolbarProps {
  editMode: boolean;
  onToggleEditMode: () => void;
  onCreateSubsystem: () => void;
  onReLayout: () => void;
}

export function ArchitectureToolbar({
  editMode,
  onToggleEditMode,
  onCreateSubsystem,
  onReLayout,
}: ArchitectureToolbarProps) {
  return (
    <Space>
      <ApartmentOutlined />
      <span style={{ fontWeight: 600, fontSize: 15 }}>架构全景图</span>
      <Tag color={editMode ? 'processing' : 'default'} style={{ marginLeft: 4 }}>
        {editMode ? '编辑模式' : '预览模式'}
      </Tag>
      <Button icon={<ReloadOutlined />} onClick={onReLayout} size="small">
        重新布局
      </Button>
      <Button icon={<PlusOutlined />} onClick={onCreateSubsystem} size="small">
        创建子系统
      </Button>
      <Button
        type={editMode ? 'primary' : 'default'}
        icon={editMode ? <SaveOutlined /> : <EditOutlined />}
        onClick={onToggleEditMode}
        size="small"
      >
        {editMode ? '退出编辑' : '编辑模式'}
      </Button>
    </Space>
  );
}
