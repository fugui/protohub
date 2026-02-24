/**
 * 文件详情页面
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Space, message, Input, Tag, Spin, Breadcrumb, Select, Form, Tabs, Upload } from 'antd';
import { LockOutlined, UnlockOutlined, EditOutlined, ArrowLeftOutlined, CheckOutlined, SaveOutlined, InboxOutlined, GithubOutlined, FileTextOutlined, CloudUploadOutlined } from '@ant-design/icons';
import { getFileById, updateFile, lockFile, unlockFile, submitReview, createFile } from '../services/fileService';
import { getAllSubsystems } from '../services/subsystemService';
import { createGitRepo, importFromGit } from '../services/gitService';
import { useAuthStore } from '../store';
import type { ProtoFileDetail, Subsystem } from 'protohub-shared';

const { TextArea } = Input;
const { Dragger } = Upload;

export function FileDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [form] = Form.useForm();
  const [gitForm] = Form.useForm();
  const [uploadForm] = Form.useForm();

  const [file, setFile] = useState<ProtoFileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState('');
  const [, setSubmittingReview] = useState(false);
  const [subsystems, setSubsystems] = useState<Subsystem[]>([]);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [activeTab, setActiveTab] = useState('manual');

  const isNew = id === 'new';

  useEffect(() => {
    if (isNew) {
      setLoading(true);
      getAllSubsystems()
        .then(setSubsystems)
        .catch(() => message.error('获取子系统列表失败'))
        .finally(() => setLoading(false));
    } else {
      fetchFileDetail();
    }
  }, [id]);

  const fetchFileDetail = async () => {
    try {
      setLoading(true);
      const result = await getFileById(Number(id));
      setFile(result);
      setContent(result.content || '');
    } catch (error: any) {
      message.error('获取文件详情失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (content === file?.content) {
      setEditing(false);
      return;
    }

    try {
      const result = await updateFile(Number(id), { content });
      message.success('文件更新成功');
      setFile({ ...file!, ...result });
      setEditing(false);
    } catch (error: any) {
      message.error('文件更新失败');
      console.error(error);
    }
  };

  const handleLock = async () => {
    try {
      await lockFile(Number(id));
      message.success('文件已锁定');
      setFile({ ...file!, locked: true, lockedBy: user || undefined, lockedAt: new Date().toISOString() });
    } catch (error: any) {
      message.error('文件锁定失败');
      console.error(error);
    }
  };

  const handleUnlock = async () => {
    try {
      await unlockFile(Number(id));
      message.success('文件已解锁');
      setFile({ ...file!, locked: false, lockedBy: null, lockedAt: null });
    } catch (error: any) {
      message.error('文件解锁失败');
      console.error(error);
    }
  };

  const handleSubmitReview = async () => {
    try {
      setSubmittingReview(true);
      await submitReview(Number(id));
      message.success('审核请求已提交');
      setFile({ ...file!, status: 'pending_review' });
      setEditing(false);
    } catch (error: any) {
      message.error('提交审核失败');
      console.error(error);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setCreating(true);

      const formData = new FormData();
      formData.append('filename', values.filename);
      formData.append('subsystemId', values.subsystemId);
      formData.append('content', values.content);

      const newFile = await createFile(formData);
      message.success('文件创建成功');
      navigate(`/files/${newFile.id}`);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || '创建文件失败';
      message.error(errorMsg);
      console.error(error);
    } finally {
      setCreating(false);
    }
  };

  const handleUploadCreate = async () => {
    try {
      const values = await uploadForm.validateFields();
      if (!values.file || values.file.length === 0) {
        message.warning('请上传文件');
        return;
      }
      setCreating(true);

      const formData = new FormData();
      formData.append('subsystemId', values.subsystemId);
      // Upload component returns fileList in value
      const fileObj = values.file[0].originFileObj;
      formData.append('file', fileObj);

      const newFile = await createFile(formData);
      message.success('文件上传成功');
      navigate(`/files/${newFile.id}`);
    } catch (error: any) {
      message.error(error.message || '上传文件失败');
      console.error(error);
    } finally {
      setCreating(false);
    }
  };

  const handleGitImport = async () => {
    try {
      const values = await gitForm.validateFields();
      setImporting(true);

      // 1. 创建 Git 仓库配置
      const repo = await createGitRepo({
        name: values.name,
        repoUrl: values.repoUrl,
        branch: values.branch,
      });

      // 2. 执行导入
      const result = await importFromGit(repo.id);

      if (result.errors && result.errors.length > 0) {
        message.warning(`导入完成，成功 ${result.importedCount} 个，失败 ${result.errors.length} 个`);
        console.warn('导入错误:', result.errors);
      } else {
        message.success(`成功导入 ${result.importedCount} 个文件`);
      }

      navigate('/files');
    } catch (error: any) {
      message.error(error.message || 'Git 导入失败');
      console.error(error);
    } finally {
      setImporting(false);
    }
  };

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
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

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (isNew) {
    return (
      <div style={{ padding: 24 }}>
        <Breadcrumb>
          <Breadcrumb.Item onClick={() => navigate('/files')}>文件管理</Breadcrumb.Item>
          <Breadcrumb.Item>新建文件</Breadcrumb.Item>
        </Breadcrumb>

        <Card style={{ marginTop: 16 }}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'manual',
                label: (
                  <span>
                    <FileTextOutlined />
                    手动创建
                  </span>
                ),
                children: (
                  <Form form={form} layout="vertical" onFinish={handleCreate} style={{ marginTop: 16 }}>
                    <Form.Item
                      label="文件名"
                      name="filename"
                      rules={[
                        { required: true, message: '请输入文件名' },
                        { pattern: /^[a-z0-9]+_[a-z0-9]+_[0-9]+\.proto$/, message: '格式：{子系统}_{模块}_{版本}.proto' }
                      ]}
                      extra="例如: user_profile_1.proto"
                    >
                      <Input placeholder="请输入文件名" />
                    </Form.Item>

                    <Form.Item
                      label="所属子系统"
                      name="subsystemId"
                      rules={[{ required: true, message: '请选择子系统' }]}
                    >
                      <Select placeholder="请选择子系统">
                        {subsystems.map((sub) => (
                          <Select.Option key={sub.id} value={sub.id}>
                            {sub.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      label="文件内容"
                      name="content"
                      rules={[{ required: true, message: '请输入文件内容' }]}
                    >
                      <TextArea
                        placeholder="请输入 Proto 文件内容..."
                        autoSize={{ minRows: 15, maxRows: 30 }}
                        style={{ fontFamily: 'monospace' }}
                      />
                    </Form.Item>

                    <Form.Item>
                      <Space>
                        <Button type="primary" htmlType="submit" loading={creating} icon={<SaveOutlined />}>
                          创建
                        </Button>
                        <Button onClick={() => navigate('/files')}>
                          取消
                        </Button>
                      </Space>
                    </Form.Item>
                  </Form>
                ),
              },
              {
                key: 'upload',
                label: (
                  <span>
                    <CloudUploadOutlined />
                    本地上传
                  </span>
                ),
                children: (
                  <Form form={uploadForm} layout="vertical" onFinish={handleUploadCreate} style={{ marginTop: 16 }}>
                    <Form.Item
                      label="所属子系统"
                      name="subsystemId"
                      rules={[{ required: true, message: '请选择子系统' }]}
                    >
                      <Select placeholder="请选择子系统">
                        {subsystems.map((sub) => (
                          <Select.Option key={sub.id} value={sub.id}>
                            {sub.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      label="Proto 文件"
                      name="file"
                      valuePropName="fileList"
                      getValueFromEvent={normFile}
                      rules={[{ required: true, message: '请上传文件' }]}
                    >
                      <Dragger
                        name="file"
                        multiple={false}
                        beforeUpload={() => false}
                        accept=".proto"
                      >
                        <p className="ant-upload-drag-icon">
                          <InboxOutlined />
                        </p>
                        <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                        <p className="ant-upload-hint">仅支持 .proto 格式文件</p>
                      </Dragger>
                    </Form.Item>

                    <Form.Item>
                      <Space>
                        <Button type="primary" htmlType="submit" loading={creating} icon={<CloudUploadOutlined />}>
                          上传
                        </Button>
                        <Button onClick={() => navigate('/files')}>
                          取消
                        </Button>
                      </Space>
                    </Form.Item>
                  </Form>
                ),
              },
              {
                key: 'git',
                label: (
                  <span>
                    <GithubOutlined />
                    Git 导入
                  </span>
                ),
                children: (
                  <Form form={gitForm} layout="vertical" onFinish={handleGitImport} style={{ marginTop: 16 }}>
                    <Form.Item
                      label="仓库名称"
                      name="name"
                      rules={[{ required: true, message: '请输入仓库名称' }]}
                    >
                      <Input placeholder="例如: proto-common" />
                    </Form.Item>

                    <Form.Item
                      label="仓库地址 (URL)"
                      name="repoUrl"
                      rules={[
                        { required: true, message: '请输入 Git 仓库地址' },
                        { type: 'url', message: '请输入有效的 URL' }
                      ]}
                      extra="支持 HTTPS 和 SSH 地址"
                    >
                      <Input placeholder="https://github.com/username/repo.git" />
                    </Form.Item>

                    <Form.Item
                      label="分支"
                      name="branch"
                      initialValue="main"
                    >
                      <Input placeholder="main" />
                    </Form.Item>

                    <Form.Item>
                      <Space>
                        <Button type="primary" htmlType="submit" loading={importing} icon={<GithubOutlined />}>
                          配置并导入
                        </Button>
                        <Button onClick={() => navigate('/files')}>
                          取消
                        </Button>
                      </Space>
                    </Form.Item>
                  </Form>
                ),
              },
            ]}
          />
        </Card>
      </div>
    );
  }

  if (!file) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <p>文件不存在</p>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/files')}>
          返回文件列表
        </Button>
      </div>
    );
  }

  const canEdit = !editing && !file.locked;
  const canLock = !file.locked && user && file.createdBy && (user?.id === file.createdBy.id);
  const canUnlock = file.locked && user && file.lockedBy && (user?.id === file.lockedBy?.id);
  const canSubmitReview = !file.locked && file.status === 'draft';

  const getSubsystemName = (): string => {
    if (typeof file.subsystem === 'object' && file.subsystem !== null) {
      return file.subsystem.name || '-';
    }
    return file.subsystem ? `${file.subsystem}` : '-';
  };

  if (isNew) {
    return (
      <div style={{ padding: 24 }}>
        <Breadcrumb>
          <Breadcrumb.Item onClick={() => navigate('/files')}>文件管理</Breadcrumb.Item>
          <Breadcrumb.Item>新建文件</Breadcrumb.Item>
        </Breadcrumb>

        <Card style={{ marginTop: 16 }}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'manual',
                label: (
                  <span>
                    <FileTextOutlined />
                    手动创建
                  </span>
                ),
                children: (
                  <Form form={form} layout="vertical" onFinish={handleCreate} style={{ marginTop: 16 }}>
                    <Form.Item
                      label="文件名"
                      name="filename"
                      rules={[
                        { required: true, message: '请输入文件名' },
                        { pattern: /^[a-z0-9]+_[a-z0-9]+_[0-9]+\.proto$/, message: '格式：{子系统}_{模块}_{版本}.proto' }
                      ]}
                      extra="例如: user_profile_1.proto"
                    >
                      <Input placeholder="请输入文件名" />
                    </Form.Item>

                    <Form.Item
                      label="所属子系统"
                      name="subsystemId"
                      rules={[{ required: true, message: '请选择子系统' }]}
                    >
                      <Select placeholder="请选择子系统">
                        {subsystems.map((sub) => (
                          <Select.Option key={sub.id} value={sub.id}>
                            {sub.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      label="文件内容"
                      name="content"
                      rules={[{ required: true, message: '请输入文件内容' }]}
                    >
                      <TextArea
                        placeholder="请输入 Proto 文件内容..."
                        autoSize={{ minRows: 15, maxRows: 30 }}
                        style={{ fontFamily: 'monospace' }}
                      />
                    </Form.Item>

                    <Form.Item>
                      <Space>
                        <Button type="primary" htmlType="submit" loading={creating} icon={<SaveOutlined />}>
                          创建
                        </Button>
                        <Button onClick={() => navigate('/files')}>
                          取消
                        </Button>
                      </Space>
                    </Form.Item>
                  </Form>
                ),
              },
              {
                key: 'upload',
                label: (
                  <span>
                    <CloudUploadOutlined />
                    本地上传
                  </span>
                ),
                children: (
                  <Form form={uploadForm} layout="vertical" onFinish={handleUploadCreate} style={{ marginTop: 16 }}>
                    <Form.Item
                      label="所属子系统"
                      name="subsystemId"
                      rules={[{ required: true, message: '请选择子系统' }]}
                    >
                      <Select placeholder="请选择子系统">
                        {subsystems.map((sub) => (
                          <Select.Option key={sub.id} value={sub.id}>
                            {sub.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      label="Proto 文件"
                      name="file"
                      valuePropName="fileList"
                      getValueFromEvent={normFile}
                      rules={[{ required: true, message: '请上传文件' }]}
                    >
                      <Dragger
                        name="file"
                        multiple={false}
                        beforeUpload={() => false}
                        accept=".proto"
                      >
                        <p className="ant-upload-drag-icon">
                          <InboxOutlined />
                        </p>
                        <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                        <p className="ant-upload-hint">仅支持 .proto 格式文件</p>
                      </Dragger>
                    </Form.Item>

                    <Form.Item>
                      <Space>
                        <Button type="primary" htmlType="submit" loading={creating} icon={<CloudUploadOutlined />}>
                          上传
                        </Button>
                        <Button onClick={() => navigate('/files')}>
                          取消
                        </Button>
                      </Space>
                    </Form.Item>
                  </Form>
                ),
              },
              {
                key: 'git',
                label: (
                  <span>
                    <GithubOutlined />
                    Git 导入
                  </span>
                ),
                children: (
                  <Form form={gitForm} layout="vertical" onFinish={handleGitImport} style={{ marginTop: 16 }}>
                    <Form.Item
                      label="仓库名称"
                      name="name"
                      rules={[{ required: true, message: '请输入仓库名称' }]}
                    >
                      <Input placeholder="例如: proto-common" />
                    </Form.Item>

                    <Form.Item
                      label="仓库地址 (URL)"
                      name="repoUrl"
                      rules={[
                        { required: true, message: '请输入 Git 仓库地址' },
                        { type: 'url', message: '请输入有效的 URL' }
                      ]}
                      extra="支持 HTTPS 和 SSH 地址"
                    >
                      <Input placeholder="https://github.com/username/repo.git" />
                    </Form.Item>

                    <Form.Item
                      label="分支"
                      name="branch"
                      initialValue="main"
                    >
                      <Input placeholder="main" />
                    </Form.Item>

                    <Form.Item>
                      <Space>
                        <Button type="primary" htmlType="submit" loading={importing} icon={<GithubOutlined />}>
                          配置并导入
                        </Button>
                        <Button onClick={() => navigate('/files')}>
                          取消
                        </Button>
                      </Space>
                    </Form.Item>
                  </Form>
                ),
              },
            ]}
          />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate('/files')}>文件管理</Breadcrumb.Item>
        <Breadcrumb.Item>文件详情</Breadcrumb.Item>
      </Breadcrumb>

      <Space direction="vertical" size="large" style={{ marginTop: 16 }}>
        <Card
          title={
            <Space>
              <h2 style={{ margin: 0 }}>{file.filename}</h2>
              <Space>
                {getStatusTag(file.status)}
                {file.locked && <Tag color="warning">已锁定</Tag>}
              </Space>
            </Space>
          }
          extra={
            <Space>
              {canEdit && (
                <Button icon={<EditOutlined />} onClick={() => setEditing(true)}>
                  编辑
                </Button>
              )}
              {canLock && (
                <Button icon={<LockOutlined />} onClick={handleLock}>
                  锁定
                </Button>
              )}
              {canUnlock && (
                <Button icon={<UnlockOutlined />} onClick={handleUnlock}>
                  解锁
                </Button>
              )}
              {canSubmitReview && (
                <Button type="primary" icon={<CheckOutlined />} onClick={handleSubmitReview}>
                  提交审核
                </Button>
              )}
            </Space>
          }
        >
          <Descriptions column={2} bordered>
            <Descriptions.Item label="文件名">{file.filename}</Descriptions.Item>
            <Descriptions.Item label="包名">{file.packageName}</Descriptions.Item>
            <Descriptions.Item label="版本">{file.currentVersion}</Descriptions.Item>
            <Descriptions.Item label="状态">{getStatusTag(file.status)}</Descriptions.Item>
            <Descriptions.Item label="锁定状态">
              {file.locked ? (
                <Tag color="warning">已锁定</Tag>
              ) : (
                <Tag>未锁定</Tag>
              )}
            </Descriptions.Item>
            {file.lockedBy && (
              <Descriptions.Item label="锁定人">{file.lockedBy.username}</Descriptions.Item>
            )}
            {file.lockedAt && (
              <Descriptions.Item label="锁定时间">
                {new Date(file.lockedAt).toLocaleString('zh-CN')}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="子系统">{getSubsystemName()}</Descriptions.Item>
            <Descriptions.Item label="Git 仓库">{file.gitRepo?.name || '-'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {new Date(file.createdAt).toLocaleString('zh-CN')}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {new Date(file.updatedAt).toLocaleString('zh-CN')}
            </Descriptions.Item>
            <Descriptions.Item label="创建人">{file.createdBy?.username || '-'}</Descriptions.Item>
          </Descriptions>

          <Card title="文件内容" style={{ marginTop: 16 }}>
            {editing ? (
              <>
                <TextArea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="请输入 Proto 文件内容..."
                  autoSize={{ minRows: 10, maxRows: 30 }}
                  style={{ marginBottom: 16, fontFamily: 'monospace' }}
                />
                <Space>
                  <Button type="primary" onClick={handleEdit}>
                    保存
                  </Button>
                  <Button onClick={() => setEditing(false)}>
                    取消
                  </Button>
                </Space>
              </>
            ) : (
              <pre
                style={{
                  padding: 16,
                  background: '#f5f5f5',
                  borderRadius: 4,
                  overflow: 'auto',
                  fontFamily: 'monospace',
                  fontSize: 14,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {file.content}
              </pre>
            )}
          </Card>
        </Card>
      </Space>
    </div>
  );
}
