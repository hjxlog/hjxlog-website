import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowUpRight, 
  Github, 
  Mail, 
  Cpu,
  Palette,
  Zap,
  Box,
  Globe,
  Layers,
  Terminal,
  Code2
} from 'lucide-react';

const BentoItem = ({ 
  children, 
  className = "", 
  delay = 0,
  onClick
}: { 
  children: React.ReactNode; 
  className?: string;
  delay?: number;
  onClick?: () => void;
}) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
    transition={{ duration: 0.8, delay: delay, ease: [0.16, 1, 0.3, 1] }} 
    whileHover={{ scale: 1.01, transition: { duration: 0.3 } }}
    whileTap={{ scale: 0.98 }}
    className={`
      relative overflow-hidden rounded-[2rem] p-8
      glass-panel bg-noise
      border border-white/40
      hover:shadow-xl hover:shadow-black/5 transition-all duration-500
      ${className} 
      ${onClick ? 'cursor-pointer' : ''}
    `}
    onClick={onClick}
  >
    {children}
  </motion.div>
);

export default function HeroBento() {
  const navigate = useNavigate();

  return (
    <section className="py-12 lg:py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Clean 3-Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[280px]">
          
          {/* 1. VISION (2x1) - 核心愿景 */}
          <BentoItem className="md:col-span-2 md:row-span-1 flex flex-col justify-center !bg-white/80" delay={0.1}>
             <div className="absolute top-0 right-0 p-12 opacity-[0.03]">
               <Terminal size={200} />
             </div>
             
             <div className="relative z-10 max-w-lg">
               <div className="flex items-center space-x-2 mb-6">
                 <span className="w-2 h-2 rounded-full bg-slate-900"></span>
                 <span className="text-xs font-bold text-slate-500 tracking-widest uppercase">Full Stack & AI Engineer</span>
               </div>
               
               <h1 className="text-3xl lg:text-5xl font-bold text-slate-900 mb-6 tracking-tight leading-[1.15]">
                 构建数字世界的<br/>
                 <span className="text-slate-400">优雅体验。</span>
               </h1>
               
               <p className="text-slate-600 text-base lg:text-lg leading-relaxed mb-0">
                 热衷于将复杂逻辑转化为直观、高效的产品。
                 <br/>
                 专注于 React 生态与 AI 智能体解决方案。
               </p>
             </div>
          </BentoItem>

          {/* 2. AVATAR (1x1) - 个人形象 */}
          <BentoItem className="md:col-span-1 md:row-span-1 !p-0 border-0 shadow-none !bg-transparent overflow-visible" delay={0.2}>
             <div className="w-full h-full rounded-[2rem] overflow-hidden relative group shadow-2xl shadow-slate-200">
               <img 
                 src="https://file.hjxlog.com/blog/images/avatar.jpg" 
                 alt="Huang JX"
                 className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80"></div>
               <div className="absolute bottom-6 left-6 text-white">
                 <h2 className="text-xl font-bold">Huang JX</h2>
                 <p className="text-white/70 text-sm">@hjxlog</p>
               </div>
             </div>
          </BentoItem>

          {/* 3. WORKS (1x1) - 精选作品 (Dark Mode) */}
          <BentoItem 
            className="md:col-span-1 md:row-span-1 !bg-slate-900 text-white flex flex-col justify-between group cursor-pointer border-slate-800" 
            delay={0.3}
            onClick={() => navigate('/works')}
          >
             <div className="flex justify-between items-start">
               <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                 <Zap size={20} className="text-yellow-400" />
               </div>
               <ArrowUpRight className="text-slate-500 group-hover:text-white transition-colors" />
             </div>
             
             <div>
               <h3 className="text-2xl font-bold mb-2">精选作品</h3>
               <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">
                 探索我构建的 SaaS 平台、企业级后台与创意工具。
               </p>
             </div>
          </BentoItem>

          {/* 4. TECH STACK (1x1) - 技术能力 (Gray Mode) */}
          <BentoItem className="md:col-span-1 md:row-span-1 !bg-slate-100 flex flex-col justify-between" delay={0.4}>
             <div className="w-10 h-10 rounded-full bg-white text-slate-700 flex items-center justify-center shadow-sm">
               <Code2 size={20} />
             </div>
             
             <div>
               <h3 className="text-lg font-bold text-slate-900 mb-4">技术栈</h3>
               <div className="flex flex-wrap gap-2">
                 {['React', 'Next.js', 'Spring Boot', 'LLM Agents', 'DevOps'].map((tech) => (
                   <span key={tech} className="px-3 py-1.5 bg-white rounded-lg border border-slate-200 text-xs font-bold text-slate-600 shadow-sm">
                     {tech}
                   </span>
                 ))}
               </div>
             </div>
          </BentoItem>

          {/* 5. CONNECT (1x1) - 联系方式 (Gradient Mode) */}
          <BentoItem className="md:col-span-1 md:row-span-1 !bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col justify-between" delay={0.5}>
             <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
               <Mail size={20} />
             </div>
             
             <div>
               <h3 className="text-lg font-bold text-slate-900 mb-2">期待合作</h3>
               <p className="text-slate-500 text-xs mb-6">
                 无论是全职机会还是有趣的项目协作，欢迎随时联系。
               </p>
               <div className="flex gap-3">
                 <a href="mailto:contact@example.com" className="flex-1 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium flex items-center justify-center hover:bg-slate-800 transition-colors">
                   Email
                 </a>
                 <a href="https://github.com" target="_blank" rel="noreferrer" className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-900 shadow-sm hover:scale-105 transition-transform">
                   <Github size={18} />
                 </a>
               </div>
             </div>
          </BentoItem>

        </div>
      </div>
    </section>
  );
}
