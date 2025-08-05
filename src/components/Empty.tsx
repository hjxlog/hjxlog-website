// 移除对lib/utils的依赖，直接定义cn函数
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// 通用按钮组件
export function Button({
  children,
  type = "button",
  variant = "primary",
  className = "",
  ...props
}) {
  const baseStyles = "px-4 py-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variants = {
    primary: "bg-gradient-to-r from-[#165DFF] to-[#36CFC9] text-white shadow-lg hover:shadow-xl focus:ring-[#165DFF]/50",
    outline: "border border-[#165DFF] text-[#165DFF] hover:bg-[#165DFF] hover:text-white focus:ring-[#165DFF]/50",
    text: "text-[#165DFF] hover:bg-[#165DFF]/10 focus:ring-[#165DFF]/50"
  };
  
  return (
    <button
      type={type}
      className={cn(baseStyles, variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}

// 玻璃态卡片组件
export function GlassCard({ children, className = "", ...props }) {
  return (
    <div
      className={cn(
        "glass-card p-6 rounded-xl transition-all",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// 加载中组件 (Loading)
export function Loading() {
  return (
    <div className="flex items-center justify-center space-x-2">
      <div className="w-3 h-3 bg-[#165DFF] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-3 h-3 bg-[#165DFF] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-3 h-3 bg-[#165DFF] rounded-full animate-bounce"></div>
    </div>
  );
}

// 空状态组件
export function Empty({ message = "暂无内容" }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-20 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <i className="fas fa-box-open text-2xl text-slate-400"></i>
      </div>
      <h3 className="text-lg font-medium text-slate-800 mb-1">{message}</h3>
      <p className="text-slate-500 text-sm">请稍后再来查看</p>
    </div>
  );
}