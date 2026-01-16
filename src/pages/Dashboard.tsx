import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';
import AdminNav from '@/components/AdminNav';
import DashboardSidebar from '@/components/DashboardSidebar';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';
import { API_BASE_URL, apiRequest } from '@/config/api';

// 导入模块化组件
import OverviewTab from '@/components/dashboard/OverviewTab';
import MomentsTab from '@/components/dashboard/MomentsTab';
import CommentsTab from '@/components/dashboard/CommentsTab';
import WorksTab from '@/components/dashboard/WorksTab';
import BlogsTab from '@/components/dashboard/BlogsTab';
import WorkForm from '@/components/dashboard/WorkForm';
import BlogForm from '@/components/dashboard/BlogForm';
import MomentForm from '@/components/dashboard/MomentForm';
import PhotosTab from '@/components/dashboard/PhotosTab';
import KnowledgeBaseTab from '@/components/dashboard/KnowledgeBaseTab';
import PromptManagementTab from '@/components/dashboard/PromptManagementTab';
import LogManagement from '@/pages/LogManagement';

import { Work, Blog, Comment } from '@/types';

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [works, setWorks] = useState<Work[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);

  const [comments, setComments] = useState<Comment[]>([]);
  const [isWorkFormOpen, setIsWorkFormOpen] = useState(false);
  const [isBlogFormOpen, setIsBlogFormOpen] = useState(false);
  const [currentWork, setCurrentWork] = useState<Work | null>(null);
  const [currentBlog, setCurrentBlog] = useState<Blog | null>(null);

  const [currentComment, setCurrentComment] = useState<Comment | null>(null);
  const [isCommentReplyOpen, setIsCommentReplyOpen] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  // 动态管理相关状态
  const [moments, setMoments] = useState<any[]>([]);
  const [isMomentFormOpen, setIsMomentFormOpen] = useState(false);
  const [currentMoment, setCurrentMoment] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // API调用函数
  const fetchWorks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/works?limit=100`);
      const result = await response.json();
      if (result.success && result.data && Array.isArray(result.data.works)) {
        setWorks(result.data.works);
      } else {
        setWorks([]);
        setError('获取作品数据失败');
      }
    } catch (error) {
      console.error('获取作品数据失败:', error);
      setWorks([]);
      setError('获取作品数据失败');
    }
  };

  const fetchBlogs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blogs?limit=100`);
      const result = await response.json();
      if (result.success) {
        // 修复：服务器返回的数据结构是 {blogs: [...], total, page, limit}
        setBlogs(result.data.blogs || []);
      } else {
        setError('获取博客数据失败');
      }
    } catch (error) {
      console.error('获取博客数据失败:', error);
      setError('获取博客数据失败');
    }
  };





  // 获取所有评论
  const fetchComments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/comments`);
      const result = await response.json();
      if (result.success) {
        setComments(result.data);
      } else {
        toast.error(result.message || '获取评论失败');
      }
    } catch (error) {
      console.error('获取评论失败:', error);
      toast.error('获取评论失败');
    }
  };

  // 回复评论
  const replyToComment = async (commentId: number, replyContent: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/comments/${commentId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ admin_reply: replyContent }),
      });
      const result = await response.json();
      if (result.success) {
        await fetchComments();
        toast.success('回复成功');
        setIsCommentReplyOpen(false);
        setReplyContent('');
        setCurrentComment(null);
        return true;
      } else {
        toast.error(result.message || '回复失败');
        return false;
      }
    } catch (error) {
      console.error('回复评论失败:', error);
      toast.error('回复失败');
      return false;
    }
  };

  // 删除评论
  const deleteComment = async (commentId: number) => {
    return new Promise<void>((resolve) => {
      setConfirmDialog({
        isOpen: true,
        title: '删除评论',
        message: '确定要删除这条评论吗？此操作不可撤销。',
        onConfirm: async () => {
          setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
          try {
            const response = await fetch(`${API_BASE_URL}/api/comments/${commentId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            const result = await response.json();
            if (result.success) {
              await fetchComments();
              toast.success('评论删除成功');
            } else {
              toast.error(result.message || '删除评论失败');
            }
          } catch (error) {
            console.error('删除评论失败:', error);
            toast.error('删除评论失败');
          }
          resolve();
        }
      });
    });
  };

  const createWork = async (workData: Partial<Work>) => {
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
  };

  const updateWork = async (id: number, workData: Partial<Work>) => {
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
  };

  const deleteWork = async (id: number) => {
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
  };

  const createBlog = async (blogData: Partial<Blog>) => {
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
  };

  const updateBlog = async (id: number, blogData: Partial<Blog>) => {
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
  };

  const deleteBlog = async (id: number) => {
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
  };

  // 检查用户权限
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // 动态管理相关函数
  const fetchMoments = async () => {
    try {
      const data = await apiRequest('/api/moments?page=1&limit=50');
      if (data.success) {
        setMoments(data.data.moments || []);
      }
    } catch (error) {
      console.error('获取动态列表失败:', error);
    }
  };

  const createMoment = async (momentData: any) => {
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
  };

  const updateMoment = async (id: number, momentData: any) => {
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
  };

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

  const handleWorkSave = async (workData: Partial<Work>) => {
    let success = false;
    if (currentWork) {
      success = await updateWork(currentWork.id, workData);
    } else {
      success = await createWork(workData);
    }
    return success;
  };

  const handleBlogSave = async (blogData: Partial<Blog>) => {
    let success = false;
    if (currentBlog) {
      success = await updateBlog(currentBlog.id, blogData);
    } else {
      success = await createBlog(blogData);
    }
    return success;
  };

  const openMomentForm = (moment?: any) => {
    if (moment) {
      setCurrentMoment(moment);
    } else {
      setCurrentMoment(null);
    }
    setIsMomentFormOpen(true);
  };

  const closeMomentForm = () => {
    setIsMomentFormOpen(false);
    setCurrentMoment(null);
  };

  const handleMomentSave = async (momentData: any) => {
    let success = false;
    if (currentMoment) {
      success = await updateMoment(currentMoment.id, momentData);
    } else {
      success = await createMoment(momentData);
    }
    return success;
  };

  // 初始化数据
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await Promise.all([fetchWorks(), fetchBlogs(), fetchComments(), fetchMoments()]);
      setLoading(false);
    };
    
    if (user) {
      initData();
    }
  }, [user]);

  // URL参数处理
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, []);

  // 事件处理函数
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleDeleteWork = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: '删除作品',
      message: '确定要删除这个作品吗？此操作无法撤销。',
      onConfirm: async () => {
        await deleteWork(id);
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
      }
    });
  };

  const handleDeleteBlog = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: '删除博客',
      message: '确定要删除这篇博客吗？此操作无法撤销。',
      onConfirm: async () => {
        await deleteBlog(id);
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
      }
    });
  };

  const handleToggleWorkFeatured = async (id: number, currentFeatured: boolean) => {
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
  };

  const openWorkForm = (work?: Work) => {
    if (work) {
      setCurrentWork(work);
    } else {
      setCurrentWork(null);
    }
    setIsWorkFormOpen(true);
  };

  const openBlogForm = (blog?: Blog) => {
    if (blog) {
      setCurrentBlog(blog);
    } else {
      setCurrentBlog(null);
    }
    setIsBlogFormOpen(true);
  };

  const closeWorkForm = () => {
    setIsWorkFormOpen(false);
    setCurrentWork(null);
  };

  const closeBlogForm = () => {
    setIsBlogFormOpen(false);
    setCurrentBlog(null);
  };

  // 博客筛选和分页逻辑
  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = blog.title.toLowerCase().includes(blogSearchQuery.toLowerCase()) ||
                         blog.excerpt.toLowerCase().includes(blogSearchQuery.toLowerCase()) ||
                         blog.tags.some(tag => tag.toLowerCase().includes(blogSearchQuery.toLowerCase()));
    const matchesCategory = !blogSelectedCategory || blog.category === blogSelectedCategory;
    const matchesStatus = !blogSelectedStatus || 
                         (blogSelectedStatus === '已发布' && blog.published) ||
                         (blogSelectedStatus === '草稿' && !blog.published);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalBlogPages = Math.ceil(filteredBlogs.length / blogsPerPage);
  const currentBlogs = filteredBlogs.slice(
    (blogCurrentPage - 1) * blogsPerPage,
    blogCurrentPage * blogsPerPage
  );

  // 获取所有博客分类
  const blogCategories = [...new Set(blogs.map(blog => blog.category))];
  const blogStatuses = ['草稿', '已发布'];

  // 重置分页当筛选条件改变时
  const handleBlogSearch = (query: string) => {
    setBlogSearchQuery(query);
    setBlogCurrentPage(1);
  };

  const handleBlogCategoryFilter = (category: string) => {
    setBlogSelectedCategory(category);
    setBlogCurrentPage(1);
  };

  const handleBlogStatusFilter = (status: string) => {
    setBlogSelectedStatus(status);
    setBlogCurrentPage(1);
  };

  // 作品筛选和分页逻辑
  const filteredWorks = works.filter(work => {
    const matchesSearch = work.title.toLowerCase().includes(workSearchQuery.toLowerCase()) ||
                         work.description.toLowerCase().includes(workSearchQuery.toLowerCase()) ||
                         work.tags.some(tag => tag.toLowerCase().includes(workSearchQuery.toLowerCase()));
    const matchesCategory = !workSelectedCategory || work.category === workSelectedCategory;
    const matchesStatus = !workSelectedStatus || work.status === workSelectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalWorkPages = Math.ceil(filteredWorks.length / worksPerPage);
  const currentWorks = filteredWorks.slice(
    (workCurrentPage - 1) * worksPerPage,
    workCurrentPage * worksPerPage
  );

  // 获取所有作品分类和状态
  const workCategories = [...new Set(works.map(work => work.category))];
  const workStatuses = [...new Set(works.map(work => work.status))];

  // 重置分页当筛选条件改变时
  const handleWorkSearch = (query: string) => {
    setWorkSearchQuery(query);
    setWorkCurrentPage(1);
  };

  const handleWorkCategoryFilter = (category: string) => {
    setWorkSelectedCategory(category);
    setWorkCurrentPage(1);
  };

  const handleWorkStatusFilter = (status: string) => {
    setWorkSelectedStatus(status);
    setWorkCurrentPage(1);
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <AdminNav activeTab={activeTab} setActiveTab={setActiveTab} />
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
      <AdminNav activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex flex-1 max-w-[1920px] mx-auto w-full">
        {/* 左侧边栏 */}
        <DashboardSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        {/* 右侧主内容区域 */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* 概览页面 */}
            {activeTab === 'overview' && (
              <OverviewTab 
                user={user}
                works={works}
                blogs={blogs}
                moments={moments}
                openWorkForm={openWorkForm}
                openBlogForm={openBlogForm}
                openMomentForm={openMomentForm}
                onViewAllLogs={() => setActiveTab('moments')}
              />
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

            {/* 评论管理页面 */}
            {activeTab === 'comments' && (
              <div className="animate-fade-in">
                <CommentsTab 
                  comments={comments}
                  openCommentReply={(comment) => {
                    setCurrentComment(comment);
                    setIsCommentReplyOpen(true);
                    setReplyContent('');
                  }}
                  deleteComment={deleteComment}
                />
              </div>
            )}

            {/* 作品管理页面 */}
            {activeTab === 'works' && (
              <div className="animate-fade-in">
                <WorksTab 
                  works={works}
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
                  blogs={blogs}
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

      {/* 评论回复模态框 */}
      {isCommentReplyOpen && currentComment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-slate-800">回复评论</h3>
                <button
                  onClick={() => setIsCommentReplyOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">博客</label>
                  <p className="text-slate-900">{currentComment.blog_title || '未知博客'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">评论者</label>
                  <p className="text-slate-900">{currentComment.author_name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">原评论内容</label>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-slate-800">{currentComment.content}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">回复内容</label>
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF] resize-none"
                    rows={4}
                    placeholder="请输入回复内容..."
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setIsCommentReplyOpen(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={async () => {
                      if (replyContent.trim()) {
                        const success = await replyToComment(currentComment.id, replyContent);
                        if (success) {
                          setIsCommentReplyOpen(false);
                          setReplyContent('');
                        }
                      }
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    disabled={!replyContent.trim()}
                  >
                    发送回复
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}













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