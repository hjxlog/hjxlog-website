#!/bin/bash

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

COMPOSE_FILE="docker-compose.bluegreen.yml"
INFRA_PROJECT="hjxlog-infra"
STATE_FILE=".deploy_active_slot"
UPSTREAM_FILE="ops/nginx/active-upstream.runtime.conf"
HEALTH_TIMEOUT=180

print_header() {
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}      HJXLOG 蓝绿部署脚本（无停机）${NC}"
  echo -e "${BLUE}========================================${NC}"
  echo
}

detect_active_slot() {
  if [ -f "$STATE_FILE" ]; then
    cat "$STATE_FILE"
    return
  fi

  if grep -q "hjxlog-backend-green" "$UPSTREAM_FILE" 2>/dev/null; then
    echo "green"
  else
    echo "blue"
  fi
}

opposite_slot() {
  if [ "$1" = "blue" ]; then
    echo "green"
  else
    echo "blue"
  fi
}

wait_healthy() {
  local container="$1"
  local start_time
  start_time=$(date +%s)

  while true; do
    local status
    status=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$container" 2>/dev/null || true)

    if [ "$status" = "healthy" ]; then
      echo -e "${GREEN}✅ ${container} 健康检查通过${NC}"
      break
    fi

    local now
    now=$(date +%s)
    if [ $((now - start_time)) -ge "$HEALTH_TIMEOUT" ]; then
      echo -e "${RED}❌ ${container} 健康检查超时（${HEALTH_TIMEOUT}s）${NC}"
      docker logs --tail 120 "$container" || true
      return 1
    fi

    echo -e "${YELLOW}⏳ 等待 ${container} 就绪（当前: ${status}）...${NC}"
    sleep 5
  done
}

switch_gateway_to_slot() {
  local slot="$1"
  cat > "$UPSTREAM_FILE" <<EOF
set \$frontend_target "hjxlog-frontend-${slot}:80";
set \$backend_target "hjxlog-backend-${slot}:3006";
EOF

  docker exec hjxlog-gateway nginx -s reload
  echo "$slot" > "$STATE_FILE"
}

print_header

if [ ! -f "$UPSTREAM_FILE" ]; then
  cp ops/nginx/active-upstream.conf.example "$UPSTREAM_FILE"
fi

ACTIVE_SLOT=$(detect_active_slot)
TARGET_SLOT=$(opposite_slot "$ACTIVE_SLOT")
TARGET_PROJECT="hjxlog-${TARGET_SLOT}"
OLD_PROJECT="hjxlog-${ACTIVE_SLOT}"

echo -e "${BLUE}当前活跃槽位: ${ACTIVE_SLOT}${NC}"
echo -e "${BLUE}目标发布槽位: ${TARGET_SLOT}${NC}"
echo

echo -e "${BLUE}[1/6] 拉取最新代码...${NC}"
git pull origin main
echo -e "${GREEN}✅ 代码拉取成功${NC}"
echo

echo -e "${BLUE}[2/6] 启动基础设施（database + gateway）...${NC}"
docker compose -p "$INFRA_PROJECT" -f "$COMPOSE_FILE" --profile infra up -d database gateway
echo -e "${GREEN}✅ 基础设施就绪${NC}"
echo

echo -e "${BLUE}[3/6] 构建新版本镜像...${NC}"
docker compose -f "$COMPOSE_FILE" build --no-cache backend frontend
echo -e "${GREEN}✅ 镜像构建成功${NC}"
echo

echo -e "${BLUE}[4/6] 启动目标槽位容器（${TARGET_SLOT}）...${NC}"
SLOT="$TARGET_SLOT" docker compose -p "$TARGET_PROJECT" -f "$COMPOSE_FILE" up -d backend frontend
echo -e "${GREEN}✅ 新槽位容器启动完成${NC}"
echo

echo -e "${BLUE}[5/6] 等待新槽位健康检查通过...${NC}"
wait_healthy "hjxlog-backend-${TARGET_SLOT}"
wait_healthy "hjxlog-frontend-${TARGET_SLOT}"
echo -e "${GREEN}✅ 新槽位健康检查通过${NC}"
echo

echo -e "${BLUE}[6/6] 切换网关流量到 ${TARGET_SLOT}...${NC}"
switch_gateway_to_slot "$TARGET_SLOT"

if curl -fsS --max-time 5 http://127.0.0.1:3001/api/health >/dev/null; then
  echo -e "${GREEN}✅ 网关切流验证通过${NC}"
else
  echo -e "${RED}❌ 网关切流验证失败，回滚到 ${ACTIVE_SLOT}${NC}"
  switch_gateway_to_slot "$ACTIVE_SLOT"
  exit 1
fi
echo

echo -e "${BLUE}清理旧槽位容器（${ACTIVE_SLOT}）...${NC}"
if docker compose -p "$OLD_PROJECT" -f "$COMPOSE_FILE" ps >/dev/null 2>&1; then
  SLOT="$ACTIVE_SLOT" docker compose -p "$OLD_PROJECT" -f "$COMPOSE_FILE" stop backend frontend || true
  SLOT="$ACTIVE_SLOT" docker compose -p "$OLD_PROJECT" -f "$COMPOSE_FILE" rm -f backend frontend || true
fi
echo -e "${GREEN}✅ 旧槽位已清理${NC}"
echo

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}             部署完成${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}当前活跃槽位: ${TARGET_SLOT}${NC}"
echo -e "查看网关日志: docker logs -f hjxlog-gateway"
echo -e "查看新槽位状态: docker compose -p ${TARGET_PROJECT} -f ${COMPOSE_FILE} ps"
