import { memo } from 'react';

// 空状态组件
const Empty = memo(function Empty({ message = "暂无内容" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-20 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <i className="fas fa-box-open text-2xl text-slate-400"></i>
      </div>
      <h3 className="text-lg font-medium text-slate-800 mb-1">{message}</h3>
      <p className="text-slate-500 text-sm">请稍后再来查看</p>
    </div>
  );
});

export default Empty;
