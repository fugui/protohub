/**
 * 词汇管理页面
 * 支持完整的术语信息：中英文描述、同义词、相似词、业务域
 */

import { useState, useEffect } from 'react';
import { Table, Button, Space, message, Modal, Form, Input, Select, Tag, Card, Popconfirm, Breadcrumb, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
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
  const [filter, setFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();

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

  const handleCreate = async (values: any) => {
    try {
      // 处理数组字段
      const data = {
        ...values,
        aliases: values.aliases?.split(',').map((s: string) => s.trim()).filter(Boolean) || [],
        similarTerms: values.similarTerms?.split(',').map((s: string) => s.trim()).filter(Boolean) || [],
      };
      const result = await createTerm(data);
      message.success('词汇创建成功');
      setTerms([...terms, result]);
      setModalVisible(false);
      form.resetFields();
    } catch (error: any) {
      message.error('词汇创建失败：' + (error.response?.data?.message || error.message));
      console.error(error);
    }
  };

  const handleUpdate = async (values: any) => {
    if (!editingTerm) return;

    try {
      // 处理数组字段
      const data = {
        ...values,
        aliases: values.aliases?.split(',').map((s: string) => s.trim()).filter(Boolean) || [],
        similarTerms: values.similarTerms?.split(',').map((s: string) => s.trim()).filter(Boolean) || [],
      };
      const result = await updateTerm(editingTerm.id, data);
      message.success('词汇更新成功');
      setTerms(terms.map((t) => (t.id === result.id ? result : t)));
      setModalVisible(false);
      setEditingTerm(null);
      form.resetFields();
    } catch (error: any) {
      message.error('词汇更新失败：' + (error.response?.data?.message || error.message));
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
      descriptionEn: term.descriptionEn || '',
      aliases: term.aliases?.join(', ') || '',
      similarTerms: term.similarTerms?.join(', ') || '',
      domain: term.domain || '',
      category: term.category || 'common',
    });
  };

  const handleAdd = () => {
    setEditingTerm(null);
    setModalVisible(true);
    form.resetFields();
    form.setFieldsValue({ category: 'common' });
  };

  const handleCancel = () => {
    setModalVisible(false);
    setEditingTerm(null);
    form.resetFields();
  };

  const handleFormSubmit = async (values: any) => {
    if (editingTerm) {
      await handleUpdate(values);
    } else {
      await handleCreate(values);
    }
  };

  const getCategoryTag = (category?: string) => {
    const categoryConfig: Record<string, { color: string; label: string }> = {
      common: { color: 'blue', label: '通用' },
      domain_specific: { color: 'green', label: '领域特定' },
      technical: { color: 'purple', label: '技术术语' },
      business: { color: 'orange', label: '业务术语' },
    };
    const config = categoryConfig[category || ''] || { color: 'default', label: category || '未分类' };
    return <Tag color={config.color}>{config.label}</Tag>;
  };

  const getDomainTag = (domain?: string) => {
    if (!domain) return <Tag>未指定</Tag>;
    const domainColors: Record<string, string> = {
      user: 'blue',
      order: 'green',
      product: 'orange',
      payment: 'red',
      system: 'purple',
    };
    return <Tag color={domainColors[domain] || 'default'}>{domain}</Tag>;
  };

  const columns = [
    {
      title: '术语',
      dataIndex: 'term',
      key: 'term',
      width: 150,
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: '中文描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '英文描述',
      dataIndex: 'descriptionEn',
      key: 'descriptionEn',
      ellipsis: true,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => getCategoryTag(category),
    },
    {
      title: '业务域',
      dataIndex: 'domain',
      key: 'domain',
      width: 100,
      render: (domain: string) => getDomainTag(domain),
    },
    {
      title: '同义词',
      dataIndex: 'aliases',
      key: 'aliases',
      width: 150,
      render: (aliases?: string[]) => (
        <Space size={[0, 4]} wrap>
          {aliases?.map((alias, idx) => (
            <Tag key={idx}>{alias}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 150,
      render: (date: string) => date ? new Date(date).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_: any, record: VocabularyTerm) => (
        <Space>
          {isAdmin && (
            <Button 
              size="small" 
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
          )}
          {isAdmin && (
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
          )}
        </Space>
      ),
    },
  ];

  // 过滤数据
  const filteredTerms = terms.filter((term) => {
    const matchKeyword = 
      term.term.toLowerCase().includes(filter.toLowerCase()) ||
      term.description?.toLowerCase().includes(filter.toLowerCase()) ||
      term.descriptionEn?.toLowerCase().includes(filter.toLowerCase()) ||
      term.aliases?.some((a: string) => a.toLowerCase().includes(filter.toLowerCase()));
    
    const matchCategory = !categoryFilter || term.category === categoryFilter;
    
    return matchKeyword && matchCategory;
  });

  return (
    <div style={{ padding: 24 }}>
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item onClick={() => navigate('/files')}>文件管理</Breadcrumb.Item>
        <Breadcrumb.Item>词汇管理</Breadcrumb.Item>
      </Breadcrumb>

      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 标题栏 */}
          <Row justify="space-between" align="middle">
            <Col>
              <h2 style={{ margin: 0 }}>词汇管理</h2>
              <p style={{ margin: '8px 0 0 0', color: '#666' }}>
                维护标准化的产品命名术语，支持 LLM 智能检查
              </p>
            </Col>
            <Col>
              {isAdmin && (
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                  添加术语
                </Button>
              )}
            </Col>
          </Row>

          {/* 搜索过滤栏 */}
          <Row gutter={16}>
            <Col span={12}>
              <Input.Search
                placeholder="搜索术语、描述、同义词..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                allowClear
                style={{ width: '100%' }}
              />
            </Col>
            <Col span={6}>
              <Select
                placeholder="分类筛选"
                allowClear
                value={categoryFilter}
                onChange={setCategoryFilter}
                style={{ width: '100%' }}
              >
                <Option value="common">通用</Option>
                <Option value="domain_specific">领域特定</Option>
                <Option value="technical">技术术语</Option>
                <Option value="business">业务术语</Option>
              </Select>
            </Col>
            <Col span={6} style={{ textAlign: 'right' }}>
              <Tag>共 {filteredTerms.length} 个术语</Tag>
            </Col>
          </Row>

          {/* 词汇列表 */}
          <Table
            dataSource={filteredTerms}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{
              total: filteredTerms.length,
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
              showTotal: (total) => `共 ${total} 条`,
            }}
            scroll={{ x: 1200 }}
          />
        </Space>
      </Card>

      {/* 添加/编辑词汇弹窗 */}
      <Modal
        open={modalVisible}
        title={editingTerm ? '编辑术语' : '添加术语'}
        onCancel={handleCancel}
        width={700}
        footer={[
          <Button key="cancel" onClick={handleCancel}>取消</Button>,
          <Button key="submit" type="primary" onClick={() => form.submit()}>
            {editingTerm ? '更新' : '创建'}
          </Button>,
        ]}
      >
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={handleFormSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="术语（英文）"
                name="term"
                rules={[
                  { required: true, message: '请输入术语' },
                  { pattern: /^[a-zA-Z][a-zA-Z0-9]*$/, message: '术语必须是英文，首字母为字母' },
                ]}
              >
                <Input placeholder="如：User" disabled={!!editingTerm} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="分类"
                name="category"
                rules={[{ required: true, message: '请选择分类' }]}
              >
                <Select placeholder="请选择分类">
                  <Option value="common">通用</Option>
                  <Option value="domain_specific">领域特定</Option>
                  <Option value="technical">技术术语</Option>
                  <Option value="business">业务术语</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="中文描述"
                name="description"
              >
                <TextArea
                  placeholder="请输入中文描述"
                  rows={3}
                  maxLength={200}
                  showCount
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="英文描述"
                name="descriptionEn"
              >
                <TextArea
                  placeholder="请输入英文描述"
                  rows={3}
                  maxLength={200}
                  showCount
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="业务域"
                name="domain"
              >
                <Select placeholder="请选择业务域" allowClear>
                  <Option value="user">用户</Option>
                  <Option value="order">订单</Option>
                  <Option value="product">商品</Option>
                  <Option value="payment">支付</Option>
                  <Option value="system">系统</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="同义词（用逗号分隔）"
                name="aliases"
                extra="如：account, member, customer"
              >
                <Input placeholder="account, member, customer" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="相似词（用逗号分隔）"
            name="similarTerms"
            extra="与当前术语含义相近但不同的词"
          >
            <Input placeholder="client, consumer" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
