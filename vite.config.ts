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
        manualChunks: {
          // 将大型第三方库分离到单独的chunk
          'echarts': ['echarts', 'echarts-for-react'],
          'three': ['three'],
          'framer-motion': ['framer-motion'],
          'markdown': ['react-markdown', '@uiw/react-md-editor', 'remark-gfm'],
          'syntax-highlighter': ['react-syntax-highlighter'],
          'vendor': ['react', 'react-dom', 'react-router-dom']
        }
      }
    },
    // 启用压缩
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    // 设置chunk大小警告阈值
    chunkSizeWarningLimit: 1000
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
