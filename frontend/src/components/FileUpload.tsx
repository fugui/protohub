/**
 * 文件上传组件
 */

import { useState } from 'react';
import { Upload, message, Select, Button, Form, Space, Card, Modal } from 'antd';
import type { UploadProps } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { RcFile } from 'antd/es/upload/interface';

const { Dragger } = Upload;
const { Option } = Select;

export interface FileUploadProps {
  onUploadSuccess?: () => void;
  onCancel?: () => void;
  visible?: boolean;
}

export function FileUpload({ onUploadSuccess, onCancel, visible = true }: FileUploadProps) {
  const [subsystemId, setSubsystemId] = useState<number | undefined>(undefined);
  const [fileList, setFileList] = useState<RcFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [form] = Form.useForm();

  const subsystems = [
    { id: 1, name: 'user_service' },
    { id: 2, name: 'order_service' },
    { id: 3, name: 'product_service' },
  ];

  const handleUpload = async (options: UploadProps) => {
    const { file } = options;
    setFileList([file]);
  };

  const handleRemove = () => {
    setFileList([]);
  };

  const handleSubmit = async () => {
    if (fileList.length === 0) {
      message.warning('请选择要上传的文件');
      return;
    }

    if (!subsystemId) {
      message.warning('请选择所属子系统');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', fileList[0]);
      formData.append('subsystemId', subsystemId.toString());

      const { createFile } = await import('../services/fileService');
      await createFile(formData);

      message.success('文件上传成功');
      setFileList([]);
      setSubsystemId(undefined);
      form.resetFields();

      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error: any) {
      message.error('文件上传失败');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      open={visible}
      title="上传 Proto 文件"
      onCancel={onCancel}
      footer={[
        <Button onClick={onCancel}>取消</Button>,
        <Button
          type="primary"
          onClick={handleSubmit}
          loading={uploading}
          disabled={fileList.length === 0 || !subsystemId}
        >
          上传
        </Button>,
      ]}
      width={600}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="所属子系统"
          name="subsystemId"
          rules={[{ required: true, message: '请选择子系统' }]}
        >
          <Select
            placeholder="请选择子系统"
            style={{ width: '100%' }}
            onChange={(value: number) => setSubsystemId(value)}
          >
            {subsystems.map((sub) => (
              <Option key={sub.id} value={sub.id}>
                {sub.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="Proto 文件" name="file" required>
          <Dragger
            name="file"
            fileList={fileList}
            customRequest={false}
            beforeUpload={(file, fileList) => {
              const isProto = file.name.endsWith('.proto');
              if (!isProto) {
                message.error('只能上传 .proto 格式的文件');
                return Upload.LIST_IGNORE;
              }
              return true;
            }}
            onRemove={handleRemove}
            onChange={handleUpload}
            multiple={false}
            accept=".proto"
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              点击或拖拽 .proto 文件到此上传
            </p>
          </Dragger>
        </Form.Item>
      </Form>
    </Modal>
  );
}
