import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="py-8 px-6 bg-slate-900 text-white">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0 text-center md:text-left">
            <div className="text-2xl font-bold text-white mb-2">HJXLOG</div>
            <p className="text-slate-400">创意设计与前沿开发</p>
          </div>
          
          <div className="text-center md:text-right">
            <p className="text-slate-400 mb-2">© 2023 HJXLOG. 保留所有权利.</p>
            <p className="text-slate-400">专注于创意设计与技术开发</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;