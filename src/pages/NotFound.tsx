import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-16 px-4">
      <h1 className="text-5xl font-bold mb-4 text-gray-800">404</h1>
      <p className="text-xl text-gray-600 mb-8">页面未找到</p>
      <Link 
        to="/" 
        className="px-6 py-3 bg-[#165DFF] text-white rounded-full font-medium hover:bg-opacity-90 transition"
      >
        返回首页
      </Link>
    </div>
  );
};

export default NotFound;