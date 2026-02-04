/**
 * Proto 编辑器组件（带语法高亮）
 */

import { useState, useEffect, useRef } from 'react';
import { Input, Space, Card, Tag, message, Button } from 'antd';
import { ClearOutlined, CopyOutlined, SaveOutlined } from '@ant-design/icons';

const { TextArea } = Input;

export interface ProtoEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  readOnly?: boolean;
  title?: string;
}

export function ProtoEditor({
  value,
  onChange,
  onSave,
  readOnly = false,
  title = 'Proto 文件编辑器',
}: ProtoEditorProps) {
  const [localValue, setLocalValue] = useState(value);
  const textAreaRef = useRef<any>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Proto 语法高亮关键字
  const keywords = [
    'syntax', 'package', 'import', 'message', 'enum', 'service',
    'option', 'oneof', 'map', 'repeated', 'optional', 'required',
    'reserved', 'bool', 'bytes', 'double', 'float', 'int32', 'int64',
    'uint32', 'uint64', 'sint32', 'sint64', 'fixed32', 'fixed64',
    'sfixed32', 'sfixed64', 'string', 'extensions', 'max', 'default',
    'rpc', 'returns', 'stream',
  ];

  // 简单的语法高亮函数
  const highlightSyntax = (text: string): string => {
    let result = text;

    // 高亮注释
    result = result.replace(/(\/\/.*$)/gm, '<span style="color: #6a9955; font-style: italic;">$1</span>');
    result = result.replace(/(\/\*[\s\S]*?\*\/)/gm, '<span style="color: #6a9955; font-style: italic;">$1</span>');

    // 高亮字符串
    result = result.replace(/"([^"\\]*)"/gm, '<span style="color: #ce9178;">"$1"</span>');
    result = result.replace(/'([^'\\]*)'/gm, '<span style="color: #ce9178;">$1</span>');

    // 高亮数字
    result = result.replace(/\b(\d+)\b/gm, '<span style="color: #d19a66;">$1</span>');

    // 高亮关键字
    keywords.forEach((keyword) => {
      const regex = new RegExp(`\\b(${keyword})\\b`, 'gm');
      result = result.replace(regex, '<span style="color: #d73a49; font-weight: bold;">$1</span>');
    });

    // 高亮标识符（包名、消息名、字段名等）
    result = result.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/gm, '<span style="color: #4facfe;">$1</span>');

    return result;
  };

  const handleScroll = () => {
    if (textAreaRef.current) {
      const textarea = textAreaRef.current.resizableTextArea.textArea;
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(localValue).then(() => {
      message.success('已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败');
    });
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  const handleSave = () => {
    onChange(localValue);
    if (onSave) {
      onSave();
    }
  };

  const getStats = () => {
    const lines = localValue.split('\n').length;
    const chars = localValue.length;
    const messages = (localValue.match(/message\s+\w+/gi) || []).length;
    const enums = (localValue.match(/enum\s+\w+/gi) || []).length;
    const services = (localValue.match(/service\s+\w+/gi) || []).length;

    return [
      { label: '行数', value: lines.toString(), color: 'blue' },
      { label: '字符数', value: chars.toString(), color: 'green' },
      { label: '消息数', value: messages.toString(), color: 'orange' },
      { label: '枚举数', value: enums.toString(), color: 'purple' },
      { label: '服务数', value: services.toString(), color: 'cyan' },
    ];
  };

  const stats = getStats();

  return (
    <Card
      title={
        <Space>
          <span>{title}</span>
          {!readOnly && (
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              style={{ marginLeft: 16 }}
            >
              保存
            </Button>
          )}
        </Space>
      }
    >
      <div
        style={{
          position: 'relative',
          maxHeight: 500,
          overflow: 'auto',
        }}
      >
        <div
          style={{
            position: 'relative',
            backgroundColor: '#f5f5f5',
            borderRadius: 4,
            padding: 16,
            minHeight: 300,
          }}
        >
          <TextArea
            ref={textAreaRef}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onScroll={handleScroll}
            readOnly={readOnly}
            placeholder="// 输入 Proto 文件内容..."
            autoSize={{ minRows: 15 }}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              resize: 'none',
              outline: 'none',
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              fontSize: 14,
              lineHeight: 1.6,
            }}
          />

          {/* 语法高亮预览层 */}
          {!readOnly && (
            <div
              style={{
                position: 'absolute',
                top: 16,
                left: 16,
                right: 16,
                bottom: 16,
                pointerEvents: 'none',
                backgroundColor: '#f5f5f5',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                fontSize: 14,
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                overflow: 'auto',
              }}
              dangerouslySetInnerHTML={{
                __html: highlightSyntax(localValue),
              }}
            />
          )}
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          padding: 12,
          backgroundColor: '#fafafa',
          borderRadius: 4,
        }}
      >
        <Space size="large" wrap>
          <Space>
            <Button icon={<CopyOutlined />} onClick={handleCopy} disabled={!localValue}>
              复制
            </Button>
            <Button icon={<ClearOutlined />} onClick={handleClear} disabled={!localValue}>
              清空
            </Button>
          </Space>

          {stats.map((stat) => (
            <Tag
              key={stat.label}
              color={stat.color as any}
              style={{ fontSize: 12 }}
            >
              {stat.label}: {stat.value}
            </Tag>
          ))}
        </Space>
      </div>
    </Card>
  );
}
