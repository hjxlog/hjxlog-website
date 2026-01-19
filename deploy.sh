#!/bin/bash

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}           项目部署启动脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo

echo -e "${BLUE}[1/4] 正在拉取最新代码...${NC}"
git pull origin main
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 拉取代码失败！${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 代码拉取成功${NC}"
echo

echo -e "${BLUE}[2/4] 正在构建Docker镜像...${NC}"
docker compose build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 构建镜像失败！${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 镜像构建成功${NC}"
echo

echo -e "${BLUE}[3/4] 正在停止Docker容器...${NC}"
docker compose down
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️ 停止容器时出现警告，继续执行...${NC}"
fi
echo -e "${GREEN}✅ 容器停止完成${NC}"
echo

echo -e "${BLUE}[4/4] 正在启动服务（后台模式）...${NC}"
docker compose up -d
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 启动服务失败！${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 服务启动成功${NC}"
echo

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}           部署完成！${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}服务已在后台运行${NC}"
echo -e "可以通过 'docker compose logs -f' 查看日志"
echo -e "可以通过 'docker compose ps' 查看容器状态"
echo
