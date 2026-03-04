import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  build: {
    rollupOptions: {
      external: [
        // 外部依赖配置
      ],
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        globals: {
          // 全局变量配置
        },
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, '/');

          if (
            normalizedId.includes('/node_modules/@tiptap/') ||
            normalizedId.includes('/node_modules/prosemirror')
          ) {
            return 'admin-editor-vendor';
          }

          if (
            normalizedId.includes('/node_modules/react-markdown') ||
            normalizedId.includes('/node_modules/remark-gfm') ||
            normalizedId.includes('/node_modules/rehype-')
          ) {
            return 'markdown-vendor';
          }

          if (
            normalizedId.includes('/node_modules/react/') ||
            normalizedId.includes('/node_modules/react-dom/') ||
            normalizedId.includes('/node_modules/react-router-dom/')
          ) {
            return 'react-vendor';
          }

          if (normalizedId.includes('/node_modules/sonner/')) {
            return 'toast-vendor';
          }

          if (normalizedId.includes('/node_modules/framer-motion/')) {
            return 'motion-vendor';
          }

          if (normalizedId.includes('/node_modules/lucide-react/')) {
            return 'icons-vendor';
          }

          if (
            normalizedId.includes('/node_modules/axios/') ||
            normalizedId.includes('/node_modules/clsx/') ||
            normalizedId.includes('/node_modules/tailwind-merge/') ||
            normalizedId.includes('/node_modules/zod/')
          ) {
            return 'utils-vendor';
          }
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
    proxy: {
      '/api': {
        target: 'http://localhost:3006',
        changeOrigin: true,
      }
    },
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
      'react-router-dom'
    ],
    // 排除大型可选依赖
    exclude: ['three']
  }
});
