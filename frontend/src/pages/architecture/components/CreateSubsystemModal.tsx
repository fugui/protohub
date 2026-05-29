/**
 * 创建子系统弹窗
 */

import { Modal, Form, Input, Select } from 'antd';
import type { ArchitectureLayer } from '../../../services/architectureService';

const { Option } = Select;

interface CreateSubsystemModalProps {
  open: boolean;
  layers: ArchitectureLayer[];
  onOk: (values: {
    name: string;
    layerId: number;
    color?: string;
    columns: number;
  }) => Promise<void>;
  onCancel: () => void;
}

export function CreateSubsystemModal({
  open,
  layers,
  onOk,
  onCancel,
}: CreateSubsystemModalProps) {
  const [form] = Form.useForm();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onOk(values);
      form.resetFields();
    } catch {
      // 表单验证失败，不关闭
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="创建子系统"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="创建"
      cancelText="取消"
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="子系统名称"
          name="name"
          rules={[{ required: true, message: '请输入子系统名称' }]}
        >
          <Input placeholder="如：用户服务子系统" />
        </Form.Item>

        <Form.Item
          label="所属架构层级"
          name="layerId"
          rules={[{ required: true, message: '请选择层级' }]}
        >
          <Select placeholder="选择架构层级">
            {layers.map((layer) => (
              <Option key={layer.id} value={layer.id}>
                L{layer.level} · {layer.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="标识颜色" name="color">
          <Select placeholder="选择颜色（可选）" allowClear>
            <Option value="#1890ff">
              <span style={{ color: '#1890ff' }}>■ 蓝色</span>
            </Option>
            <Option value="#52c41a">
              <span style={{ color: '#52c41a' }}>■ 绿色</span>
            </Option>
            <Option value="#fa8c16">
              <span style={{ color: '#fa8c16' }}>■ 橙色</span>
            </Option>
            <Option value="#722ed1">
              <span style={{ color: '#722ed1' }}>■ 紫色</span>
            </Option>
            <Option value="#eb2f96">
              <span style={{ color: '#eb2f96' }}>■ 粉色</span>
            </Option>
            <Option value="#13c2c2">
              <span style={{ color: '#13c2c2' }}>■ 青色</span>
            </Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="FM 网格列数"
          name="columns"
          initialValue={3}
          tooltip="子系统内功能模块的排列列数"
        >
          <Select>
            <Option value={1}>1 列</Option>
            <Option value={2}>2 列</Option>
            <Option value={3}>3 列</Option>
            <Option value={4}>4 列</Option>
            <Option value={5}>5 列</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
}
