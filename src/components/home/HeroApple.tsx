import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Github, Twitter, Mail, Terminal, Zap, ArrowRight, Folder, BookOpen, Search, PenLine, List, Smartphone, Globe, Cpu, HardDrive, Monitor, Award, Briefcase } from 'lucide-react';
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

const AboutModal = ({ onClose }: { onClose: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden font-sans text-sm border border-slate-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Window Header */}
        <div className="h-8 bg-[#e3e3e3] border-b border-[#d1d1d1] flex items-center justify-between px-4">
           <div className="flex space-x-2">
              <button onClick={onClose} className="w-3 h-3 rounded-full bg-[#ff5f56] hover:bg-[#ff5f56]/80 border border-black/10 transition-colors"></button>
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-black/10"></div>
              <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-black/10"></div>
           </div>
           <div className="font-semibold text-slate-500 text-xs">关于我</div>
           <div className="w-14"></div>
        </div>

        {/* Combined Content Area */}
        <div className="p-8 md:p-10 max-h-[80vh] overflow-y-auto">
           <div className="flex flex-col md:flex-row gap-8 md:gap-12">
              {/* Left Column: Profile */}
              <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-6 shrink-0 md:w-1/3">
                 <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-br from-slate-200 to-white shadow-lg mx-auto md:mx-0">
                    <img 
                      src="https://file.hjxlog.com/blog/images/avatar.jpg" 
                      alt="Avatar" 
                      className="w-full h-full rounded-full object-cover"
                    />
                 </div>
                 <div>
                    <h2 className="text-2xl font-bold text-slate-900">Huang Jianxian</h2>
                    <p className="text-slate-500 text-xs font-medium mt-1">Independent Developer, 2026</p>
                 </div>
                 
                 <div className="space-y-3 text-xs w-full pt-2 border-t border-slate-100">
                    <div className="flex justify-between md:justify-start gap-4">
                       <span className="text-slate-500 font-semibold w-16 text-right md:text-left">角色</span>
                       <span className="text-slate-900">全栈工程师</span>
                    </div>
                    <div className="flex justify-between md:justify-start gap-4">
                       <span className="text-slate-500 font-semibold w-16 text-right md:text-left">驱动力</span>
                       <span className="text-slate-900">无限学习力</span>
                    </div>
                    <div className="flex justify-between md:justify-start gap-4">
                       <span className="text-slate-500 font-semibold w-16 text-right md:text-left">坐标</span>
                       <span className="text-slate-900">远程 / 数字游民</span>
                    </div>
                    <div className="flex justify-between md:justify-start gap-4">
                       <span className="text-slate-500 font-semibold w-16 text-right md:text-left">微信</span>
                       <span className="text-slate-900 select-all font-mono">hjx_log</span>
                    </div>
                 </div>
              </div>

              {/* Right Column: Skills & Contact */}
              <div className="flex-1 space-y-8 md:border-l border-slate-100 md:pl-10">
                 
                 {/* Skills Section */}
                 <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                       <Monitor size={16} className="text-blue-500" />
                       <h3 className="font-bold text-slate-900">核心技术栈</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                       {[
                         { label: "Frontend (React/Next.js)", color: "bg-blue-500", width: "90%" },
                         { label: "Backend (Node/Go)", color: "bg-purple-500", width: "85%" },
                         { label: "AI Engineering (LLM)", color: "bg-green-500", width: "80%" },
                         { label: "UI/UX Design", color: "bg-yellow-500", width: "75%" },
                       ].map((skill, i) => (
                         <div key={i} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-medium text-slate-600">
                               <span>{skill.label}</span>
                            </div>
                            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: skill.width }}
                                 transition={{ duration: 1, delay: 0.2 + (0.1 * i) }}
                                 className={`h-full ${skill.color} shadow-sm`}
                               />
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>

                 {/* Contact Section */}
                 <div className="space-y-4 pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-2 mb-2">
                       <Globe size={16} className="text-blue-500" />
                       <h3 className="font-bold text-slate-900">社交网络</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                       <a href="https://github.com" target="_blank" className="flex items-center gap-2 text-xs text-slate-600 hover:text-blue-600 transition-colors p-2 hover:bg-slate-50 rounded-lg -ml-2">
                          <Github size={14} /> GitHub 代码库
                       </a>
                       <a href="https://twitter.com" target="_blank" className="flex items-center gap-2 text-xs text-slate-600 hover:text-blue-600 transition-colors p-2 hover:bg-slate-50 rounded-lg -ml-2">
                          <Twitter size={14} /> Twitter 动态
                       </a>
                       <a href="/blogs" className="flex items-center gap-2 text-xs text-slate-600 hover:text-blue-600 transition-colors p-2 hover:bg-slate-50 rounded-lg -ml-2">
                          <BookOpen size={14} /> 技术博客
                       </a>
                       <a href="mailto:contact@hjxlog.com" className="flex items-center gap-2 text-xs text-slate-600 hover:text-blue-600 transition-colors p-2 hover:bg-slate-50 rounded-lg -ml-2">
                          <Mail size={14} /> Email
                       </a>
                    </div>
                 </div>

              </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
};

const TerminalModal = ({ onClose }: { onClose: () => void }) => {
  const [lines, setLines] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    const commands = [
      { text: "user@hjxlog:~$ neofetch", delay: 500 },
      { text: "Fetching system info...", delay: 800 },
      { text: "-----------------------", delay: 1000 },
      { text: "OS: macOS / Web", delay: 1100 },
      { text: "Host: JianXian's Portfolio", delay: 1200 },
      { text: "Kernel: React 18.2.0", delay: 1300 },
      { text: "Uptime: Forever", delay: 1400 },
      { text: "Shell: zsh 5.9", delay: 1500 },
      { text: "Resolution: Responsive", delay: 1600 },
      { text: "DE: Tailwind CSS", delay: 1700 },
      { text: "WM: Framer Motion", delay: 1800 },
      { text: "CPU: Human Brain (Neural Engine)", delay: 1900 },
      { text: "Memory: Infinite Learning Capacity", delay: 2000 },
      { text: "", delay: 2100 },
      { text: "user@hjxlog:~$ cat skills.txt", delay: 2500 },
      { text: "Languages: TypeScript, Python, Rust, Go", delay: 2800 },
      { text: "Frontend:  React, Next.js, Vue, Tailwind", delay: 2900 },
      { text: "Backend:   Node.js, PostgreSQL, Redis, Docker", delay: 3000 },
      { text: "AI/ML:     LangChain, OpenAI API, PyTorch", delay: 3100 },
      { text: "", delay: 3200 },
      { text: "user@hjxlog:~$ _", delay: 3500 },
    ];

    let timeouts: ReturnType<typeof setTimeout>[] = [];

    commands.forEach(({ text, delay }) => {
      const timeout = setTimeout(() => {
        setLines(prev => {
          // If the last line is a cursor line (ends with _), replace it or append new
          const newLines = [...prev];
          if (newLines.length > 0 && newLines[newLines.length - 1].endsWith('_')) {
             newLines.pop();
          }
          return [...newLines, text];
        });
        if (text.endsWith('_')) setIsTyping(false);
      }, delay);
      timeouts.push(timeout);
    });

    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-[#1e1e1e] rounded-xl shadow-2xl border border-slate-700/50 overflow-hidden font-mono text-sm"
        onClick={e => e.stopPropagation()}
      >
        {/* Window Header */}
        <div className="flex items-center px-4 py-3 bg-[#252526] border-b border-slate-700/50 justify-between">
          <div className="flex space-x-2">
            <button onClick={onClose} className="w-3 h-3 rounded-full bg-[#ff5f56] hover:bg-[#ff5f56]/80 transition-colors"></button>
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
            <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
          </div>
          <div className="text-xs text-slate-400">terminal — -zsh — 80x24</div>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>
        
        {/* Terminal Content */}
        <div className="p-6 text-slate-300 min-h-[400px] max-h-[60vh] overflow-y-auto font-mono">
           {lines.map((line, index) => (
             <div key={index} className="mb-1 whitespace-pre-wrap">
               {line.startsWith('user@hjxlog') ? (
                 <span className="text-green-400">{line}</span>
               ) : line.includes(':') && !line.startsWith('http') ? (
                 <span>
                   <span className="text-blue-400">{line.split(':')[0]}:</span>
                   {line.split(':').slice(1).join(':')}
                 </span>
               ) : (
                 line
               )}
             </div>
           ))}
           {isTyping && <span className="animate-pulse">_</span>}
        </div>
      </div>
    </motion.div>
  );
};





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
  const [activeModal, setActiveModal] = useState<string | null>(null);

  return (
    <AppleSection className="min-h-[90vh] flex items-center justify-center relative">
      <AnimatePresence>
        {activeModal === 'terminal' && (
          <TerminalModal onClose={() => setActiveModal(null)} />
        )}
        {activeModal === 'about' && (
          <AboutModal onClose={() => setActiveModal(null)} />
        )}
      </AnimatePresence>
      
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
               onClick={() => setActiveModal('about')}
               className="px-8 py-4 rounded-full font-medium text-slate-600 hover:bg-slate-100 transition-all border border-slate-200"
             >
               关于我
             </button>
          </div>

          <div className="flex items-center gap-6 text-slate-400">
            <a href="https://github.com/hjxlog" className="hover:text-slate-900 transition-colors"><Github size={24} /></a>
            <a href="https://twitter.com" className="hover:text-blue-500 transition-colors"><Twitter size={24} /></a>
            <a href="mailto:hjxlog@gmail.com" className="hover:text-red-500 transition-colors"><Mail size={24} /></a>
            <div className="w-px h-6 bg-slate-300 mx-2"></div>
            <div className="flex gap-4">
              <button 
                onClick={() => setActiveModal('terminal')}
                title="Full Stack Developer" 
                className="text-slate-400 hover:text-slate-900 transition-colors cursor-pointer hover:scale-110 transform duration-200"
              >
                <Terminal size={20} />
              </button>
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
