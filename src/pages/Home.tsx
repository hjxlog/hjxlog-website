import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicNav from '@/components/PublicNav';
import Footer from '@/components/Footer';
import HeroApple from '@/components/home/HeroApple';
import AppleWorksScroll from '@/components/home/AppleWorksScroll';
import AppleBlogList from '@/components/home/AppleBlogList';
import { apiRequest } from '@/config/api';

// 主页面组件
export default function Home() {
  const navigate = useNavigate();
  
  // 状态管理
  const [featuredData, setFeaturedData] = useState<{
    works: any[];
    blogs: any[];
  }>({
    works: [],
    blogs: []
  });
  const [loading, setLoading] = useState(true);
  
  // 获取推荐内容
  const fetchFeaturedContent = async () => {
    try {
      setLoading(true);
      const result = await apiRequest('/api/featured');
      if (result.success) {
        setFeaturedData(result.data);
      }
    } catch (err) {
      console.error('获取推荐内容失败:', err);
      // Keep empty if failed
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeaturedContent();
  }, []);

  return (
    <div className="relative min-h-screen bg-white selection:bg-blue-100 selection:text-blue-900">
      <PublicNav />
      
      <main>
        {/* 1. Hero Vision Section (White) */}
        <HeroApple />
        
        {/* 2. Works Horizontal Scroll (White) */}
        <AppleWorksScroll works={featuredData.works} />

        {/* 3. Blog List Section (Light Gray) */}
        <AppleBlogList blogs={featuredData.blogs} />
      </main>

      <Footer />
    </div>
  );
}
