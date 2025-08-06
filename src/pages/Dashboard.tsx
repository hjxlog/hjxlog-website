import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';
import RichTextEditor from '@/components/RichTextEditor';
import AdminNav from '@/components/AdminNav';
import { toast } from 'sonner';
import { API_BASE_URL, apiRequest } from '@/config/api';

interface Work {
  id: number;
  title: string;
  description: string;
  content?: string;
  category: string;
  status: string;
  tags: string[];
  technologies: string[];
  project_url: string;
  github_url: string;
  cover_image: string;
  screenshots?: string[];
  features?: string[];
  challenges?: string[];
  featured: boolean;
  created_at: string;
  updated_at: string;
  date?: string;
}

interface Blog {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  published: boolean;
  featured: boolean;
  cover_image?: string;
  views: number;
  likes: number;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  replied: boolean;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  updated_at: string;
}

interface Comment {
  id: number;
  blog_id: number;
  author_name: string;
  author_email?: string;
  content: string;
  admin_reply?: string;
  admin_reply_at?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  updated_at: string;
  blog_title?: string;
}

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [works, setWorks] = useState<Work[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isWorkFormOpen, setIsWorkFormOpen] = useState(false);
  const [isBlogFormOpen, setIsBlogFormOpen] = useState(false);
  const [currentWork, setCurrentWork] = useState<Work | null>(null);
  const [currentBlog, setCurrentBlog] = useState<Blog | null>(null);
  const [currentMessage, setCurrentMessage] = useState<Message | null>(null);
  const [isMessageDetailOpen, setIsMessageDetailOpen] = useState(false);
  const [currentComment, setCurrentComment] = useState<Comment | null>(null);
  const [isCommentReplyOpen, setIsCommentReplyOpen] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // 消息分页和筛选状态
  const [messageCurrentPage, setMessageCurrentPage] = useState(1);
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [messageSelectedStatus, setMessageSelectedStatus] = useState('');
  const messagesPerPage = 10;


  // 表单数据状态
  const [workFormData, setWorkFormData] = useState({
    title: '',
    description: '',
    content: '',
    category: '',
    status: 'active',
    tags: '',
    technologies: '',
    project_url: '',
    github_url: '',
    cover_image: '',
    screenshots: '',
    features: '',
    challenges: '',
    featured: false
  });

  const [blogFormData, setBlogFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: '',
    tags: '',
    published: false,
    featured: false,
    cover_image: ''
  });

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

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages?limit=100`);
      const result = await response.json();
      if (result.success) {
        setMessages(result.data.messages || []);
      } else {
        setError('获取消息数据失败');
      }
    } catch (error) {
      console.error('获取消息数据失败:', error);
      setError('获取消息数据失败');
    }
  };

  const updateMessageStatus = async (messageId: number, status: string) => {
    try {
      const result = await apiRequest(`/api/messages/${messageId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      if (result.success) {
        await fetchMessages();
        toast.success('消息状态更新成功');
        return true;
      } else {
        toast.error(result.message || '更新消息状态失败');
        return false;
      }
    } catch (error) {
      console.error('更新消息状态失败:', error);
      toast.error('更新消息状态失败');
      return false;
    }
  };



  const deleteMessage = async (messageId: number) => {
    try {
      const result = await apiRequest(`/api/messages/${messageId}`, {
        method: 'DELETE',
      });
      if (result.success) {
        await fetchMessages();
        toast.success('消息删除成功');
        return true;
      } else {
        toast.error(result.message || '删除消息失败');
        return false;
      }
    } catch (error) {
      console.error('删除消息失败:', error);
      toast.error('删除消息失败');
      return false;
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
        return true;
      } else {
        toast.error(result.message || '删除评论失败');
        return false;
      }
    } catch (error) {
      console.error('删除评论失败:', error);
      toast.error('删除评论失败');
      return false;
    }
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

  // 初始化数据
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await Promise.all([fetchWorks(), fetchBlogs(), fetchMessages(), fetchComments()]);
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
    if (window.confirm('确定要删除这个作品吗？')) {
      await deleteWork(id);
    }
  };

  const handleDeleteBlog = async (id: number) => {
    if (window.confirm('确定要删除这篇博客吗？')) {
      await deleteBlog(id);
    }
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
      setWorkFormData({
        title: work.title,
        description: work.description,
        content: work.content || '',
        category: work.category,
        status: work.status,
        tags: work.tags.join(', '),
        technologies: work.technologies.join(', '),
        project_url: work.project_url,
        github_url: work.github_url,
        cover_image: work.cover_image,
        screenshots: work.screenshots?.join(', ') || '',
        features: work.features?.join(', ') || '',
        challenges: work.challenges?.join(', ') || '',
        featured: work.featured
      });
    } else {
      setCurrentWork(null);
      setWorkFormData({
        title: '',
        description: '',
        content: '',
        category: '',
        status: 'active',
        tags: '',
        technologies: '',
        project_url: '',
        github_url: '',
        cover_image: '',
        screenshots: '',
        features: '',
        challenges: '',
        featured: false
      });
    }
    setIsWorkFormOpen(true);
  };

  const openBlogForm = (blog?: Blog) => {
    if (blog) {
      setCurrentBlog(blog);
      setBlogFormData({
        title: blog.title,
        content: blog.content,
        excerpt: blog.excerpt,
        category: blog.category,
        tags: blog.tags.join(', '),
        published: blog.published,
        featured: blog.featured,
        cover_image: blog.cover_image || ''
      });
    } else {
      setCurrentBlog(null);
      setBlogFormData({
        title: '',
        content: '',
        excerpt: '',
        category: '',
        tags: '',
        published: false,
        featured: false,
        cover_image: ''
      });
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

  const handleBlogInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBlogFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBlogContentChange = (content: string) => {
    setBlogFormData(prev => ({ ...prev, content }));
  };

  const handleBlogFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const blogData = {
      title: blogFormData.title,
      content: blogFormData.content,
      excerpt: blogFormData.excerpt,
      category: blogFormData.category,
      tags: blogFormData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      published: blogFormData.published,
      featured: blogFormData.featured,
      cover_image: blogFormData.cover_image
    };

    let success = false;
    if (currentBlog) {
      success = await updateBlog(currentBlog.id, blogData);
    } else {
      success = await createBlog(blogData);
    }

    if (success) {
      closeBlogForm();
    }
  };

  const handleWorkInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setWorkFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleWorkDescriptionChange = (value: string) => {
    setWorkFormData(prev => ({ ...prev, description: value }));
  };

  const handleWorkFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const workData = {
      title: workFormData.title,
      description: workFormData.description,
      content: workFormData.content,
      category: workFormData.category,
      status: workFormData.status,
      tags: workFormData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      technologies: workFormData.technologies.split(',').map(tech => tech.trim()).filter(tech => tech),
      project_url: workFormData.project_url,
      github_url: workFormData.github_url,
      cover_image: workFormData.cover_image,
      screenshots: workFormData.screenshots.split(',').map(url => url.trim()).filter(url => url),
      features: workFormData.features.split(',').map(feature => feature.trim()).filter(feature => feature),
      challenges: workFormData.challenges.split(',').map(challenge => challenge.trim()).filter(challenge => challenge),
      featured: workFormData.featured
    };

    let success = false;
    if (currentWork) {
      success = await updateWork(currentWork.id, workData);
    } else {
      success = await createWork(workData);
    }

    if (success) {
      closeWorkForm();
    }
  };

  const renderWorkStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = {
      'active': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'archived': 'bg-gray-100 text-gray-800'
    };
    
    const statusLabels: { [key: string]: string } = {
      'active': '进行中',
      'completed': '已完成',
      'archived': '已归档'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  const renderBlogStatusBadge = (published: boolean) => {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
      }`}>
        {published ? '已发布' : '草稿'}
      </span>
    );
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AdminNav activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="container mx-auto px-4 py-8 w-full">
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
    <div className="min-h-screen bg-slate-50">
      {/* 使用管理员导航组件 */}
      <AdminNav activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="container mx-auto px-4 py-8 w-full">
        {/* 概览页面 */}
        {activeTab === 'overview' && (
          <div>
            {/* 控制台页面 */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-800 mb-2">控制台</h2>
              <p className="text-slate-600">欢迎回来，{user.username}！</p>
            </div>

            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-sm">总作品数</p>
                    <p className="text-2xl font-bold text-slate-800">{works.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-briefcase text-blue-600"></i>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-sm">总博客数</p>
                    <p className="text-2xl font-bold text-slate-800">{blogs.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-blog text-green-600"></i>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-sm">已发布博客</p>
                    <p className="text-2xl font-bold text-slate-800">
                      {blogs.filter(blog => blog.published).length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-eye text-purple-600"></i>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-sm">总浏览量</p>
                    <p className="text-2xl font-bold text-slate-800">
                      {blogs.reduce((total, blog) => total + blog.views, 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-chart-line text-orange-600"></i>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-sm">未读消息</p>
                    <p className="text-2xl font-bold text-slate-800">
                      {messages.filter(msg => msg.status === 'unread').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-envelope text-red-600"></i>
                  </div>
                </div>
              </div>
            </div>

            {/* 快速操作 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">快速操作</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => openWorkForm()}
                  className="p-4 border-2 border-dashed border-slate-200 rounded-lg hover:border-[#165DFF] hover:bg-[#165DFF]/5 transition-colors text-center"
                >
                  <i className="fas fa-plus text-2xl text-slate-400 mb-2"></i>
                  <p className="text-slate-600">添加新作品</p>
                </button>
                
                <button
                  onClick={() => openBlogForm()}
                  className="p-4 border-2 border-dashed border-slate-200 rounded-lg hover:border-[#165DFF] hover:bg-[#165DFF]/5 transition-colors text-center"
                >
                  <i className="fas fa-plus text-2xl text-slate-400 mb-2"></i>
                  <p className="text-slate-600">添加新博客</p>
                </button>
                
                <button
                  onClick={() => navigate('/')}
                  className="p-4 border-2 border-dashed border-slate-200 rounded-lg hover:border-[#165DFF] hover:bg-[#165DFF]/5 transition-colors text-center"
                >
                  <i className="fas fa-home text-2xl text-slate-400 mb-2"></i>
                  <p className="text-slate-600">查看网站</p>
                </button>
                
                <button
                  onClick={() => navigate('/profile')}
                  className="p-4 border-2 border-dashed border-slate-200 rounded-lg hover:border-[#165DFF] hover:bg-[#165DFF]/5 transition-colors text-center"
                >
                  <i className="fas fa-user text-2xl text-slate-400 mb-2"></i>
                  <p className="text-slate-600">个人设置</p>
                </button>
              </div>
            </div>
          </div>
        )}

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
                  <label className="block text-sm font-medium text-slate-700 mb-1">博客文章</label>
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

        {/* 评论管理页面 */}
        {activeTab === 'comments' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">评论管理</h2>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-slate-600">
                  未回复评论: <span className="font-semibold text-orange-600">{comments.filter(comment => !comment.admin_reply).length}</span>
                </span>
              </div>
            </div>

            {/* 评论列表 */}
            <div className="space-y-4">
              {comments.length > 0 ? (
                comments.map(comment => (
                  <div key={comment.id} className={`bg-white rounded-xl p-6 shadow-sm border-l-4 ${
                    !comment.admin_reply ? 'border-orange-500 bg-orange-50/30' : 'border-green-500'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-800">{comment.blog_title || '未知博客'}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            !comment.admin_reply ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {!comment.admin_reply ? '待回复' : '已回复'}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-slate-600 mb-3">
                          <span><strong>评论者:</strong> {comment.author_name}</span>
                          {comment.author_email && (
                            <span><strong>邮箱:</strong> {comment.author_email}</span>
                          )}
                          <span><strong>时间:</strong> {new Date(comment.created_at).toLocaleString('zh-CN')}</span>
                        </div>
                        
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-slate-700 mb-1">评论内容</label>
                          <div className="bg-slate-50 p-3 rounded-lg">
                            <p className="text-slate-800 text-sm">{comment.content}</p>
                          </div>
                        </div>
                        
                        {comment.admin_reply && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <label className="block text-sm font-medium text-green-700 mb-1">管理员回复</label>
                            <p className="text-sm text-green-800">{comment.admin_reply}</p>
                            <p className="text-xs text-green-600 mt-1">
                              回复时间: {comment.admin_reply_at ? new Date(comment.admin_reply_at).toLocaleString('zh-CN') : ''}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {!comment.admin_reply && (
                          <button
                            onClick={() => {
                              setCurrentComment(comment);
                              setIsCommentReplyOpen(true);
                              setReplyContent('');
                            }}
                            className="text-gray-400 hover:text-blue-500 transition-colors p-2"
                            title="回复评论"
                          >
                            💬
                          </button>
                        )}
                        <button
                          onClick={() => deleteComment(comment.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-2"
                          title="删除评论"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-xl p-12 shadow-sm text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">还没有评论</h3>
                  <p className="text-gray-600">当有用户在博客文章下发表评论时，它们会显示在这里</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 作品管理页面 */}
        {activeTab === 'works' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">作品管理</h2>
              <button
                onClick={() => openWorkForm()}
                className="px-4 py-2 bg-[#165DFF] text-white rounded-lg hover:bg-[#165DFF]/90 transition-colors"
              >
                <i className="fas fa-plus mr-2"></i>添加作品
              </button>
            </div>

            {/* 搜索和筛选区域 */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* 搜索框 */}
                <div className="md:col-span-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="搜索作品标题、描述或标签..."
                      value={workSearchQuery}
                      onChange={(e) => handleWorkSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      🔍
                    </span>
                  </div>
                </div>

                {/* 分类筛选 */}
                <div>
                  <select
                    value={workSelectedCategory}
                    onChange={(e) => handleWorkCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">所有分类</option>
                    {workCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* 状态筛选 */}
                <div>
                  <select
                    value={workSelectedStatus}
                    onChange={(e) => handleWorkStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">所有状态</option>
                    {workStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 统计信息 */}
              <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                <span>
                  显示 {currentWorks.length} 条，共 {filteredWorks.length} 条作品
                  {workSearchQuery && ` (搜索: "${workSearchQuery}")`}
                  {workSelectedCategory && ` (分类: ${workSelectedCategory})`}
                  {workSelectedStatus && ` (状态: ${workSelectedStatus})`}
                </span>
                {(workSearchQuery || workSelectedCategory || workSelectedStatus) && (
                  <button
                    onClick={() => {
                      setWorkSearchQuery('');
                      setWorkSelectedCategory('');
                      setWorkSelectedStatus('');
                      setWorkCurrentPage(1);
                    }}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    清除筛选
                  </button>
                )}
              </div>
            </div>

            {/* 作品列表 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentWorks.length > 0 ? (
                currentWorks.map(work => (
                  <div key={work.id} className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-slate-800">{work.title}</h3>
                      <div className="flex space-x-2">
                         <button
                           onClick={() => handleToggleWorkFeatured(work.id, work.featured)}
                           className={`transition-colors p-1 ${
                             work.featured 
                               ? 'text-yellow-500 hover:text-yellow-600' 
                               : 'text-gray-400 hover:text-yellow-500'
                           }`}
                           title={work.featured ? '取消精选' : '设为精选'}
                         >
                           {work.featured ? '⭐' : '☆'}
                         </button>
                         <button
                           onClick={() => openWorkForm(work)}
                           className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                           title="编辑"
                         >
                           ✏️
                         </button>
                         <button
                           onClick={() => handleDeleteWork(work.id)}
                           className="text-gray-400 hover:text-red-500 transition-colors p-1"
                           title="删除"
                         >
                           🗑️
                         </button>
                       </div>
                    </div>
                    
                    <p className="text-slate-600 text-sm mb-3">{work.description}</p>
                    
                    <div className="flex items-center justify-between text-sm text-slate-500 mb-3">
                       <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded">{work.category}</span>
                       <span className={`px-2 py-1 rounded ${
                         work.status === 'active' ? 'bg-green-100 text-green-600' :
                         work.status === 'completed' ? 'bg-blue-100 text-blue-600' :
                         'bg-gray-100 text-gray-600'
                       }`}>
                         {work.status}
                       </span>
                     </div>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {work.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <p className="text-xs text-slate-400">{work.date || work.created_at}</p>
                  </div>
                ))
              ) : (
                <div className="col-span-full bg-white rounded-xl p-12 shadow-sm text-center">
                  <div className="text-6xl mb-4">💼</div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">
                    {workSearchQuery || workSelectedCategory || workSelectedStatus 
                      ? '没有找到匹配的作品' 
                      : '还没有作品'}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {workSearchQuery || workSelectedCategory || workSelectedStatus 
                      ? '尝试调整搜索条件或筛选器' 
                      : '开始添加你的第一个作品吧！'}
                  </p>
                  {!(workSearchQuery || workSelectedCategory || workSelectedStatus) && (
                    <button
                       onClick={() => openWorkForm()}
                       className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                     >
                       ➕ 添加作品
                     </button>
                  )}
                </div>
              )}
            </div>

            {/* 分页控制 */}
            {totalWorkPages > 1 && (
              <div className="mt-8 flex items-center justify-center space-x-2">
                <button
                  onClick={() => setWorkCurrentPage(Math.max(1, workCurrentPage - 1))}
                  disabled={workCurrentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ← 上一页
                </button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: totalWorkPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setWorkCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg transition-colors ${
                        page === workCurrentPage
                          ? 'bg-blue-500 text-white'
                           : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => setWorkCurrentPage(Math.min(totalWorkPages, workCurrentPage + 1))}
                  disabled={workCurrentPage === totalWorkPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  下一页 →
                </button>
              </div>
            )}
          </div>
        )}

        {/* 博客管理页面 */}
        {activeTab === 'blogs' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">博客管理</h2>
              <button
                onClick={() => openBlogForm()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                ➕ 写博客
              </button>
            </div>

            {/* 搜索和筛选区域 */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* 搜索框 */}
                <div className="md:col-span-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="搜索博客标题、内容或标签..."
                      value={blogSearchQuery}
                      onChange={(e) => handleBlogSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      🔍
                    </span>
                  </div>
                </div>

                {/* 分类筛选 */}
                <div>
                  <select
                    value={blogSelectedCategory}
                    onChange={(e) => handleBlogCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">所有分类</option>
                    {blogCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* 状态筛选 */}
                <div>
                  <select
                    value={blogSelectedStatus}
                    onChange={(e) => handleBlogStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">所有状态</option>
                    {blogStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 统计信息 */}
              <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                <span>
                  显示 {currentBlogs.length} 条，共 {filteredBlogs.length} 条博客
                  {blogSearchQuery && ` (搜索: "${blogSearchQuery}")`}
                  {blogSelectedCategory && ` (分类: ${blogSelectedCategory})`}
                  {blogSelectedStatus && ` (状态: ${blogSelectedStatus})`}
                </span>
                {(blogSearchQuery || blogSelectedCategory || blogSelectedStatus) && (
                  <button
                    onClick={() => {
                      setBlogSearchQuery('');
                      setBlogSelectedCategory('');
                      setBlogSelectedStatus('');
                      setBlogCurrentPage(1);
                    }}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    清除筛选
                  </button>
                )}
              </div>
            </div>

            {/* 博客列表 */}
            <div className="space-y-4">
              {currentBlogs.length > 0 ? (
                currentBlogs.map(blog => (
                <div key={blog.id} className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-800">{blog.title}</h3>
                        {renderBlogStatusBadge(blog.published)}
                      </div>
                      
                      <p className="text-slate-600 text-sm mb-3">{blog.excerpt}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-slate-500">
                        <span>{blog.category}</span>
                        <span>👁 {blog.views || 0}</span>
                        <span>❤️ {blog.likes || 0}</span>
                        {blog.created_at && <span>{new Date(blog.created_at).toLocaleDateString()}</span>}
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mt-3">
                        {blog.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => openBlogForm(blog)}
                        className="text-gray-400 hover:text-blue-500 transition-colors p-2"
                        title="编辑"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteBlog(blog.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-2"
                        title="删除"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))
              ) : (
                <div className="bg-white rounded-xl p-12 shadow-sm text-center">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">
                    {blogSearchQuery || blogSelectedCategory || blogSelectedStatus 
                      ? '没有找到匹配的博客' 
                      : '还没有博客'}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {blogSearchQuery || blogSelectedCategory || blogSelectedStatus 
                      ? '尝试调整搜索条件或筛选器' 
                      : '开始写你的第一篇博客吧！'}
                  </p>
                  {!(blogSearchQuery || blogSelectedCategory || blogSelectedStatus) && (
                    <button
                      onClick={() => openBlogForm()}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      ➕ 写博客
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 分页控制 */}
            {totalBlogPages > 1 && (
              <div className="mt-8 flex items-center justify-center space-x-2">
                <button
                  onClick={() => setBlogCurrentPage(Math.max(1, blogCurrentPage - 1))}
                  disabled={blogCurrentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ← 上一页
                </button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: totalBlogPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setBlogCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg transition-colors ${
                        page === blogCurrentPage
                          ? 'bg-blue-500 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => setBlogCurrentPage(Math.min(totalBlogPages, blogCurrentPage + 1))}
                  disabled={blogCurrentPage === totalBlogPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  下一页 →
                </button>
              </div>
            )}
          </div>
        )}

        {/* 消息管理页面 */}
        {activeTab === 'messages' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">消息管理</h2>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-slate-600">
                  未读消息: <span className="font-semibold text-red-600">{messages.filter(msg => msg.status === 'unread').length}</span>
                </span>
              </div>
            </div>

            {/* 搜索和筛选区域 */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 搜索框 */}
                <div className="md:col-span-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="搜索发件人、邮箱、主题或内容..."
                      value={messageSearchQuery}
                      onChange={(e) => setMessageSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      🔍
                    </span>
                  </div>
                </div>

                {/* 状态筛选 */}
                <div>
                  <select
                    value={messageSelectedStatus}
                    onChange={(e) => setMessageSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">所有状态</option>
                    <option value="unread">未读</option>
                    <option value="read">已读</option>
                    <option value="replied">已回复</option>
                  </select>
                </div>
              </div>

              {/* 统计信息 */}
              <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                <span>
                  显示 {Math.min(messagesPerPage, messages.filter(msg => {
                    const matchesSearch = msg.name.toLowerCase().includes(messageSearchQuery.toLowerCase()) ||
                                         msg.email.toLowerCase().includes(messageSearchQuery.toLowerCase()) ||
                                         msg.subject.toLowerCase().includes(messageSearchQuery.toLowerCase()) ||
                                         msg.message.toLowerCase().includes(messageSearchQuery.toLowerCase());
                    const matchesStatus = !messageSelectedStatus || msg.status === messageSelectedStatus;
                    return matchesSearch && matchesStatus;
                  }).length)} 条，共 {messages.filter(msg => {
                    const matchesSearch = msg.name.toLowerCase().includes(messageSearchQuery.toLowerCase()) ||
                                         msg.email.toLowerCase().includes(messageSearchQuery.toLowerCase()) ||
                                         msg.subject.toLowerCase().includes(messageSearchQuery.toLowerCase()) ||
                                         msg.message.toLowerCase().includes(messageSearchQuery.toLowerCase());
                    const matchesStatus = !messageSelectedStatus || msg.status === messageSelectedStatus;
                    return matchesSearch && matchesStatus;
                  }).length} 条消息
                  {messageSearchQuery && ` (搜索: "${messageSearchQuery}")`}
                  {messageSelectedStatus && ` (状态: ${messageSelectedStatus === 'unread' ? '未读' : messageSelectedStatus === 'read' ? '已读' : '已回复'})`}
                </span>
                {(messageSearchQuery || messageSelectedStatus) && (
                  <button
                    onClick={() => {
                      setMessageSearchQuery('');
                      setMessageSelectedStatus('');
                      setMessageCurrentPage(1);
                    }}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    清除筛选
                  </button>
                )}
              </div>
            </div>

            {/* 消息列表 */}
            <div className="space-y-4">
              {(() => {
                const filteredMessages = messages.filter(msg => {
                  const matchesSearch = msg.name.toLowerCase().includes(messageSearchQuery.toLowerCase()) ||
                                       msg.email.toLowerCase().includes(messageSearchQuery.toLowerCase()) ||
                                       msg.subject.toLowerCase().includes(messageSearchQuery.toLowerCase()) ||
                                       msg.message.toLowerCase().includes(messageSearchQuery.toLowerCase());
                  const matchesStatus = !messageSelectedStatus || msg.status === messageSelectedStatus;
                  return matchesSearch && matchesStatus;
                });
                
                const totalMessagePages = Math.ceil(filteredMessages.length / messagesPerPage);
                const currentMessages = filteredMessages.slice(
                  (messageCurrentPage - 1) * messagesPerPage,
                  messageCurrentPage * messagesPerPage
                );

                return currentMessages.length > 0 ? (
                  <>
                    {currentMessages.map(message => (
                      <div key={message.id} className={`bg-white rounded-xl p-6 shadow-sm border-l-4 ${
                        message.status === 'unread' ? 'border-red-500 bg-red-50/30' :
                        message.status === 'replied' ? 'border-green-500' : 'border-blue-500'
                      }`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-slate-800">{message.subject}</h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                message.status === 'unread' ? 'bg-red-100 text-red-800' :
                                message.status === 'replied' ? 'bg-green-100 text-green-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {message.status === 'unread' ? '未读' :
                                 message.status === 'replied' ? '已回复' : '已读'}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-4 text-sm text-slate-600 mb-3">
                              <span><strong>发件人:</strong> {message.name}</span>
                              <span><strong>邮箱:</strong> {message.email}</span>
                              <span><strong>时间:</strong> {new Date(message.created_at).toLocaleString('zh-CN')}</span>
                            </div>
                            
                            <p className="text-slate-700 text-sm mb-3 line-clamp-3">{message.message}</p>
                            
                            {message.replied && (
                              <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-sm text-green-800">✓ 已回复</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => {
                                setCurrentMessage(message);
                                setIsMessageDetailOpen(true);
                                if (message.status === 'unread') {
                                  updateMessageStatus(message.id, 'read');
                                }
                              }}
                              className="text-gray-400 hover:text-blue-500 transition-colors p-2"
                              title="查看详情"
                            >
                              👁️
                            </button>
                            {!message.replied && (
                              <button
                                onClick={() => updateMessageStatus(message.id, 'replied')}
                                className="text-gray-400 hover:text-green-500 transition-colors p-2"
                                title="标记已回复"
                              >
                                ✅
                              </button>
                            )}
                            <button
                              onClick={() => deleteMessage(message.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors p-2"
                              title="删除"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* 分页控制 */}
                    {totalMessagePages > 1 && (
                      <div className="mt-8 flex items-center justify-center space-x-2">
                        <button
                          onClick={() => setMessageCurrentPage(Math.max(1, messageCurrentPage - 1))}
                          disabled={messageCurrentPage === 1}
                          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          ← 上一页
                        </button>
                        
                        <div className="flex space-x-1">
                          {Array.from({ length: totalMessagePages }, (_, i) => i + 1).map(page => (
                            <button
                              key={page}
                              onClick={() => setMessageCurrentPage(page)}
                              className={`px-3 py-2 rounded-lg transition-colors ${
                                page === messageCurrentPage
                                  ? 'bg-blue-500 text-white'
                                  : 'border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                        </div>
                        
                        <button
                          onClick={() => setMessageCurrentPage(Math.min(totalMessagePages, messageCurrentPage + 1))}
                          disabled={messageCurrentPage === totalMessagePages}
                          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          下一页 →
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-white rounded-xl p-12 shadow-sm text-center">
                    <div className="text-6xl mb-4">📧</div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">
                      {messageSearchQuery || messageSelectedStatus 
                        ? '没有找到匹配的消息' 
                        : '还没有收到消息'}
                    </h3>
                    <p className="text-gray-600">
                      {messageSearchQuery || messageSelectedStatus 
                        ? '尝试调整搜索条件或筛选器' 
                        : '当有用户通过联系表单发送消息时，它们会显示在这里'}
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </main>

      {/* 消息详情模态框 */}
      {isMessageDetailOpen && currentMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-slate-800">消息详情</h3>
                <button
                  onClick={() => setIsMessageDetailOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">发件人</label>
                    <p className="text-slate-900">{currentMessage.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">邮箱</label>
                    <p className="text-slate-900">{currentMessage.email}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">主题</label>
                  <p className="text-slate-900">{currentMessage.subject}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">消息内容</label>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-slate-800 whitespace-pre-wrap">{currentMessage.message}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                  <div>
                    <label className="block font-medium mb-1">发送时间</label>
                    <p>{new Date(currentMessage.created_at).toLocaleString('zh-CN')}</p>
                  </div>
                  <div>
                    <label className="block font-medium mb-1">状态</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      currentMessage.status === 'unread' ? 'bg-red-100 text-red-800' :
                      currentMessage.status === 'replied' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {currentMessage.status === 'unread' ? '未读' :
                       currentMessage.status === 'replied' ? '已回复' : '已读'}
                    </span>
                  </div>
                </div>

                {currentMessage.ip_address && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">IP地址</label>
                    <p className="text-slate-600 text-sm">{currentMessage.ip_address}</p>
                  </div>
                )}

                {currentMessage.replied && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">回复状态</label>
                    <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                      <p className="text-green-800">✓ 已回复此消息</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  {!currentMessage.replied && (
                    <button
                      onClick={async () => {
                        const success = await updateMessageStatus(currentMessage.id, 'replied');
                        if (success) {
                          setCurrentMessage({ ...currentMessage, status: 'replied', replied: true });
                        }
                      }}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      标记已回复
                    </button>
                  )}
                  <button
                    onClick={() => setIsMessageDetailOpen(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* 作品编辑表单模态框 */}
      {isWorkFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-slate-800">
                  {currentWork ? '编辑作品' : '添加作品'}
                </h3>
                <button
                  onClick={closeWorkForm}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <form onSubmit={handleWorkFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">标题</label>
                  <input
                    type="text"
                    name="title"
                    value={workFormData.title}
                    onChange={handleWorkInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">分类</label>
                    <input
                      type="text"
                      name="category"
                      value={workFormData.category}
                      onChange={handleWorkInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">状态</label>
                    <select
                      name="status"
                      value={workFormData.status}
                      onChange={handleWorkInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
                    >
                      <option value="active">进行中</option>
                      <option value="completed">已完成</option>
                      <option value="archived">已归档</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">标签 (用逗号分隔)</label>
                  <input
                    type="text"
                    name="tags"
                    value={workFormData.tags}
                    onChange={handleWorkInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
                    placeholder="React, TypeScript, Web开发"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">技术栈 (用逗号分隔)</label>
                  <input
                    type="text"
                    name="technologies"
                    value={workFormData.technologies}
                    onChange={handleWorkInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
                    placeholder="React, Node.js, MongoDB"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">项目链接</label>
                    <input
                      type="url"
                      name="project_url"
                      value={workFormData.project_url}
                      onChange={handleWorkInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
                      placeholder="https://example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">GitHub链接</label>
                    <input
                      type="url"
                      name="github_url"
                      value={workFormData.github_url}
                      onChange={handleWorkInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
                      placeholder="https://github.com/username/repo"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">核心功能 (用逗号分隔)</label>
                  <input
                    type="text"
                    name="features"
                    value={workFormData.features}
                    onChange={handleWorkInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
                    placeholder="用户认证, 数据可视化, 响应式设计"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">技术挑战 (用逗号分隔)</label>
                  <input
                    type="text"
                    name="challenges"
                    value={workFormData.challenges}
                    onChange={handleWorkInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
                    placeholder="性能优化, 跨浏览器兼容, 复杂状态管理"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">描述</label>
                  <RichTextEditor
                    value={workFormData.description}
                    onChange={handleWorkDescriptionChange}
                    placeholder="请输入作品描述..."
                    height={200}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">详细内容</label>
                  <RichTextEditor
                    value={workFormData.content}
                    onChange={(value) => setWorkFormData(prev => ({ ...prev, content: value }))}
                    placeholder="请输入作品的详细内容..."
                    height={300}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">封面图片</label>
                  <input
                    type="url"
                    name="cover_image"
                    value={workFormData.cover_image}
                    onChange={handleWorkInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
                    placeholder="https://example.com/cover.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">项目截图 (用逗号分隔多个URL)</label>
                  <input
                    type="text"
                    name="screenshots"
                    value={workFormData.screenshots}
                    onChange={handleWorkInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
                    placeholder="https://example.com/screenshot1.jpg, https://example.com/screenshot2.jpg"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeWorkForm}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#165DFF] text-white rounded-lg hover:bg-[#165DFF]/90 transition-colors"
                  >
                    {currentWork ? '更新作品' : '创建作品'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 博客编辑表单模态框 */}
      {isBlogFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-slate-800">
                  {currentBlog ? '编辑博客' : '写博客'}
                </h3>
                <button
                  onClick={closeBlogForm}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <form onSubmit={handleBlogFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">标题</label>
                  <input
                    type="text"
                    name="title"
                    value={blogFormData.title}
                    onChange={handleBlogInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">分类</label>
                    <input
                      type="text"
                      name="category"
                      value={blogFormData.category}
                      onChange={handleBlogInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">状态</label>
                    <select
                      name="published"
                      value={blogFormData.published ? 'true' : 'false'}
                      onChange={(e) => setBlogFormData(prev => ({ ...prev, published: e.target.value === 'true' }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
                    >
                      <option value="false">草稿</option>
                      <option value="true">已发布</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={blogFormData.featured}
                      onChange={(e) => setBlogFormData(prev => ({ ...prev, featured: e.target.checked }))}
                      className="rounded border-slate-300 text-[#165DFF] shadow-sm focus:border-[#165DFF] focus:ring-[#165DFF]"
                    />
                    <label htmlFor="featured" className="ml-2 text-sm font-medium text-slate-700">
                      设为精选
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">封面图片</label>
                  <input
                    type="url"
                    name="cover_image"
                    value={blogFormData.cover_image}
                    onChange={handleBlogInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
                    placeholder="输入图片URL"
                  />
                  {blogFormData.cover_image && (
                    <div className="mt-2">
                      <img
                        src={blogFormData.cover_image}
                        alt="封面预览"
                        className="w-full h-32 object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">摘要</label>
                  <input
                    type="text"
                    name="excerpt"
                    value={blogFormData.excerpt}
                    onChange={handleBlogInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
                    placeholder="简短描述这篇博客的内容..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">标签 (用逗号分隔)</label>
                  <input
                    type="text"
                    name="tags"
                    value={blogFormData.tags}
                    onChange={handleBlogInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
                    placeholder="React, JavaScript, 前端开发"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">内容</label>
                  <RichTextEditor
                    value={blogFormData.content}
                    onChange={handleBlogContentChange}
                    placeholder="开始写作..."
                    height={400}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeBlogForm}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#165DFF] text-white rounded-lg hover:bg-[#165DFF]/90 transition-colors"
                  >
                    {currentBlog ? '更新博客' : '发布博客'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}