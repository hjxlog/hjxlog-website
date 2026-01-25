# 构建阶段
FROM node:20-bullseye-slim AS build
WORKDIR /app

# 先复制依赖文件
COPY package*.json ./

# 设置淘宝 NPM 镜像（加速 npm install）
RUN npm config set registry https://registry.npmmirror.com

# 安装依赖（优先使用 lock；如可选依赖缺失则回退重装）
RUN npm install --include=optional --no-audit --no-fund \
  || (rm -f package-lock.json && npm install --no-audit --no-fund)

# 复制源码
COPY . .

RUN npm run build

# 运行阶段：用 nginx 提供静态资源服务
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
