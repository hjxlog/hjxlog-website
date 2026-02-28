import { useEffect, useState, lazy, Suspense } from 'react';
import PublicNav from '@/components/PublicNav';
import Footer from '@/components/Footer';
import HeroApple from '@/components/home/HeroApple';
import { apiRequest } from '@/config/api';
import { useViewTracker } from '@/hooks/useViewTracker';

// 懒加载非首屏组件
const AppleWorksScroll = lazy(() => import('@/components/home/AppleWorksScroll'));
const AppleBlogList = lazy(() => import('@/components/home/AppleBlogList'));

// 主页面组件
export default function Home() {
  useViewTracker('home_page');

  type FeaturedWork = {
    id: number | string;
    title: string;
    description?: string;
    cover_image?: string;
    category?: string;
  };
  type FeaturedBlog = {
    id: number | string;
    title: string;
    summary?: string;
    excerpt?: string;
    created_at?: string;
    tags?: string[];
  };

  // 状态管理
  const [featuredData, setFeaturedData] = useState<{
    works: FeaturedWork[];
    blogs: FeaturedBlog[];
  }>({
    works: [],
    blogs: []
  });
  
  // 获取推荐内容
  const fetchFeaturedContent = async () => {
    try {
      const result = await apiRequest('/api/featured');
      if (result.success) {
        setFeaturedData(result.data);
      }
    } catch (err) {
      console.error('获取推荐内容失败:', err);
      // Keep empty if failed
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
        <Suspense fallback={<div className="h-[400px] flex items-center justify-center text-slate-400">Loading works...</div>}>
          <AppleWorksScroll works={featuredData.works} />
        </Suspense>

        {/* 3. Blog List Section (Light Gray) */}
        <Suspense fallback={<div className="h-[400px] flex items-center justify-center text-slate-400">Loading blogs...</div>}>
          <AppleBlogList blogs={featuredData.blogs} />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
