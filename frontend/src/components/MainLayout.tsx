/**
 * 主布局组件
 */

import { useState } from 'react';
import { Layout, Menu, Button, theme, Dropdown, Space, Avatar } from 'antd';
import {
    DashboardOutlined,
    FileTextOutlined,
    CheckSquareOutlined,
    ApartmentOutlined,
    PartitionOutlined,
    BookOutlined,
    UserOutlined,
    LogoutOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    GithubOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store';
import { logout } from '../services/authService';

const { Header, Sider, Content, Footer } = Layout;

export function MainLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout: storeLogout } = useAuthStore();
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    const handleLogout = () => {
        logout();
        storeLogout();
        navigate('/login');
    };

    const menuItems = [
        {
            key: '/dashboard',
            icon: <DashboardOutlined />,
            label: '仪表盘',
        },
        {
            key: '/files',
            icon: <FileTextOutlined />,
            label: '文件管理',
        },
        {
            key: '/reviews',
            icon: <CheckSquareOutlined />,
            label: '审核工作台',
        },
        {
            key: '/architecture',
            icon: <ApartmentOutlined />,
            label: '架构全景图',
        },
        {
            key: '/function-modules',
            icon: <PartitionOutlined />,
            label: '功能模块管理',
        },
        {
            key: '/vocabulary',
            icon: <BookOutlined />,
            label: '术语与规范',
        },
    ];

    const userMenu = {
        items: [
            {
                key: 'logout',
                icon: <LogoutOutlined />,
                label: '退出登录',
                onClick: handleLogout,
            },
        ],
    };

    // 确定当前选中的菜单项
    const getSelectedKey = () => {
        const path = location.pathname;
        if (path === '/') return '/dashboard';
        // 匹配 /files, /files/new, /files/123 等
        return '/' + path.split('/')[1];
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider trigger={null} collapsible collapsed={collapsed}>
                <div style={{ padding: 16, textAlign: 'center' }}>
                    <h1 style={{ color: 'white', margin: 0, fontSize: collapsed ? 14 : 20, transition: 'font-size 0.2s' }}>
                        {collapsed ? 'PH' : 'ProtoHub'}
                    </h1>
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[getSelectedKey()]}
                    items={menuItems}
                    onClick={({ key }) => navigate(key)}
                />
            </Sider>
            <Layout>
                <Header style={{ padding: 0, background: colorBgContainer, display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 24 }}>
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{
                            fontSize: '16px',
                            width: 64,
                            height: 64,
                        }}
                    />
                    <Space>
                        <Button
                            type="link"
                            icon={<GithubOutlined />}
                            href="https://github.com/fugui/protohub"
                            target="_blank"
                        />
                        <Dropdown menu={userMenu}>
                            <Space style={{ cursor: 'pointer' }}>
                                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
                                <span>{user?.username || '用户'}</span>
                            </Space>
                        </Dropdown>
                    </Space>
                </Header>
                <Content
                    style={{
                        margin: '24px 16px',
                        padding: 24,
                        minHeight: 280,
                        background: colorBgContainer,
                        borderRadius: borderRadiusLG,
                    }}
                >
                    <Outlet />
                </Content>
                <Footer style={{ textAlign: 'center' }}>
                    ProtoHub ©{new Date().getFullYear()} Created by SpecSpace Logic
                </Footer>
            </Layout>
        </Layout>
    );
}
