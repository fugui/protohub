/**
 * 文件列表页面
 */

import { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, message } from 'antd';
import { PlusOutlined, LogoutOutlined, CheckSquareOutlined, ApartmentOutlined, PartitionOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getFiles } from '../services/fileService';
import { logout } from '../services/authService';
import { useAuthStore } from '../store';
import type { ProtoFile } from 'protohub-shared';

const { Column } = Table;

export function FileListPage() {
  const [files, setFiles] = useState<ProtoFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.logout);

  const fetchFiles = async (pageNum = 1) => {
    try {
      setLoading(true);
      const result = await getFiles({ page: pageNum, pageSize: 20 });
      setFiles(result.data);
      setTotal(result.total);
      setPage(pageNum);
    } catch (error: any) {
      message.error('获取文件列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleLogout = () => {
    logout();
    setAuth();
    navigate('/login');
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      draft: { color: 'default', text: '草稿' },
      pending_review: { color: 'processing', text: '待审核' },
      approved: { color: 'success', text: '已批准' },
      rejected: { color: 'error', text: '已拒绝' },
    };
    const { color, text } = statusMap[status] || { color: 'default', text: status };
    return <Tag color={color}>{text}</Tag>;
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h1>Proto 文件管理</h1>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/files/new')}>
            新建文件
          </Button>
          <Button icon={<CheckSquareOutlined />} onClick={() => navigate('/reviews')}>
            审核工作台
          </Button>
          <Button icon={<ApartmentOutlined />} onClick={() => navigate('/architecture')}>
            架构全景图
          </Button>
          <Button icon={<PartitionOutlined />} onClick={() => navigate('/subsystems')}>
            子系统管理
          </Button>
          <Button icon={<LogoutOutlined />} onClick={handleLogout}>
            退出
          </Button>
        </Space>
      </div>

      <Table
        dataSource={files}
        loading={loading}
        rowKey="id"
        pagination={{
          current: page,
          total,
          pageSize: 20,
          onChange: (page) => fetchFiles(page),
        }}
        onRow={(record) => ({
          onClick: () => navigate(`/files/${record.id}`),
        })}
      >
        <Column title="文件名" dataIndex="filename" key="filename" />
        <Column title="包名" dataIndex="packageName" key="packageName" />
        <Column
          title="状态"
          dataIndex="status"
          key="status"
          render={(status) => getStatusTag(status)}
        />
        <Column title="版本" dataIndex="currentVersion" key="currentVersion" />
        <Column
          title="锁定"
          dataIndex="locked"
          key="locked"
          render={(locked) => (locked ? <Tag color="warning">已锁定</Tag> : null)}
        />
        <Column
          title="创建时间"
          dataIndex="createdAt"
          key="createdAt"
          render={(date) => new Date(date).toLocaleString('zh-CN')}
        />
      </Table>
    </div>
  );
}
