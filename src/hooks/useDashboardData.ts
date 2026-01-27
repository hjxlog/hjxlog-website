import { useState, useCallback, useEffect } from 'react';
import { apiRequest, API_BASE_URL } from '@/config/api';
import { toast } from 'sonner';
import type { Work, Blog, Moment } from '@/types';

interface DashboardDataState {
    works: Work[];
    blogs: Blog[];
    moments: Array<Moment & { views?: number }>;
    totalViews: number;
    loading: boolean;
}

interface DashboardDataActions {
    fetchWorks: () => Promise<void>;
    fetchBlogs: () => Promise<void>;
    fetchMoments: () => Promise<void>;
    fetchStats: () => Promise<void>;
    createWork: (workData: Partial<Work>) => Promise<boolean>;
    updateWork: (id: number, workData: Partial<Work>) => Promise<boolean>;
    deleteWork: (id: number) => Promise<boolean>;
    createBlog: (blogData: Partial<Blog>) => Promise<boolean>;
    updateBlog: (id: number, blogData: Partial<Blog>) => Promise<boolean>;
    deleteBlog: (id: number) => Promise<boolean>;
    createMoment: (momentData: { content: string; visibility: 'public' | 'private' }) => Promise<boolean>;
    updateMoment: (id: number, momentData: { content: string; visibility: 'public' | 'private' }) => Promise<boolean>;
    deleteMoment: (id: number) => Promise<boolean>;
    toggleWorkFeatured: (id: number, currentFeatured: boolean) => Promise<void>;
}

export function useDashboardData(): DashboardDataState & DashboardDataActions {
    const [works, setWorks] = useState<Work[]>([]);
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [moments, setMoments] = useState<Array<Moment & { views?: number }>>([]);
    const [totalViews, setTotalViews] = useState(0);
    const [loading, setLoading] = useState(true);

    // ==================== Fetch Functions ====================

    const fetchWorks = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/works?limit=100`);
            const result = await response.json();
            if (result.success && result.data && Array.isArray(result.data.works)) {
                setWorks(result.data.works);
            } else {
                setWorks([]);
            }
        } catch (error) {
            console.error('获取作品数据失败:', error);
            setWorks([]);
        }
    }, []);

    const fetchBlogs = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/blogs?limit=100`);
            const result = await response.json();
            if (result.success) {
                setBlogs(result.data.blogs || []);
            }
        } catch (error) {
            console.error('获取博客数据失败:', error);
        }
    }, []);

    const fetchMoments = useCallback(async () => {
        try {
            const data = await apiRequest('/api/moments?page=1&limit=50&include_private=true');
            if (data.success) {
                setMoments(data.data.moments || []);
            }
        } catch (error) {
            console.error('获取动态列表失败:', error);
        }
    }, []);

    const fetchStats = useCallback(async () => {
        try {
            const response = await apiRequest('/api/admin/stats');
            if (response.success && response.data) {
                setTotalViews(response.data.totalViews || 0);
            }
        } catch (error) {
            console.error('获取统计数据失败:', error);
        }
    }, []);

    // ==================== Works CRUD ====================

    const createWork = useCallback(async (workData: Partial<Work>) => {
        try {
            const result = await apiRequest('/api/works', {
                method: 'POST',
                body: JSON.stringify(workData),
            });
            if (result.success) {
                await fetchWorks();
                toast.success('作品创建成功');
                return true;
            } else {
                toast.error(result.message || '创建作品失败');
                return false;
            }
        } catch (error) {
            console.error('创建作品失败:', error);
            toast.error('创建作品失败');
            return false;
        }
    }, [fetchWorks]);

    const updateWork = useCallback(async (id: number, workData: Partial<Work>) => {
        try {
            const result = await apiRequest(`/api/works/${id}`, {
                method: 'PUT',
                body: JSON.stringify(workData),
            });
            if (result.success) {
                await fetchWorks();
                toast.success('作品更新成功');
                return true;
            } else {
                toast.error(result.message || '更新作品失败');
                return false;
            }
        } catch (error) {
            console.error('更新作品失败:', error);
            toast.error('更新作品失败');
            return false;
        }
    }, [fetchWorks]);

    const deleteWork = useCallback(async (id: number) => {
        try {
            const result = await apiRequest(`/api/works/${id}`, {
                method: 'DELETE',
            });
            if (result.success) {
                await fetchWorks();
                toast.success('作品删除成功');
                return true;
            } else {
                toast.error(result.message || '删除作品失败');
                return false;
            }
        } catch (error) {
            console.error('删除作品失败:', error);
            toast.error('删除作品失败');
            return false;
        }
    }, [fetchWorks]);

    const toggleWorkFeatured = useCallback(async (id: number, currentFeatured: boolean) => {
        try {
            const result = await apiRequest(`/api/works/${id}/featured`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ featured: !currentFeatured })
            });

            if (result.success) {
                toast.success(currentFeatured ? '已取消精选' : '已设为精选');
                fetchWorks();
            } else {
                toast.error('操作失败，请稍后重试');
            }
        } catch (error) {
            console.error('Toggle work featured error:', error);
            toast.error('网络错误，请稍后重试');
        }
    }, [fetchWorks]);

    // ==================== Blogs CRUD ====================

    const createBlog = useCallback(async (blogData: Partial<Blog>) => {
        try {
            const result = await apiRequest('/api/blogs', {
                method: 'POST',
                body: JSON.stringify(blogData),
            });
            if (result.success) {
                await fetchBlogs();
                toast.success('博客创建成功');
                return true;
            } else {
                toast.error(result.message || '创建博客失败');
                return false;
            }
        } catch (error) {
            console.error('创建博客失败:', error);
            toast.error('创建博客失败');
            return false;
        }
    }, [fetchBlogs]);

    const updateBlog = useCallback(async (id: number, blogData: Partial<Blog>) => {
        try {
            const result = await apiRequest(`/api/blogs/${id}`, {
                method: 'PUT',
                body: JSON.stringify(blogData),
            });
            if (result.success) {
                await fetchBlogs();
                toast.success('博客更新成功');
                return true;
            } else {
                toast.error(result.message || '更新博客失败');
                return false;
            }
        } catch (error) {
            console.error('更新博客失败:', error);
            toast.error('更新博客失败');
            return false;
        }
    }, [fetchBlogs]);

    const deleteBlog = useCallback(async (id: number) => {
        try {
            const result = await apiRequest(`/api/blogs/${id}`, {
                method: 'DELETE',
            });
            if (result.success) {
                await fetchBlogs();
                toast.success('博客删除成功');
                return true;
            } else {
                toast.error(result.message || '删除博客失败');
                return false;
            }
        } catch (error) {
            console.error('删除博客失败:', error);
            toast.error('删除博客失败');
            return false;
        }
    }, [fetchBlogs]);

    // ==================== Moments CRUD ====================

    const createMoment = useCallback(async (momentData: { content: string; visibility: 'public' | 'private' }) => {
        try {
            const result = await apiRequest('/api/moments', {
                method: 'POST',
                body: JSON.stringify(momentData),
            });
            if (result.success) {
                await fetchMoments();
                toast.success('动态发布成功');
                return true;
            } else {
                toast.error(result.message || '发布动态失败');
                return false;
            }
        } catch (error) {
            console.error('发布动态失败:', error);
            toast.error('发布动态失败');
            return false;
        }
    }, [fetchMoments]);

    const updateMoment = useCallback(async (id: number, momentData: { content: string; visibility: 'public' | 'private' }) => {
        try {
            const result = await apiRequest(`/api/moments/${id}`, {
                method: 'PUT',
                body: JSON.stringify(momentData),
            });
            if (result.success) {
                await fetchMoments();
                toast.success('动态更新成功');
                return true;
            } else {
                toast.error(result.message || '更新动态失败');
                return false;
            }
        } catch (error) {
            console.error('更新动态失败:', error);
            toast.error('更新动态失败');
            return false;
        }
    }, [fetchMoments]);

    const deleteMoment = useCallback(async (id: number) => {
        try {
            const result = await apiRequest(`/api/moments/${id}`, {
                method: 'DELETE',
            });
            if (result.success) {
                await fetchMoments();
                toast.success('动态删除成功');
                return true;
            } else {
                toast.error(result.message || '删除动态失败');
                return false;
            }
        } catch (error) {
            console.error('删除动态失败:', error);
            toast.error('删除动态失败');
            return false;
        }
    }, [fetchMoments]);

    // ==================== Initialize Data ====================

    const initializeData = useCallback(async () => {
        setLoading(true);
        await Promise.all([fetchWorks(), fetchBlogs(), fetchMoments(), fetchStats()]);
        setLoading(false);
    }, [fetchWorks, fetchBlogs, fetchMoments, fetchStats]);

    useEffect(() => {
        initializeData();
    }, [initializeData]);

    return {
        // State
        works,
        blogs,
        moments,
        totalViews,
        loading,
        // Fetch actions
        fetchWorks,
        fetchBlogs,
        fetchMoments,
        fetchStats,
        // Works CRUD
        createWork,
        updateWork,
        deleteWork,
        toggleWorkFeatured,
        // Blogs CRUD
        createBlog,
        updateBlog,
        deleteBlog,
        // Moments CRUD
        createMoment,
        updateMoment,
        deleteMoment,
    };
}
