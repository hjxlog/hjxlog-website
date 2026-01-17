import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Calendar, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Blog {
  id: string;
  title: string;
  summary?: string;
  created_at?: string;
  tags?: string[];
}

interface AppleBlogListProps {
  blogs: Blog[];
}

const AppleBlogList = ({ blogs }: AppleBlogListProps) => {
  const navigate = useNavigate();

  return (
    <section className="w-full bg-[#f5f5f7] py-24">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            最新思考
          </h2>
          <button 
            onClick={() => navigate('/blogs')}
            className="text-[#0066cc] hover:underline flex items-center gap-1 font-medium"
          >
            阅读全部 <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid gap-6">
          {blogs.length > 0 ? (
            blogs.map((blog, index) => (
              <motion.article
                key={blog.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onClick={() => navigate(`/blog/${blog.id}`)}
                className="group bg-white rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border border-slate-200/60 relative overflow-hidden"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                      <span className="text-blue-600">Article</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span>{blog.created_at ? new Date(blog.created_at).toLocaleDateString('zh-CN') : 'Recently'}</span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors leading-tight">
                      {blog.title}
                    </h3>
                    <p className="text-slate-500 text-base leading-relaxed line-clamp-2 md:line-clamp-3 mb-4">
                      {blog.summary || '暂无摘要...'}
                    </p>
                    
                    {/* Tags */}
                    {blog.tags && blog.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {blog.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-slate-100 text-slate-500 text-xs rounded-md">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all transform group-hover:rotate-45">
                    <ArrowUpRight size={20} />
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
        <div className="mt-12 text-center">
           <button
             onClick={() => navigate('/blogs')}
             className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
           >
             进入博客专栏
           </button>
        </div>
      </div>
    </section>
  );
};

export default AppleBlogList;
