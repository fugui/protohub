/**
 * 功能模块管理页面
 */

import { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Popconfirm, Card, Descriptions } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ApartmentOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getAllFunctionModules, createFunctionModule } from '../services/functionModuleService';
import { logout } from '../services/authService';
import { useAuthStore } from '../store';
import type { FunctionModule } from 'protohub-shared';

const { Column } = Table;

export function FunctionModulePage() {
  const [messageApi, contextHolder] = message.useMessage();
  const [functionModules, setFunctionModules] = useState<FunctionModule[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFunctionModule, setEditingFunctionModule] = useState<FunctionModule | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedFunctionModule, setSelectedFunctionModule] = useState<FunctionModule | null>(null);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.logout);
  const [form] = Form.useForm();

  const fetchFunctionModules = async () => {
    try {
      setLoading(true);
      const data = await getAllFunctionModules();
      setFunctionModules(data);
    } catch (error: any) {
      messageApi.error('获取功能模块列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFunctionModules();
  }, []);

  const handleLogout = () => {
    logout();
    setAuth();
    navigate('/login');
  };

  const handleAdd = () => {
    setEditingFunctionModule(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: FunctionModule) => {
    setEditingFunctionModule(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (_id: number) => {
    try {
      // TODO: 调用删除 API
      messageApi.success('删除成功');
      fetchFunctionModules();
    } catch (error: any) {
      messageApi.error('删除失败');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingFunctionModule) {
        // TODO: 调用更新 API
        messageApi.success('更新成功');
      } else {
        await createFunctionModule(values);
        messageApi.success('创建成功');
      }
      setModalVisible(false);
      form.resetFields();
      fetchFunctionModules();
    } catch (error: any) {
      if (error && error.message) {
        messageApi.error(error.message || '操作失败');
      }
    }
  };

  const handleViewDetailFM = (record: FunctionModule) => {
    setSelectedFunctionModule(record);
    setDetailVisible(true);
  };

  return (
    <div style={{ padding: 24 }}>
      {contextHolder}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h1>
          <ApartmentOutlined /> 功能模块管理
        </h1>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建功能模块
          </Button>
          <Button icon={<LogoutOutlined />} onClick={handleLogout}>
            退出
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          dataSource={functionModules}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
          }}
        >
          <Column title="ID" dataIndex="id" key="id" width={80} />
          <Column title="名称" dataIndex="name" key="name" />
          <Column title="描述" dataIndex="description" key="description" ellipsis />
          <Column
            title="状态"
            dataIndex="status"
            key="status"
            render={(status) => (
              <span style={{ color: status === 'active' ? '#52c41a' : '#ff4d4f' }}>
                {status === 'active' ? '活跃' : '停用'}
              </span>
            )}
          />
          <Column
            title="创建时间"
            dataIndex="created_at"
            key="created_at"
            render={(date) => new Date(date).toLocaleString('zh-CN')}
          />
          <Column
            title="操作"
            key="action"
            render={(_, record: FunctionModule) => (
              <Space>
                <Button
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                >
                  编辑
                </Button>
                <Button
                  type="link"
                  size="small"
                  onClick={() => handleViewDetailFM(record)}
                >
                  详情
                </Button>
                <Popconfirm
                  title="确认删除"
                  description="确定要删除这个功能模块吗？"
                  onConfirm={() => handleDelete(record.id)}
                  okText="确认"
                  cancelText="取消"
                >
                  <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            )}
          />
        </Table>
      </Card>

      <Modal
        title={editingFunctionModule ? '编辑功能模块' : '新建功能模块'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        destroyOnHidden
        forceRender
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="名称"
            name="name"
            rules={[{ required: true, message: '请输入子系统名称' }]}
          >
            <Input placeholder="请输入子系统名称，例如: user_service" />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea
              rows={4}
              placeholder="请输入子系统描述"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="子系统详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
        ]}
      >
        {selectedFunctionModule && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="ID">{selectedFunctionModule.id}</Descriptions.Item>
            <Descriptions.Item label="名称">{selectedFunctionModule.name}</Descriptions.Item>
            <Descriptions.Item label="描述">
              {selectedFunctionModule.description || '-'}
            </Descriptions.Item>
            {selectedFunctionModule.owner && (
              <Descriptions.Item label="负责人">
                {selectedFunctionModule.owner}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="创建时间">
              {new Date(selectedFunctionModule.createdAt).toLocaleString('zh-CN')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
