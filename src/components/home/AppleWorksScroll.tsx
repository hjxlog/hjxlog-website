import React, { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Work {
  id: string;
  title: string;
  description?: string;
  cover_image?: string;
  category?: string;
}

interface AppleWorksScrollProps {
  works: Work[];
}

const AppleWorksScroll = ({ works }: AppleWorksScrollProps) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const handleNavigate = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);
  
  return (
    <section className="w-full bg-white py-24 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 mb-12 flex items-end justify-between">
        <div>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900 mb-2">
            精选作品
          </h2>
          <p className="text-xl text-slate-500 font-normal">
            探索创意与技术的边界。
          </p>
        </div>
        <button 
          onClick={() => handleNavigate('/works')}
          className="hidden md:flex items-center gap-1 text-[#0066cc] hover:underline underline-offset-4 text-lg font-medium"
        >
          浏览所有作品 <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div 
        className="flex overflow-x-auto snap-x snap-mandatory pb-12 px-6 space-x-6 hide-scrollbar"
        ref={containerRef}
      >
        {works.length > 0 ? (
          works.map((work, index) => (
            <motion.div
              key={work.id}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              onClick={() => handleNavigate(`/works/${work.id}`)}
              className="flex-none w-[85vw] md:w-[600px] h-[500px] snap-center group cursor-pointer relative rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500"
            >
              {work.cover_image ? (
                <img 
                  src={work.cover_image} 
                  alt={work.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                  <span className="text-white/20 font-bold text-4xl">NO PREVIEW</span>
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-8 flex flex-col justify-end text-white">
                <span className="inline-block text-sm font-bold tracking-wider uppercase text-white/80 mb-2">
                  {work.category || 'FEATURED'}
                </span>
                <h3 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">
                  {work.title}
                </h3>
                {work.description && (
                  <p className="text-white/80 text-lg line-clamp-2 max-w-lg mb-6">
                    {work.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-white font-medium group-hover:gap-4 transition-all">
                  查看详情 <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          // Placeholder Items
          [1, 2, 3].map((item) => (
            <div 
              key={item}
              className="flex-none w-[85vw] md:w-[600px] h-[500px] snap-center bg-slate-100 rounded-3xl animate-pulse"
            />
          ))
        )}
      </div>
    </section>
  );
};

export default AppleWorksScroll;
