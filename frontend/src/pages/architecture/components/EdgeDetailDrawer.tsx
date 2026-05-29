/**
 * 依赖边详情侧边栏
 */

import { Drawer, Tag, List, Descriptions } from 'antd';
import {
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import type { ArchitectureEdge } from '../../../services/architectureService';

interface EdgeDetailDrawerProps {
  edge: ArchitectureEdge | null;
  open: boolean;
  onClose: () => void;
}

function StatusTag({ edge }: { edge: ArchitectureEdge }) {
  if (!edge.valid) {
    return (
      <Tag icon={<CloseCircleOutlined />} color="error">
        非法（违反分层原则）
      </Tag>
    );
  }
  if (edge.direction === 'same') {
    return (
      <Tag icon={<WarningOutlined />} color="warning">
        同级依赖
      </Tag>
    );
  }
  return (
    <Tag icon={<CheckCircleOutlined />} color="success">
      合法
    </Tag>
  );
}

function DirectionLabel({ dir }: { dir: 'up' | 'down' | 'same' }) {
  const map = {
    up: { text: '向上（低层依赖高层，违规）', color: 'red' },
    down: { text: '向下（高层依赖低层，合规）', color: 'green' },
    same: { text: '同层（同级依赖）', color: 'orange' },
  };
  const info = map[dir];
  return <span style={{ color: info.color }}>{info.text}</span>;
}

export function EdgeDetailDrawer({ edge, open, onClose }: EdgeDetailDrawerProps) {
  if (!edge) return null;

  return (
    <Drawer
      title="Service 依赖详情"
      placement="right"
      width={500}
      onClose={onClose}
      open={open}
    >
      <Descriptions column={1} bordered size="small" style={{ marginBottom: 20 }}>
        <Descriptions.Item label="状态">
          <StatusTag edge={edge} />
        </Descriptions.Item>
        <Descriptions.Item label="方向">
          <DirectionLabel dir={edge.direction} />
        </Descriptions.Item>
        <Descriptions.Item label="层级">
          L{edge.sourceLayer} → L{edge.targetLayer}
        </Descriptions.Item>
        <Descriptions.Item label="依赖 Proto 文件数">
          {edge.dependencyCount}
        </Descriptions.Item>
      </Descriptions>

      {(edge.fileDependencies?.length ?? 0) > 0 && (
        <>
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#666' }}>
            依赖文件明细
          </div>
          <List
            bordered
            size="small"
            dataSource={edge.fileDependencies}
            renderItem={(dep: any) => (
              <List.Item>
                <div>
                  <div style={{ fontWeight: 500 }}>
                    {dep.sourceFile?.filename} → {dep.targetFile?.filename}
                  </div>
                  <div style={{ fontSize: 12, color: '#999' }}>
                    {dep.sourceFile?.packageName} → {dep.targetFile?.packageName}
                  </div>
                </div>
              </List.Item>
            )}
          />
        </>
      )}
    </Drawer>
  );
}
