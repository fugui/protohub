/**
 * 词汇管理页面
 */

import { useState, useEffect } from 'react';
import { Table, Button, Space, message, Modal, Form, Input, Select, Tag, Card, Popconfirm, Breadcrumb } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getVocabularyTerms, createTerm, updateTerm, deleteTerm } from '../services/vocabularyService';
import { useAuthStore } from '../store';
import type { VocabularyTerm } from 'protohub-shared';

const { Option } = Select;
const { TextArea } = Input;

export function VocabularyPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';

  const [terms, setTerms] = useState<VocabularyTerm[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTerm, setEditingTerm] = useState<VocabularyTerm | null>(null);

  const [form] = Form.useForm();

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    try {
      setLoading(true);
      const result = await getVocabularyTerms();
      setTerms(result.data);
    } catch (error: any) {
      message.error('获取词汇列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: { term: string; description?: string; category?: string }) => {
    try {
      const result = await createTerm(values);
      message.success('词汇创建成功');
      setTerms([...terms, result]);
      setModalVisible(false);
      form.resetFields();
    } catch (error: any) {
      message.error('词汇创建失败');
      console.error(error);
    }
  };

  const handleUpdate = async (values: { term: string; description?: string; category?: string }) => {
    if (!editingTerm) return;

    try {
      const result = await updateTerm(editingTerm.id, values);
      message.success('词汇更新成功');
      setTerms(terms.map((t) => (t.id === result.id ? result : t)));
      setModalVisible(false);
      setEditingTerm(null);
      form.resetFields();
    } catch (error: any) {
      message.error('词汇更新失败');
      console.error(error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTerm(id);
      message.success('词汇删除成功');
      setTerms(terms.filter((t) => t.id !== id));
    } catch (error: any) {
      message.error('词汇删除失败');
      console.error(error);
    }
  };

  const handleEdit = (term: VocabularyTerm) => {
    setEditingTerm(term);
    setModalVisible(true);
    form.setFieldsValue({
      term: term.term,
      description: term.description || '',
      category: term.category || '',
    });
  };

  const handleAdd = () => {
    setEditingTerm(null);
    setModalVisible(true);
    form.resetFields();
  };

  const handleCancel = () => {
    setModalVisible(false);
    setEditingTerm(null);
    form.resetFields();
  };

  const handleFormSubmit = async (values: { term: string; description?: string; category?: string }) => {
    if (editingTerm) {
      await handleUpdate(values);
    } else {
      await handleCreate(values);
    }
  };

  const getCategoryTag = (category: string) => {
    const categoryConfig: Record<string, { color: string }> = {
      common: { color: 'blue' },
      domain_specific: { color: 'green' },
    };
    const config = categoryConfig[category] || { color: 'default' };

    return <Tag color={config.color}>{category || '未分类'}</Tag>;
  };

  const columns = [
    {
      title: '术语',
      dataIndex: 'term',
      key: 'term',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => getCategoryTag(category),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: VocabularyTerm) => (
        <Space>
          {isAdmin && (
            <Button size="small" onClick={() => handleEdit(record)}>
              编辑
            </Button>
          )}
          <Popconfirm
            title="确认删除"
            description={`确定要删除术语 "${record.term}" 吗？`}
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const [filter, setFilter] = useState('');
  const filteredTerms = terms.filter((term) =>
    term.term.toLowerCase().includes(filter.toLowerCase()) ||
    term.description?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div style={{ padding: 24 }}>
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate('/files')}>文件管理</Breadcrumb.Item>
        <Breadcrumb.Item>词汇管理</Breadcrumb.Item>
      </Breadcrumb>

      <Card
        title={
          <Space>
            <h2>词汇管理</h2>
            {isAdmin && (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                添加术语
              </Button>
            )}
          </Space>
        }
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 搜索栏 */}
          <div style={{ marginBottom: 16 }}>
            <Input
              placeholder="搜索术语或描述..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              allowClear
              style={{ width: 300 }}
            />
            <Tag style={{ marginLeft: 16 }}>
              共 {terms.length} 个术语
            </Tag>
          </div>

          {/* 词汇列表 */}
          <Table
            dataSource={filteredTerms}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{
              total: filteredTerms.length,
              pageSize: 20,
              showSizeChanger: false,
            }}
            scroll={{ y: 500 }}
            rowClassName={() => 'cursor-pointer'}
            onRow={(record) => ({
              onClick: () => {
                if (isAdmin) {
                  handleEdit(record);
                }
              },
            })}
          />

          {/* 添加/编辑词汇弹窗 */}
          <Modal
            open={modalVisible}
            title={editingTerm ? '编辑术语' : '添加术语'}
            onCancel={handleCancel}
            footer={[
              <Button key="cancel" onClick={handleCancel}>取消</Button>,
              <Button key="submit" type="primary" htmlType="submit">
                {editingTerm ? '更新' : '创建'}
              </Button>,
            ]}
            width={600}
          >
            <Form form={form} layout="vertical" initialValues={editingTerm || undefined} onFinish={handleFormSubmit}>
              <Form.Item
                label="术语"
                name="term"
                rules={[
                  { required: true, message: '请输入术语' },
                  { validator: (_, value) => {
                    const exists = terms.some(
                      (t) => t.term === value && t.id !== editingTerm?.id
                    );
                    if (exists) {
                      return Promise.reject(new Error('该术语已存在'));
                    }
                    return Promise.resolve();
                  },
                }]}
              >
                <Input placeholder="请输入术语" maxLength={50} />
              </Form.Item>

              <Form.Item
                label="描述"
                name="description"
                rules={[{ max: 200, message: '描述最多200个字符' }]}
              >
                <TextArea
                  placeholder="请输入描述"
                  autoSize={{ minRows: 3, maxRows: 6 }}
                  maxLength={200}
                />
              </Form.Item>

              <Form.Item
                label="分类"
                name="category"
                initialValue="common"
              >
                <Select placeholder="请选择分类">
                  <Option value="common">通用</Option>
                  <Option value="domain_specific">领域特定</Option>
                </Select>
              </Form.Item>
            </Form>
          </Modal>
        </Space>
      </Card>
    </div>
  );
}
