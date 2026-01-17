import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Github, Twitter, Mail, Terminal, Cpu, Zap, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AppleSection = ({ 
  children, 
  className = "", 
  dark = false 
}: { 
  children: React.ReactNode; 
  className?: string; 
  dark?: boolean;
}) => (
  <section className={`
    w-full relative overflow-hidden
    ${dark ? 'bg-black text-white' : 'bg-white text-slate-900'}
    ${className}
  `}>
    {children}
  </section>
);

const CodeWindow = () => (
  <div className="rounded-xl overflow-hidden bg-[#1e1e1e] shadow-2xl border border-slate-700/50 font-mono text-sm w-full max-w-lg mx-auto transform transition-transform hover:scale-[1.02] duration-500">
    <div className="flex items-center px-4 py-3 bg-[#252526] border-b border-slate-700/50">
      <div className="flex space-x-2">
        <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
        <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
        <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
      </div>
      <div className="ml-4 text-xs text-slate-400">developer.tsx</div>
    </div>
    <div className="p-6 text-slate-300 leading-relaxed overflow-x-auto">
      <div className="flex">
        <span className="text-slate-600 select-none mr-4">1</span>
        <span><span className="text-[#c586c0]">const</span> <span className="text-[#4fc1ff]">JianXian</span> = <span className="text-[#c586c0]">new</span> <span className="text-[#4ec9b0]">Developer</span>({'{'}</span>
      </div>
      <div className="flex">
        <span className="text-slate-600 select-none mr-4">2</span>
        <span className="pl-4"><span className="text-[#9cdcfe]">role</span>: <span className="text-[#ce9178]">'Full Stack Engineer'</span>,</span>
      </div>
      <div className="flex">
        <span className="text-slate-600 select-none mr-4">3</span>
        <span className="pl-4"><span className="text-[#9cdcfe]">focus</span>: [<span className="text-[#ce9178]">'AI Agents'</span>, <span className="text-[#ce9178]">'UI/UX'</span>],</span>
      </div>
      <div className="flex">
        <span className="text-slate-600 select-none mr-4">4</span>
        <span className="pl-4"><span className="text-[#9cdcfe]">mission</span>: <span className="text-[#ce9178]">'Crafting digital masterpieces'</span>,</span>
      </div>
      <div className="flex">
        <span className="text-slate-600 select-none mr-4">5</span>
        <span className="pl-4"><span className="text-[#dcdcaa]">build</span>: () <span className="text-[#569cd6]">=&gt;</span> <span className="text-[#ce9178]">'Future'</span></span>
      </div>
      <div className="flex">
        <span className="text-slate-600 select-none mr-4">6</span>
        <span>{'}'});</span>
      </div>
    </div>
  </div>
);

const HeroApple = () => {
  const navigate = useNavigate();

  return (
    <AppleSection className="min-h-[90vh] flex items-center justify-center relative">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-slate-50 to-transparent -z-10"></div>
      <div className="absolute right-[-10%] top-[20%] w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute left-[-10%] bottom-[20%] w-[500px] h-[500px] bg-purple-100/40 rounded-full blur-[100px] -z-10"></div>

      <div className="container mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Left Column: Narrative */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-start text-left z-10"
        >
          {/* Avatar & Badge */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full p-[3px] bg-gradient-to-tr from-blue-100 to-purple-100 shadow-sm">
               <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center p-[2px]">
                  <img 
                    src="https://file.hjxlog.com/blog/images/avatar.jpg" 
                    alt="JianXian"
                    className="w-full h-full object-cover rounded-full"
                  />
               </div>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">JianXian</h3>
              <p className="text-slate-500 text-sm">@Developer</p>
            </div>
            <div className="ml-auto md:ml-4 px-3 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full border border-blue-100 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Building in public
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-slate-900 mb-6 leading-[1.1]">
            Code with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Intelligence.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 mb-8 max-w-lg leading-relaxed">
            全栈开发者与 AI 探索者。
            <br />
            将复杂的技术转化为优雅的用户体验。
          </p>

          <div className="flex flex-wrap gap-4 mb-10">
             <button 
               onClick={() => navigate('/works')}
               className="group bg-slate-900 text-white px-8 py-4 rounded-full font-medium hover:bg-slate-800 transition-all flex items-center gap-2 shadow-xl shadow-slate-900/20"
             >
               查看精选作品 
               <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
             </button>
             <button 
               onClick={() => navigate('/about')}
               className="px-8 py-4 rounded-full font-medium text-slate-600 hover:bg-slate-100 transition-all border border-slate-200"
             >
               关于我
             </button>
          </div>

          <div className="flex items-center gap-6 text-slate-400">
            <a href="https://github.com" className="hover:text-slate-900 transition-colors"><Github size={24} /></a>
            <a href="https://twitter.com" className="hover:text-blue-500 transition-colors"><Twitter size={24} /></a>
            <a href="mailto:contact@example.com" className="hover:text-red-500 transition-colors"><Mail size={24} /></a>
            <div className="w-px h-6 bg-slate-300 mx-2"></div>
            <div className="flex gap-4">
              <div title="Full Stack Developer" className="text-slate-400 hover:text-slate-900 transition-colors cursor-help">
                <Terminal size={20} />
              </div>
              <div title="Artificial Intelligence" className="text-slate-400 hover:text-purple-500 transition-colors cursor-help">
                <Cpu size={20} />
              </div>
              <div title="High Performance" className="text-slate-400 hover:text-yellow-500 transition-colors cursor-help">
                <Zap size={20} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Visual Showcase */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, rotateY: 30 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative hidden lg:block perspective-1000"
        >
          {/* Decorative shapes behind */}
          <div className="absolute top-10 right-10 w-32 h-32 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-10 left-10 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-32 h-32 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

          <div className="relative transform rotate-y-12 hover:rotate-y-0 transition-transform duration-700 ease-out preserve-3d">
            <CodeWindow />
            
            {/* Floating Card 1 */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-12 -right-12 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-xl border border-white/50 w-48"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <Zap size={16} />
                </div>
                <div>
                  <div className="text-xs text-slate-500">Performance</div>
                  <div className="font-bold text-slate-900">98/100</div>
                </div>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-[98%]"></div>
              </div>
            </motion.div>

            {/* Floating Card 2 */}
            <motion.div 
              animate={{ y: [0, 15, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-8 -left-8 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-xl border border-white/50 w-56"
            >
               <div className="flex justify-between items-center mb-2">
                 <span className="text-xs font-semibold text-slate-900">Recent Commit</span>
                 <span className="text-[10px] text-slate-400">2m ago</span>
               </div>
               <div className="flex items-center gap-2 text-sm text-slate-600">
                 <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                 feat: add AI agent integration
               </div>
            </motion.div>
          </div>
        </motion.div>

      </div>
    </AppleSection>
  );
};

export default HeroApple;
