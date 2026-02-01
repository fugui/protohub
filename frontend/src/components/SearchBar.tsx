/**
 * 搜索栏组件
 */

import React from 'react';
import { Input, Select, Space, Button } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';

const { Search } = Input;
const { Option } = Select;

interface SearchBarProps {
  placeholder?: string;
  onSearch: (value: string, filters?: Record<string, any>) => void;
  filters?: {
    key: string;
    label: string;
    options: Array<{ value: string; label: string }>;
  }[];
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  loading?: boolean;
  style?: React.CSSProperties;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = '请输入搜索内容...',
  onSearch,
  filters = [],
  filterValues = {},
  onFilterChange,
  loading = false,
  style,
}) => {
  const handleSearch = (value: string) => {
    onSearch(value, filterValues);
  };

  const handleClear = () => {
    onSearch('', {});
  };

  return (
    <div style={style}>
      <Space.Compact style={{ width: '100%' }}>
        <Search
          placeholder={placeholder}
          allowClear
          enterButton={<SearchOutlined />}
          loading={loading}
          onSearch={handleSearch}
          style={{ flex: 1 }}
        />
        {filters.map((filter) => (
          <Select
            key={filter.key}
            placeholder={filter.label}
            allowClear
            style={{ width: 150 }}
            value={filterValues[filter.key]}
            onChange={(value) => onFilterChange?.(filter.key, value)}
          >
            {filter.options.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        ))}
        {Object.keys(filterValues).length > 0 && (
          <Button icon={<ClearOutlined />} onClick={handleClear}>
            清除筛选
          </Button>
        )}
      </Space.Compact>
    </div>
  );
};

/**
 * 高级搜索栏组件 - 支持多个搜索条件
 */
interface AdvancedSearchBarProps {
  searchFields: {
    key: string;
    label: string;
    type?: 'input' | 'select';
    placeholder?: string;
    options?: Array<{ value: string; label: string }>;
  }[];
  onSearch: (values: Record<string, any>) => void;
  onReset?: () => void;
  loading?: boolean;
}

export const AdvancedSearchBar: React.FC<AdvancedSearchBarProps> = ({
  searchFields,
  onSearch,
  onReset,
  loading = false,
}) => {
  const [searchValues, setSearchValues] = React.useState<Record<string, any>>({});

  const handleFieldChange = (key: string, value: any) => {
    setSearchValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    onSearch(searchValues);
  };

  const handleReset = () => {
    setSearchValues({});
    onReset?.();
  };

  return (
    <div style={{ marginBottom: 16, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        {searchFields.map((field) => (
          <div key={field.key}>
            <span style={{ marginRight: 8 }}>{field.label}:</span>
            {field.type === 'select' ? (
              <Select
                placeholder={field.placeholder || `请选择${field.label}`}
                allowClear
                style={{ width: 200 }}
                value={searchValues[field.key]}
                onChange={(value) => handleFieldChange(field.key, value)}
              >
                {field.options?.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            ) : (
              <Input
                placeholder={field.placeholder || `请输入${field.label}`}
                allowClear
                style={{ width: 200 }}
                value={searchValues[field.key]}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
              />
            )}
          </div>
        ))}
        <Space>
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} loading={loading}>
            搜索
          </Button>
          <Button icon={<ClearOutlined />} onClick={handleReset}>
            重置
          </Button>
        </Space>
      </Space>
    </div>
  );
};
