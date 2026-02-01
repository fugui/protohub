/**
 * 错误消息组件
 */

import React from 'react';
import { Alert, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

interface ErrorMessageProps {
  error: Error | string | null;
  onRetry?: () => void;
  showRetry?: boolean;
  closable?: boolean;
  style?: React.CSSProperties;
}

/**
 * 错误消息组件
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onRetry,
  showRetry = true,
  closable = false,
  style,
}) => {
  if (!error) {
    return null;
  }

  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorStack = typeof error === 'object' && error.stack ? error.stack : undefined;

  return (
    <div style={style}>
      <Alert
        message="操作失败"
        description={
          <div>
            <div>{errorMessage}</div>
            {showRetry && onRetry && (
              <div style={{ marginTop: 8 }}>
                <Button type="primary" size="small" icon={<ReloadOutlined />} onClick={onRetry}>
                  重试
                </Button>
              </div>
            )}
          </div>
        }
        type="error"
        closable={closable}
        showIcon
      />
      {errorStack && (
        <details style={{ marginTop: 8 }}>
          <summary style={{ cursor: 'pointer', color: '#999' }}>查看详细信息</summary>
          <pre
            style={{
              marginTop: 8,
              padding: 12,
              backgroundColor: '#f5f5f5',
              borderRadius: 4,
              fontSize: 12,
              overflow: 'auto',
              maxHeight: 200,
            }}
          >
            {errorStack}
          </pre>
        </details>
      )}
    </div>
  );
};

/**
 * 页面级错误占位符
 */
interface PageErrorProps {
  error: Error | string | null;
  onRetry?: () => void;
  showRetry?: boolean;
  title?: string;
}

export const PageError: React.FC<PageErrorProps> = ({
  error,
  onRetry,
  showRetry = true,
  title = '页面加载失败',
}) => {
  if (!error) {
    return null;
  }

  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        padding: 24,
      }}
    >
      <Alert
        message={title}
        description={errorMessage}
        type="error"
        showIcon
        style={{ marginBottom: 16, maxWidth: 500 }}
      />
      {showRetry && onRetry && (
        <Button type="primary" icon={<ReloadOutlined />} onClick={onRetry}>
          重新加载
        </Button>
      )}
    </div>
  );
};

/**
 * 错误边界组件
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode; onReset?: () => void },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <PageError
          error={this.state.error}
          onRetry={this.handleReset}
          title="应用程序错误"
        />
      );
    }

    return this.props.children;
  }
}
