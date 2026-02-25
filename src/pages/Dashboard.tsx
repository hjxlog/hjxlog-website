import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';
import AdminNav, { dashboardTabGroups } from '@/components/AdminNav';
import DashboardSidebar from '@/components/DashboardSidebar';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';
import { API_BASE_URL, apiRequest } from '@/config/api';

// 导入模块化组件
import MomentsTab from '@/components/dashboard/MomentsTab';
import WorksTab from '@/components/dashboard/WorksTab';
import BlogsTab from '@/components/dashboard/BlogsTab';
import WorkForm from '@/components/dashboard/WorkForm';
import BlogForm from '@/components/dashboard/BlogForm';
import MomentForm from '@/components/dashboard/MomentForm';
import PhotosTab from '@/components/dashboard/PhotosTab';
import KnowledgeBaseTab from '@/components/dashboard/KnowledgeBaseTab';
import PromptManagementTab from '@/components/dashboard/PromptManagementTab';
import AISignalTab from '@/components/dashboard/AISignalTab';
import OpenClawReportsTab from '@/components/dashboard/OpenClawReportsTab';
import ExternalTokensTab from '@/components/dashboard/ExternalTokensTab';
import ThoughtsTab from '@/components/dashboard/ThoughtsTab';
import TasksTab from '@/components/dashboard/TasksTab';
import TodayHubTab from '@/components/dashboard/TodayHubTab';
import DailyReportsTab from '@/components/dashboard/DailyReportsTab';
import LogManagement from '@/pages/LogManagement';

import { Work, Blog, Moment } from '@/types';

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('today');
  const [works, setWorks] = useState<Work[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);

  const [isWorkFormOpen, setIsWorkFormOpen] = useState(false);
  const [isBlogFormOpen, setIsBlogFormOpen] = useState(false);
  const [currentWork, setCurrentWork] = useState<Work | null>(null);
  const [currentBlog, setCurrentBlog] = useState<Blog | null>(null);
  const [totalViews, setTotalViews] = useState(0);

  // 动态管理相关状态
  const [moments, setMoments] = useState<Array<Moment & { views?: number }>>([]);
  const [isMomentFormOpen, setIsMomentFormOpen] = useState(false);
  const [currentMoment, setCurrentMoment] = useState<Moment | null>(null);
  
  const [loading, setLoading] = useState(true);

  // 确认对话框状态
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // 日志管理相关状态已简化，移除了统计分析tab

  // 博客分页和筛选状态
  const [blogCurrentPage, setBlogCurrentPage] = useState(1);
  const [blogSearchQuery, setBlogSearchQuery] = useState('');
  const [blogSelectedCategory, setBlogSelectedCategory] = useState('');
  const [blogSelectedStatus, setBlogSelectedStatus] = useState('');
  const blogsPerPage = 5;

  // 作品分页和筛选状态
  const [workCurrentPage, setWorkCurrentPage] = useState(1);
  const [workSearchQuery, setWorkSearchQuery] = useState('');
  const [workSelectedCategory, setWorkSelectedCategory] = useState('');
  const [workSelectedStatus, setWorkSelectedStatus] = useState('');
  const worksPerPage = 6;



  // 表单数据状态
  const validDashboardTabs = useMemo(
    () => new Set(dashboardTabGroups.flatMap((group) => group.tabs.map((tab) => tab.key))),
    []
  );

  const handleTabChange = useCallback((tab: string) => {
    const nextTab = validDashboardTabs.has(tab) ? tab : 'today';
    setActiveTab(nextTab);
  }, [validDashboardTabs]);

  // API调用函数
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
        // 修复：服务器返回的数据结构是 {blogs: [...], total, page, limit}
        setBlogs(result.data.blogs || []);
      }
    } catch (error) {
      console.error('获取博客数据失败:', error);
    }
  }, []);

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

  // 检查用户权限
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // 动态管理相关函数
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

  const deleteMoment = async (id: number) => {
    return new Promise<void>((resolve) => {
      setConfirmDialog({
        isOpen: true,
        title: '删除动态',
        message: '确定要删除这条动态吗？此操作不可撤销。',
        onConfirm: async () => {
          try {
            const result = await apiRequest(`/api/moments/${id}`, {
              method: 'DELETE',
            });
            if (result.success) {
              await fetchMoments();
              toast.success('动态删除成功');
            } else {
              toast.error(result.message || '删除动态失败');
            }
          } catch (error) {
            console.error('删除动态失败:', error);
            toast.error('删除动态失败');
          }
          setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
          resolve();
        }
      });
    });
  };

  const handleWorkSave = useCallback(async (workData: Partial<Work>) => {
    let success = false;
    if (currentWork) {
      success = await updateWork(currentWork.id, workData);
    } else {
      success = await createWork(workData);
    }
    return success;
  }, [createWork, currentWork, updateWork]);

  const handleBlogSave = useCallback(async (blogData: Partial<Blog>) => {
    let success = false;
    if (currentBlog) {
      success = await updateBlog(currentBlog.id, blogData);
    } else {
      success = await createBlog(blogData);
    }
    return success;
  }, [createBlog, currentBlog, updateBlog]);

  const openMomentForm = useCallback((moment?: Moment) => {
    if (moment) {
      setCurrentMoment(moment);
    } else {
      setCurrentMoment(null);
    }
    setIsMomentFormOpen(true);
  }, []);

  const closeMomentForm = useCallback(() => {
    setIsMomentFormOpen(false);
    setCurrentMoment(null);
  }, []);

  const handleMomentSave = useCallback(async (momentData: { content: string; visibility: 'public' | 'private' }) => {
    let success = false;
    if (currentMoment) {
      success = await updateMoment(currentMoment.id, momentData);
    } else {
      success = await createMoment(momentData);
    }
    return success;
  }, [createMoment, currentMoment, updateMoment]);

  // 初始化数据
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await Promise.all([fetchWorks(), fetchBlogs(), fetchMoments(), fetchStats()]);
      setLoading(false);
    };
    
    if (user) {
      initData();
    }
  }, [user, fetchWorks, fetchBlogs, fetchMoments, fetchStats]);

  // URL参数处理
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabFromUrl = urlParams.get('tab');
    if (tabFromUrl && validDashboardTabs.has(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    } else {
      setActiveTab('today');
    }
  }, [validDashboardTabs]);

  // 事件处理函数
  const handleDeleteWork = useCallback(async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: '删除作品',
      message: '确定要删除这个作品吗？此操作无法撤销。',
      onConfirm: async () => {
        await deleteWork(id);
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
      }
    });
  }, [deleteWork]);

  const handleDeleteBlog = useCallback(async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: '删除博客',
      message: '确定要删除这篇博客吗？此操作无法撤销。',
      onConfirm: async () => {
        await deleteBlog(id);
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
      }
    });
  }, [deleteBlog]);

  const handleToggleWorkFeatured = useCallback(async (id: number, currentFeatured: boolean) => {
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
        fetchWorks(); // 重新获取作品列表
      } else {
        toast.error('操作失败，请稍后重试');
      }
    } catch (error) {
      console.error('Toggle work featured error:', error);
      toast.error('网络错误，请稍后重试');
    }
  }, [fetchWorks]);

  const openWorkForm = useCallback((work?: Work) => {
    if (work) {
      setCurrentWork(work);
    } else {
      setCurrentWork(null);
    }
    setIsWorkFormOpen(true);
  }, []);

  const openBlogForm = useCallback((blog?: Blog) => {
    if (blog) {
      setCurrentBlog(blog);
    } else {
      setCurrentBlog(null);
    }
    setIsBlogFormOpen(true);
  }, []);

  const closeWorkForm = useCallback(() => {
    setIsWorkFormOpen(false);
    setCurrentWork(null);
  }, []);

  const closeBlogForm = useCallback(() => {
    setIsBlogFormOpen(false);
    setCurrentBlog(null);
  }, []);

  // 博客筛选和分页逻辑
  const blogSearchLower = useMemo(() => blogSearchQuery.toLowerCase(), [blogSearchQuery]);
  const filteredBlogs = useMemo(() => (
    blogs.filter(blog => {
      const matchesSearch = blog.title.toLowerCase().includes(blogSearchLower) ||
                           blog.excerpt.toLowerCase().includes(blogSearchLower) ||
                           blog.tags.some(tag => tag.toLowerCase().includes(blogSearchLower));
      const matchesCategory = !blogSelectedCategory || blog.category === blogSelectedCategory;
      const matchesStatus = !blogSelectedStatus || 
                           (blogSelectedStatus === '已发布' && blog.published) ||
                           (blogSelectedStatus === '草稿' && !blog.published);
      
      return matchesSearch && matchesCategory && matchesStatus;
    })
  ), [blogs, blogSearchLower, blogSelectedCategory, blogSelectedStatus]);

  const totalBlogPages = useMemo(
    () => Math.ceil(filteredBlogs.length / blogsPerPage),
    [filteredBlogs.length, blogsPerPage]
  );
  const currentBlogs = useMemo(() => (
    filteredBlogs.slice(
      (blogCurrentPage - 1) * blogsPerPage,
      blogCurrentPage * blogsPerPage
    )
  ), [filteredBlogs, blogCurrentPage, blogsPerPage]);

  // 获取所有博客分类
  const blogCategories = useMemo(
    () => [...new Set(blogs.map(blog => blog.category))],
    [blogs]
  );
  const blogStatuses = ['草稿', '已发布'];

  // 重置分页当筛选条件改变时
  const handleBlogSearch = useCallback((query: string) => {
    setBlogSearchQuery(query);
    setBlogCurrentPage(1);
  }, []);

  const handleBlogCategoryFilter = useCallback((category: string) => {
    setBlogSelectedCategory(category);
    setBlogCurrentPage(1);
  }, []);

  const handleBlogStatusFilter = useCallback((status: string) => {
    setBlogSelectedStatus(status);
    setBlogCurrentPage(1);
  }, []);

  // 作品筛选和分页逻辑
  const workSearchLower = useMemo(() => workSearchQuery.toLowerCase(), [workSearchQuery]);
  const filteredWorks = useMemo(() => (
    works.filter(work => {
      const matchesSearch = work.title.toLowerCase().includes(workSearchLower) ||
                           work.description.toLowerCase().includes(workSearchLower) ||
                           work.tags.some(tag => tag.toLowerCase().includes(workSearchLower));
      const matchesCategory = !workSelectedCategory || work.category === workSelectedCategory;
      const matchesStatus = !workSelectedStatus || work.status === workSelectedStatus;
      
      return matchesSearch && matchesCategory && matchesStatus;
    })
  ), [works, workSearchLower, workSelectedCategory, workSelectedStatus]);

  const totalWorkPages = useMemo(
    () => Math.ceil(filteredWorks.length / worksPerPage),
    [filteredWorks.length, worksPerPage]
  );
  const currentWorks = useMemo(() => (
    filteredWorks.slice(
      (workCurrentPage - 1) * worksPerPage,
      workCurrentPage * worksPerPage
    )
  ), [filteredWorks, workCurrentPage, worksPerPage]);

  // 获取所有作品分类和状态
  const workCategories = useMemo(
    () => [...new Set(works.map(work => work.category))],
    [works]
  );
  const workStatuses = useMemo(
    () => [...new Set(works.map(work => work.status))],
    [works]
  );

  // 重置分页当筛选条件改变时
  const handleWorkSearch = useCallback((query: string) => {
    setWorkSearchQuery(query);
    setWorkCurrentPage(1);
  }, []);

  const handleWorkCategoryFilter = useCallback((category: string) => {
    setWorkSelectedCategory(category);
    setWorkCurrentPage(1);
  }, []);

  const handleWorkStatusFilter = useCallback((status: string) => {
    setWorkSelectedStatus(status);
    setWorkCurrentPage(1);
  }, []);

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <AdminNav activeTab={activeTab} setActiveTab={handleTabChange} />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#165DFF] mx-auto mb-4"></div>
              <p className="text-slate-600">加载中...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AdminNav activeTab={activeTab} setActiveTab={handleTabChange} />
      
      <div className="flex flex-1 max-w-[1920px] mx-auto w-full">
        {/* 左侧边栏 */}
        <DashboardSidebar activeTab={activeTab} setActiveTab={handleTabChange} />
        
        {/* 右侧主内容区域 */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <div className="mx-auto space-y-6 max-w-full">
            {/* 今日中心页面 */}
            {activeTab === 'today' && (
              <div className="animate-fade-in">
                <TodayHubTab
                  username={user.username}
                  totalViews={totalViews}
                  works={works}
                  blogs={blogs}
                  moments={moments}
                  onOpenWorkForm={() => openWorkForm()}
                  onOpenBlogForm={() => openBlogForm()}
                  onOpenMomentForm={() => openMomentForm()}
                  onGoMoments={() => handleTabChange('moments')}
                />
              </div>
            )}

            {/* 动态管理页面 */}
            {activeTab === 'moments' && (
              <div className="animate-fade-in">
                <MomentsTab 
                  moments={moments}
                  openMomentForm={openMomentForm}
                  deleteMoment={deleteMoment}
                />
              </div>
            )}

            {/* 作品管理页面 */}
            {activeTab === 'works' && (
              <div className="animate-fade-in">
                <WorksTab 
                  filteredWorks={filteredWorks}
                  currentWorks={currentWorks}
                  workSearchQuery={workSearchQuery}
                  workSelectedCategory={workSelectedCategory}
                  workSelectedStatus={workSelectedStatus}
                  workCategories={workCategories}
                  workStatuses={workStatuses}
                  workCurrentPage={workCurrentPage}
                  totalWorkPages={totalWorkPages}
                  handleWorkSearch={handleWorkSearch}
                  handleWorkCategoryFilter={handleWorkCategoryFilter}
                  handleWorkStatusFilter={handleWorkStatusFilter}
                  setWorkCurrentPage={setWorkCurrentPage}
                  setWorkSearchQuery={setWorkSearchQuery}
                  setWorkSelectedCategory={setWorkSelectedCategory}
                  setWorkSelectedStatus={setWorkSelectedStatus}
                  openWorkForm={openWorkForm}
                  handleDeleteWork={handleDeleteWork}
                  handleToggleWorkFeatured={handleToggleWorkFeatured}
                />
              </div>
            )}

            {/* 博客管理页面 */}
            {activeTab === 'blogs' && (
              <div className="animate-fade-in">
                <BlogsTab 
                  filteredBlogs={filteredBlogs}
                  currentBlogs={currentBlogs}
                  blogSearchQuery={blogSearchQuery}
                  blogSelectedCategory={blogSelectedCategory}
                  blogSelectedStatus={blogSelectedStatus}
                  blogCategories={blogCategories}
                  blogStatuses={blogStatuses}
                  blogCurrentPage={blogCurrentPage}
                  totalBlogPages={totalBlogPages}
                  handleBlogSearch={handleBlogSearch}
                  handleBlogCategoryFilter={handleBlogCategoryFilter}
                  handleBlogStatusFilter={handleBlogStatusFilter}
                  setBlogCurrentPage={setBlogCurrentPage}
                  setBlogSearchQuery={setBlogSearchQuery}
                  setBlogSelectedCategory={setBlogSelectedCategory}
                  setBlogSelectedStatus={setBlogSelectedStatus}
                  openBlogForm={openBlogForm}
                handleDeleteBlog={handleDeleteBlog}
              />
            </div>
          )}

            {/* 摄影管理页面 */}
            {activeTab === 'photos' && (
              <div className="animate-fade-in">
                <PhotosTab />
              </div>
            )}

            {/* 日志管理页面 */}
            {activeTab === 'logs' && (
              <div className="space-y-6 animate-fade-in">
                {/* 日志管理内容 */}
                <LogManagement />
              </div>
            )}

            {/* API Key 管理页面 */}
            {activeTab === 'external-tokens' && (
              <div className="animate-fade-in">
                <ExternalTokensTab />
              </div>
            )}

            {/* 知识库管理页面 */}
            {activeTab === 'openclaw-reports' && (
              <div className="animate-fade-in">
                <OpenClawReportsTab />
              </div>
            )}

            {/* 待办事项页面 */}
            {activeTab === 'tasks' && (
              <div className="animate-fade-in">
                <TasksTab />
              </div>
            )}

            {/* 每日想法页面 */}
            {activeTab === 'thoughts' && (
              <div className="animate-fade-in">
                <ThoughtsTab />
              </div>
            )}

            {/* 日报记录页面 */}
            {activeTab === 'daily-reports' && (
              <div className="animate-fade-in">
                <DailyReportsTab />
              </div>
            )}

            {/* AI 情报雷达页面 */}
            {activeTab === 'ai-signal' && (
              <div className="animate-fade-in">
                <AISignalTab />
              </div>
            )}

            {/* 知识库管理页面 */}
            {activeTab === 'knowledge' && (
              <div className="animate-fade-in">
                <KnowledgeBaseTab />
              </div>
            )}

            {/* 提示词管理页面 */}
            {activeTab === 'prompts' && (
              <div className="animate-fade-in">
                <PromptManagementTab />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 作品编辑表单模态框 */}
      <WorkForm
        isOpen={isWorkFormOpen}
        onClose={closeWorkForm}
        initialData={currentWork}
        onSave={handleWorkSave}
      />

      {/* 博客编辑表单模态框 */}
      <BlogForm
        isOpen={isBlogFormOpen}
        onClose={closeBlogForm}
        initialData={currentBlog}
        onSave={handleBlogSave}
      />

      {/* 动态发布表单模态框 */}
      <MomentForm
        isOpen={isMomentFormOpen}
        onClose={closeMomentForm}
        initialData={currentMoment}
        onSave={handleMomentSave}
      />

      {/* 确认对话框 */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
      />
    </div>
  );
}
