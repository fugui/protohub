/**
 * Git 仓库服务
 */

import axios from 'axios';
import type { GitRepo } from 'protohub-shared';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
const api = axios.create({
    baseURL: BASE_URL,
});

/**
 * 获取认证 token
 */
function getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
}

// 请求拦截器
api.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

/**
 * 创建 Git 仓库配置
 */
export async function createGitRepo(data: {
    name: string;
    repoUrl: string;
    branch?: string;
    username?: string;
    password?: string;
    sshKey?: string;
}): Promise<GitRepo> {
    const response = await api.post('/git-repos', data);
    return response.data;
}

/**
 * 从 Git 仓库导入
 */
export async function importFromGit(repoId: number): Promise<{
    importedCount: number;
    files: any[];
    errors: Array<{ file: string; error: string }>;
}> {
    const response = await api.post(`/git-repos/${repoId}/import`);
    return response.data;
}
