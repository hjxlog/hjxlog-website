# 构建阶段
FROM node:20-bullseye-slim AS build
WORKDIR /app

# 先复制依赖文件
COPY package*.json ./

# 设置淘宝 NPM 镜像（加速 npm install）
RUN npm config set registry https://registry.npmmirror.com

# 安装依赖（严格使用 lockfile，避免 Docker 构建时重新解析依赖版本）
RUN npm ci --include=optional --no-audit --no-fund
RUN ROLLUP_VERSION="$(node -p "require('./package-lock.json').packages?.['node_modules/rollup']?.version || require('./package-lock.json').dependencies?.rollup?.version || ''")" \
  && if [ -n "$ROLLUP_VERSION" ]; then npm install --no-save --no-audit --no-fund "@rollup/rollup-linux-x64-gnu@${ROLLUP_VERSION}"; fi

# 复制源码
COPY . .

RUN npm run build

# 运行阶段：用 nginx 提供静态资源服务
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
