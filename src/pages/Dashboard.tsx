import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';
import RichTextEditor from '@/components/RichTextEditor';
import AdminNav from '@/components/AdminNav';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';
import { API_BASE_URL, apiRequest } from '@/config/api';
import { 
  uploadImageToOSS, 
  uploadMultipleImagesToOSS, 
  validateImageType, 
  validateImageSize, 
  formatFileSize,
  deleteImageFromOSS,
  extractFileNameFromUrl 
} from '@/utils/ossUpload';

// 导入模块化组件
import OverviewTab from '@/components/dashboard/OverviewTab';
import MomentsTab from '@/components/dashboard/MomentsTab';
import CommentsTab from '@/components/dashboard/CommentsTab';
import WorksTab from '@/components/dashboard/WorksTab';
import BlogsTab from '@/components/dashboard/BlogsTab';
import LogManagement from '@/pages/LogManagement';

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
  const [momentFormData, setMomentFormData] = useState({
    content: '',
    visibility: 'public' as 'public' | 'private',
    images: [] as any[]
  });
  const [isMomentFormOpen, setIsMomentFormOpen] = useState(false);
  const [currentMoment, setCurrentMoment] = useState<any>(null);
  const [dragOver, setDragOver] = useState(false);
  
  // 图片上传相关状态
  const [uploadProgress, setUploadProgress] = useState<{[key: number]: number}>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

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
    return new Promise<boolean>((resolve) => {
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
              resolve(true);
            } else {
              toast.error(result.message || '删除评论失败');
              resolve(false);
            }
          } catch (error) {
            console.error('删除评论失败:', error);
            toast.error('删除评论失败');
            resolve(false);
          }
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

  const openMomentForm = (moment?: any) => {
    if (moment) {
      setCurrentMoment(moment);
      setMomentFormData({
        content: moment.content,
        visibility: moment.visibility,
        images: moment.images || []
      });
    } else {
      setCurrentMoment(null);
      setMomentFormData({
        content: '',
        visibility: 'public',
        images: []
      });
    }
    setIsMomentFormOpen(true);
  };

  const closeMomentForm = () => {
    setIsMomentFormOpen(false);
    setCurrentMoment(null);
    setMomentFormData({
      content: '',
      visibility: 'public',
      images: []
    });
  };

  const createMoment = async (momentData: any) => {
    try {
      const data = await apiRequest('/api/moments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(momentData),
      });

      if (data.success) {
        await fetchMoments();
        toast.success('动态创建成功');
        return true;
      } else {
        toast.error(data.message || '创建失败');
        return false;
      }
    } catch (error) {
      console.error('创建动态失败:', error);
      toast.error('创建失败');
      return false;
    }
  };

  const updateMoment = async (id: number, momentData: any) => {
    try {
      const data = await apiRequest(`/api/moments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(momentData),
      });

      if (data.success) {
        await fetchMoments();
        toast.success('动态更新成功');
        return true;
      } else {
        toast.error(data.message || '更新失败');
        return false;
      }
    } catch (error) {
      console.error('更新动态失败:', error);
      toast.error('更新失败');
      return false;
    }
  };

  const deleteMoment = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: '删除动态',
      content: '确定要删除这条动态吗？此操作不可撤销。',
      onConfirm: async () => {
        try {
          const data = await apiRequest(`/api/moments/${id}`, {
            method: 'DELETE',
          });

          if (data.success) {
            await fetchMoments();
            toast.success('动态删除成功');
          } else {
            toast.error(data.message || '删除失败');
          }
        } catch (error) {
          console.error('删除动态失败:', error);
          toast.error('删除失败');
        }
        setConfirmDialog({ isOpen: false, title: '', content: '', onConfirm: () => {} });
      },
      onCancel: () => {
        setConfirmDialog({ isOpen: false, title: '', content: '', onConfirm: () => {} });
      }
    });
  };

  // 处理动态表单提交
  const handleMomentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // 处理图片数据（移除文件上传功能）
      const uploadedImages = [];
      for (const image of momentFormData.images) {
        if (image.image_url) {
          uploadedImages.push({
            image_url: image.image_url,
            alt_text: image.alt_text || ''
          });
        }
      }
      
      const momentData = {
        content: momentFormData.content,
        visibility: momentFormData.visibility,
        images: uploadedImages
      };
      
      if (currentMoment) {
        await updateMoment(currentMoment.id, momentData);
      } else {
        await createMoment(momentData);
      }
      
      closeMomentForm();
    } catch (error) {
      console.error('保存动态失败:', error);
      toast.error('保存动态失败');
    }
  };

  // 处理图片选择
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;
    
    // 验证文件
    const validFiles = [];
    const errors = [];
    
    for (const file of files) {
      if (!validateImageType(file)) {
        errors.push(`${file.name}: 不支持的文件类型`);
        continue;
      }
      if (!validateImageSize(file)) {
        errors.push(`${file.name}: 文件大小超过15MB限制`);
        continue;
      }
      validFiles.push(file);
    }
    
    if (errors.length > 0) {
      setUploadErrors(errors);
      toast.error(`部分文件验证失败：${errors.join(', ')}`);
    }
    
    if (validFiles.length === 0) return;
    
    // 先添加预览图片到状态中
    const newImages = validFiles.map((file, index) => ({
      file,
      preview: URL.createObjectURL(file),
      alt_text: '',
      uploading: true,
      progress: 0
    }));
    
    const currentImageCount = momentFormData.images.length;
    setMomentFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newImages]
    }));
    
    setIsUploading(true);
    
    // 逐个上传图片
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const imageIndex = currentImageCount + i;
      
      try {
        console.log('🔍 [前端] 开始上传图片:', {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          imageIndex
        });
        
        const result = await uploadImageToOSS(file, (progress) => {
          console.log('📊 [前端] 上传进度:', {
            fileName: file.name,
            progress: progress.percentage
          });
          
          setUploadProgress(prev => ({
            ...prev,
            [imageIndex]: progress.percentage
          }));
          
          // 更新对应图片的进度
          setMomentFormData(prev => ({
            ...prev,
            images: prev.images.map((img, idx) => 
              idx === imageIndex ? { ...img, progress: progress.percentage } : img
            )
          }));
        });
        
        console.log('📤 [前端] 上传结果:', result);
        
        if (result.success) {
          // 上传成功，更新图片信息
          setMomentFormData(prev => ({
            ...prev,
            images: prev.images.map((img, idx) => 
              idx === imageIndex ? {
                ...img,
                image_url: result.url,
                fileName: result.fileName,
                uploading: false,
                progress: 100
              } : img
            )
          }));
          
          toast.success(`${file.name} 上传成功`);
        } else {
          throw new Error(result.error || '上传失败');
        }
      } catch (error) {
        console.error('图片上传失败:', error);
        toast.error(`${file.name} 上传失败: ${error.message}`);
        
        // 移除上传失败的图片
        setMomentFormData(prev => ({
          ...prev,
          images: prev.images.filter((_, idx) => idx !== imageIndex)
        }));
      }
    }
    
    setIsUploading(false);
    setUploadProgress({});
    
    // 清空文件输入
    e.target.value = '';
  };

  // 处理图片拖拽
  const handleImageDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length === 0) {
      toast.error('请拖拽图片文件');
      return;
    }
    
    // 验证文件
    const validFiles = [];
    const errors = [];
    
    for (const file of files) {
      if (!validateImageType(file)) {
        errors.push(`${file.name}: 不支持的文件类型`);
        continue;
      }
      if (!validateImageSize(file)) {
        errors.push(`${file.name}: 文件大小超过15MB限制`);
        continue;
      }
      validFiles.push(file);
    }
    
    if (errors.length > 0) {
      setUploadErrors(errors);
      toast.error(`部分文件验证失败：${errors.join(', ')}`);
    }
    
    if (validFiles.length === 0) return;
    
    // 先添加预览图片到状态中
    const newImages = validFiles.map((file, index) => ({
      file,
      preview: URL.createObjectURL(file),
      alt_text: '',
      uploading: true,
      progress: 0
    }));
    
    const currentImageCount = momentFormData.images.length;
    setMomentFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newImages]
    }));
    
    setIsUploading(true);
    
    // 逐个上传图片
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const imageIndex = currentImageCount + i;
      
      try {
        const result = await uploadImageToOSS(file, (progress) => {
          setUploadProgress(prev => ({
            ...prev,
            [imageIndex]: progress.percentage
          }));
          
          // 更新对应图片的进度
          setMomentFormData(prev => ({
            ...prev,
            images: prev.images.map((img, idx) => 
              idx === imageIndex ? { ...img, progress: progress.percentage } : img
            )
          }));
        });
        
        if (result.success) {
          // 上传成功，更新图片信息
          setMomentFormData(prev => ({
            ...prev,
            images: prev.images.map((img, idx) => 
              idx === imageIndex ? {
                ...img,
                image_url: result.url,
                fileName: result.fileName,
                uploading: false,
                progress: 100
              } : img
            )
          }));
          
          toast.success(`${file.name} 上传成功`);
        } else {
          throw new Error(result.error || '上传失败');
        }
      } catch (error) {
        console.error('图片上传失败:', error);
        toast.error(`${file.name} 上传失败: ${error.message}`);
        
        // 移除上传失败的图片
        setMomentFormData(prev => ({
          ...prev,
          images: prev.images.filter((_, idx) => idx !== imageIndex)
        }));
      }
    }
    
    setIsUploading(false);
    setUploadProgress({});
  };

  // 删除图片
  const removeImage = async (index: number) => {
    const imageToRemove = momentFormData.images[index];
    
    // 如果图片已上传到OSS，则删除OSS文件
    if (imageToRemove.image_url && imageToRemove.fileName) {
      try {
        const success = await deleteImageFromOSS(imageToRemove.fileName);
        if (success) {
          toast.success('图片删除成功');
        } else {
          toast.error('删除OSS文件失败，但已从列表中移除');
        }
      } catch (error) {
        console.error('删除OSS文件失败:', error);
        toast.error('删除OSS文件失败，但已从列表中移除');
      }
    }
    
    // 清理预览URL
    if (imageToRemove.preview && imageToRemove.preview.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    
    const newImages = momentFormData.images.filter((_, i) => i !== index);
    setMomentFormData({
      ...momentFormData,
      images: newImages
    });
  };

  // 更新图片alt文本
  const updateImageAlt = (index: number, altText: string) => {
    const newImages = momentFormData.images.map((image, i) => 
      i === index ? { ...image, alt_text: altText } : image
    );
    setMomentFormData({
      ...momentFormData,
      images: newImages
    });
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
          <OverviewTab 
            user={user}
            works={works}
            blogs={blogs}
            moments={moments}
            openWorkForm={openWorkForm}
            openBlogForm={openBlogForm}
            openMomentForm={openMomentForm}
          />
        )}

        {/* 动态管理页面 */}
        {activeTab === 'moments' && (
          <MomentsTab 
            moments={moments}
            openMomentForm={openMomentForm}
            deleteMoment={deleteMoment}
          />
        )}

        {/* 评论管理页面 */}
        {activeTab === 'comments' && (
          <CommentsTab 
            comments={comments}
            openCommentReply={(comment) => {
              setCurrentComment(comment);
              setIsCommentReplyOpen(true);
              setReplyContent('');
            }}
            deleteComment={deleteComment}
          />
        )}

        {/* 作品管理页面 */}
        {activeTab === 'works' && (
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
        )}

        {/* 博客管理页面 */}
        {activeTab === 'blogs' && (
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
            renderBlogStatusBadge={renderBlogStatusBadge}
          />
        )}

        {/* 日志管理页面 */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            {/* 日志管理内容 */}
            <LogManagement />
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








      </main>





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

      {/* 动态发布表单模态框 */}
      {isMomentFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-slate-800">
                  {currentMoment ? '编辑动态' : '发布动态'}
                </h3>
                <button
                  onClick={closeMomentForm}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <form onSubmit={handleMomentSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    内容 *
                  </label>
                  <textarea
                    value={momentFormData.content}
                    onChange={(e) => setMomentFormData({...momentFormData, content: e.target.value})}
                    rows={6}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF] resize-none"
                    placeholder="分享你的想法..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    可见性
                  </label>
                  <select
                    value={momentFormData.visibility}
                    onChange={(e) => setMomentFormData({...momentFormData, visibility: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
                  >
                    <option value="public">公开</option>
                    <option value="private">私密</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    图片
                  </label>
                  <div 
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      dragOver ? 'border-blue-400 bg-blue-50' : 'border-slate-300'
                    } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleImageDrop}
                  >
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      id="moment-images"
                      disabled={isUploading}
                    />
                    <label htmlFor="moment-images" className="cursor-pointer">
                      <div className="text-slate-400 mb-2 text-4xl">📷</div>
                      <p className="text-slate-600">
                        {isUploading ? '正在上传...' : '点击选择图片或拖拽到此处'}
                      </p>
                      <p className="text-sm text-slate-400 mt-1">支持多张图片上传</p>
                    </label>
                  </div>

                  {/* 上传进度显示 */}
                  {isUploading && uploadProgress > 0 && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-slate-600 mb-1">
                        <span>上传进度</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-[#165DFF] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* 上传错误显示 */}
                  {uploadErrors.length > 0 && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="text-sm text-red-600">
                        <div className="font-medium mb-1">上传失败：</div>
                        <ul className="list-disc list-inside space-y-1">
                          {uploadErrors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* 图片预览 */}
                  {momentFormData.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                      {momentFormData.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image.preview || image.image_url}
                            alt={`预览 ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ✕
                          </button>
                          <input
                            type="text"
                            placeholder="图片描述"
                            value={image.alt_text || ''}
                            onChange={(e) => updateImageAlt(index, e.target.value)}
                            className="absolute bottom-1 left-1 right-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeMomentForm}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#165DFF] text-white rounded-lg hover:bg-[#165DFF]/90 transition-colors"
                  >
                    {currentMoment ? '更新动态' : '发布动态'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

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