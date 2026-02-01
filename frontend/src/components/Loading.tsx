/**
 * 加载状态组件
 */

import React from 'react';
import { Spin } from 'antd';

interface LoadingProps {
  spinning?: boolean;
  size?: 'small' | 'default' | 'large';
  tip?: string;
  delay?: number;
  fullscreen?: boolean;
}

/**
 * 简单的加载指示器
 */
export const Loading: React.FC<LoadingProps> = ({
  spinning = true,
  size = 'default',
  tip = '加载中...',
  delay = 0,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px 0',
      }}
    >
      <Spin size={size} tip={tip} delay={delay} />
    </div>
  );
};

/**
 * 全屏加载遮罩
 */
export const FullscreenLoading: React.FC<LoadingProps> = ({
  spinning = true,
  tip = '加载中...',
  size = 'large',
}) => {
  if (!spinning) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
      }}
    >
      <Spin size={size} tip={tip} />
    </div>
  );
};

/**
 * 内联加载指示器（用于按钮等小元素）
 */
export const InlineLoading: React.FC = () => {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 8 }}>
      <Spin size="small" />
    </span>
  );
};

/**
 * 空状态加载占位符
 */
export const EmptyLoading: React.FC<{ height?: number }> = ({ height = 200 }) => {
  return (
    <div
      style={{
        height,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 4,
      }}
    >
      <Spin tip="加载中..." />
    </div>
  );
};
