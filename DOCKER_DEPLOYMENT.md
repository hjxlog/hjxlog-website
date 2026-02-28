# Docker 部署指南

本项目已配置为支持 Docker 容器化部署，包含前端、后端和数据库的完整解决方案。

## 项目架构

- **前端**: React + Vite + Nginx (端口 80)
- **后端**: Node.js + Express (端口 3006)
- **数据库**: PostgreSQL (端口 5432)

## 快速开始

### 前置要求

- Docker Engine 20.10+
- Docker Compose 2.0+

### 一键部署

```bash
# 克隆项目
git clone <your-repo-url>
cd hjxlog-blog

# 启动所有服务
docker-compose up -d
```

### 访问应用

- **前端应用**: http://localhost
- **后端 API**: http://localhost:3006
- **数据库**: localhost:5432

## 详细部署步骤

### 1. 构建镜像

```bash
# 构建所有服务
docker-compose build

# 或分别构建
docker-compose build frontend
docker-compose build backend
```

### 2. 启动服务

```bash
# 后台启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 3. 停止服务

```bash
# 停止所有服务
docker-compose down

# 停止并删除数据卷（谨慎使用）
docker-compose down -v
```

## 环境配置

### 数据库配置

数据库配置在 `docker-compose.yml` 中定义：

```yaml
environment:
  POSTGRES_DB: hjxlog
  POSTGRES_USER: jianxian
  POSTGRES_PASSWORD: 123456
```

### 后端环境变量

后端服务的环境变量：

```yaml
environment:
  DB_HOST: database
  DB_PORT: 5432
  DB_NAME: hjxlog
  DB_USER: jianxian
  DB_PASSWORD: 123456
  PORT: 3006
  NODE_ENV: production
  TRUST_PROXY: true
  TRUST_PROXY_HOPS: 2
  CLIENT_IP_PLACEHOLDER: 0.0.0.0
```

## 数据持久化

- 数据库数据存储在 Docker 卷 `postgres_data` 中
- 上传文件存储在 `./server/uploads` 目录中

## 健康检查

项目配置了健康检查：

- **数据库**: 检查 PostgreSQL 连接状态
- **后端**: 检查 `/api/health` 端点

## 开发环境

### 开发模式启动

```bash
# 仅启动数据库
docker-compose up -d database

# 本地运行前端和后端
npm run dev              # 前端
cd server && npm run dev # 后端
```

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f database
```

## 生产环境部署

### 1. 修改配置

生产环境部署前，请修改以下配置：

1. 更改数据库密码
2. 配置域名和 SSL
3. 调整资源限制

### 2. 使用生产配置

```bash
# 创建生产环境配置文件
cp docker-compose.yml docker-compose.prod.yml

# 修改生产配置
# 编辑 docker-compose.prod.yml

# 使用生产配置启动
docker-compose -f docker-compose.prod.yml up -d
```

### 3. 反向代理配置

如果使用 Nginx 作为反向代理，示例配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 故障排除

### 常见问题

1. **端口冲突**
   ```bash
   # 检查端口占用
   lsof -i :80
   lsof -i :3006
   lsof -i :5432
   ```

2. **数据库连接失败**
   ```bash
   # 检查数据库状态
   docker-compose exec database pg_isready -U jianxian -d hjxlog
   ```

3. **前端无法访问后端**
   - 检查 nginx 配置中的代理设置
   - 确认后端服务正常运行

### 重置环境

```bash
# 完全重置（删除所有数据）
docker-compose down -v
docker system prune -a
docker-compose up -d
```

## 监控和维护

### 备份数据库

```bash
# 备份数据库
docker-compose exec database pg_dump -U jianxian hjxlog > backup.sql

# 恢复数据库
docker-compose exec -T database psql -U jianxian hjxlog < backup.sql
```

### 更新应用

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose build
docker-compose up -d
```

## 安全建议

1. 更改默认密码
2. 使用环境变量文件管理敏感信息
3. 配置防火墙规则
4. 定期更新镜像
5. 启用 HTTPS

## 性能优化

1. 调整 PostgreSQL 配置
2. 配置 Nginx 缓存
3. 使用 CDN 加速静态资源
4. 监控资源使用情况

---

如有问题，请查看日志或提交 Issue。
