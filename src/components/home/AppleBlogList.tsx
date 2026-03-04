import React, { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Blog {
  id: string;
  title: string;
  summary?: string;
  excerpt?: string;
  created_at?: string;
  tags?: string[];
}

interface AppleBlogListProps {
  blogs: Blog[];
}

const AppleBlogList = ({ blogs }: AppleBlogListProps) => {
  const navigate = useNavigate();
  const handleNavigate = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  const blogCards = useMemo(() => (
    blogs.map((blog) => ({
      ...blog,
      dateLabel: blog.created_at ? new Date(blog.created_at).toLocaleDateString('zh-CN') : 'Recently',
      summaryText: blog.summary || blog.excerpt || '暂无摘要...',
    }))
  ), [blogs]);

  return (
    <section className="w-full bg-[#f5f5f7] py-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            最新博客
          </h2>
        </div>

        <div className="space-y-4">
          {blogs.length > 0 ? (
            blogCards.map((blog, index) => (
              <motion.article
                key={blog.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onClick={() => handleNavigate(`/blog/${blog.id}`)}
                className="group bg-white rounded-xl p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer border border-slate-200/70"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-2">
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">Article</span>
                      <span>{blog.dateLabel}</span>
                    </div>
                    <h3 className="text-base md:text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2">
                      {blog.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed line-clamp-2 mb-3">
                      {blog.summaryText}
                    </p>
                    
                    {/* Tags */}
                    {blog.tags && blog.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {blog.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[11px] rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="hidden md:flex items-center justify-center w-9 h-9 rounded-full bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <ArrowUpRight size={16} />
                  </div>
                </div>
              </motion.article>
            ))
          ) : (
            <div className="py-12 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
              暂无文章更新
            </div>
          )}
        </div>
        
        {/* Footer Link */}
        <div className="mt-10 text-center">
           <button
             onClick={() => handleNavigate('/blogs')}
             className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
           >
             进入博客专栏
           </button>
        </div>
      </div>
    </section>
  );
};

export default AppleBlogList;
