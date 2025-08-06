import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

function getPlugins() {
  const plugins = [react(), tsconfigPaths()];
  return plugins;
}

export default defineConfig({
  plugins: getPlugins(),
  build: {
    // 代码分割优化
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: {
          // React 核心库 - 最高优先级
          'react-core': ['react', 'react-dom'],
          'react-router': ['react-router-dom'],
          
          // ECharts 相关 - 大型图表库
          echarts: ['echarts'],
          'echarts-react': ['echarts-for-react'],
          
          // Markdown 相关
          'markdown-core': ['react-markdown'],
          'markdown-editor': ['@uiw/react-md-editor'],
          'markdown-plugins': ['remark-gfm'],
          
          // 语法高亮
          'syntax-highlighter': ['react-syntax-highlighter'],
          
          // 3D 库
          three: ['three'],
          
          // 动画库
          'framer-motion': ['framer-motion'],
          
          // 其他第三方库
            vendor: ['axios', 'clsx', 'tailwind-merge', 'zod']
        }
      }
    },
    // 启用压缩
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
        passes: 2
      },
      mangle: {
        safari10: true
      },
      format: {
        comments: false
      }
    },
    // 设置chunk大小警告阈值
    chunkSizeWarningLimit: 800
  },
  // 开发服务器优化
  server: {
    // 预热常用文件
    warmup: {
      clientFiles: ['./src/pages/Home.tsx', './src/components/PublicNav.tsx']
    }
  },
  // 依赖预构建优化
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'echarts',
      'echarts-for-react'
    ],
    // 排除大型可选依赖
    exclude: ['three']
  }
});
