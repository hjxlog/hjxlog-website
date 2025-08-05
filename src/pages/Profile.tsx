import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';
import AdminNav from '@/components/AdminNav';
import { toast } from 'sonner';

export default function Profile() {
  const { user, updateUser, logout } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || '',
    avatar: user?.avatar || ''
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-600 mb-4">请先登录</p>
          <button 
            className="px-4 py-2 bg-[#165DFF] text-white rounded-lg hover:bg-[#165DFF]/90 transition-colors"
            onClick={() => navigate('/login')}
          >
            前往登录
          </button>
        </div>
      </div>
    );
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleProfileUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    
    setTimeout(() => {
      try {
        updateUser(formData);
        toast.success('个人资料更新成功');
        setIsEditing(false);
      } catch (error) {
        console.error('Failed to update profile', error);
        toast.error('更新资料失败');
      } finally {
        setIsLoading(false);
      }
    }, 800);
  };
  
  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // 简单密码验证
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('请填写所有密码字段');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('新密码和确认密码不匹配');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('新密码长度至少为6位');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`http://localhost:3006/api/users/${user?.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('密码更新成功，请重新登录');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        logout();
      } else {
        toast.error(result.message || '更新密码失败');
      }
    } catch (error) {
      console.error('Failed to update password', error);
      toast.error('网络错误，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* 使用管理员导航组件 */}
      <AdminNav />
      
      <main className="container mx-auto px-4 py-24 max-w-4xl">
        <h1 className="text-3xl font-bold text-slate-800 mb-10">个人中心</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 个人信息卡片 */}
          <div className="bg-white rounded-xl p-6 shadow-sm lg:col-span-1">
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-4">
                {formData.avatar ? (
                  <img 
                    src={formData.avatar} 
                    alt="用户头像" 
                    className="w-full h-full rounded-full object-cover border-4 border-white shadow-md"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-[#165DFF]/10 flex items-center justify-center text-[#165DFF] text-5xl">
                    <i className="fas fa-user"></i>
                  </div>
                )}
                {isEditing && (
                  <button className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-[#165DFF] text-white flex items-center justify-center shadow-md">
                    <i className="fas fa-camera"></i>
                  </button>
                )}
              </div>
              
              <h2 className="text-xl font-semibold text-slate-800">{formData.username}</h2>
              <p className="text-slate-600 mb-4">{formData.email}</p>
              
              <button 
                className="w-full px-4 py-2 bg-[#165DFF] text-white rounded-lg hover:bg-[#165DFF]/90 transition-colors"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? '取消编辑' : '编辑资料'}
              </button>
            </div>
            
            <div className="mt-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-1">个人简介</h3>
                <p className="text-slate-700 text-sm">
                  {formData.bio || '暂无个人简介'}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-2">账户状态</h3>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-[#165DFF] h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
                <p className="text-xs text-slate-500 mt-1">已认证账户</p>
              </div>
            </div>
          </div>
          
          {/* 详细信息编辑 */}
          <div className="lg:col-span-2 space-y-8">
            {/* 基本信息表单 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-slate-800">基本信息</h2>
              </div>
              
              {isEditing ? (
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">用户名</label>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">邮箱</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">头像链接</label>
                    <input
                      type="url"
                      name="avatar"
                      value={formData.avatar}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">个人简介</label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
                      placeholder="介绍一下自己..."
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2 bg-[#165DFF] text-white rounded-lg hover:bg-[#165DFF]/90 disabled:opacity-50 transition-colors"
                    >
                      {isLoading ? '保存中...' : '保存更改'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-500 mb-1">用户名</label>
                      <p className="text-slate-800">{formData.username}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-500 mb-1">邮箱</label>
                      <p className="text-slate-800">{formData.email}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">个人简介</label>
                    <p className="text-slate-800">{formData.bio || '暂无个人简介'}</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* 密码修改表单 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-800 mb-6">修改密码</h2>
              
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">当前密码</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
                    placeholder="请输入当前密码"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">新密码</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
                      placeholder="请输入新密码"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">确认新密码</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
                      placeholder="请再次输入新密码"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                  >
                    {isLoading ? '更新中...' : '更新密码'}
                  </button>
                </div>
              </form>
            </div>
            
            {/* 账户设置 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-800 mb-6">账户设置</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div>
                    <h3 className="font-medium text-slate-800">邮件通知</h3>
                    <p className="text-sm text-slate-600">接收新评论和系统通知</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#165DFF]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#165DFF]"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div>
                    <h3 className="font-medium text-slate-800">双因素认证</h3>
                    <p className="text-sm text-slate-600">为账户添加额外的安全保护</p>
                  </div>
                  <button className="px-3 py-1 text-sm border border-slate-300 text-slate-700 rounded hover:bg-slate-50 transition-colors">
                    设置
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                  <div>
                    <h3 className="font-medium text-red-800">删除账户</h3>
                    <p className="text-sm text-red-600">永久删除您的账户和所有数据</p>
                  </div>
                  <button className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors">
                    删除
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}