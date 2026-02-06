# 外部 API 接入文档（OpenClaw / 第三方）

## 1. 接入目标
第三方系统通过 HTTP 调用将每日汇报推送到后台 Dashboard 的 `OpenClaw 每日汇报` 模块。

- 推送接口：`POST /api/external/openclaw/reports`
- 认证方式：`Authorization: Bearer <API_KEY>`
- 数据落库：`openclaw_daily_reports`

---

## 2. 前置条件
1. 向管理员获取一个可用 API Key（在 Dashboard `系统 -> API Key管理` 创建）。
2. 确认服务地址（例如 `https://your-domain.com`）。

---

## 3. 一次完整调用（curl）

### 3.1 健康检查
```bash
curl -sS "https://your-domain.com/api/external/health"
```

成功示例：
```json
{"success":true,"service":"external-api","status":"running","timestamp":"2026-02-06T07:21:39.060Z"}
```

### 3.2 推送每日汇报
```bash
curl -sS -X POST "https://your-domain.com/api/external/openclaw/reports" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "reportDate": "2026-02-06",
    "title": "OpenClaw 每日汇报",
    "content": "## 今日执行\n- 抓取数据\n- 生成日报\n- 推送后台\n\n## 结论\n链路正常",
    "status": "ok",
    "tasks": [
      {"title": "抓取数据", "done": true},
      {"title": "生成日报", "done": true},
      {"title": "推送后台", "done": true}
    ],
    "metadata": {
      "env": "prod",
      "run_id": "openclaw-20260206-001"
    }
  }'
```

成功示例：
```json
{
  "success": true,
  "message": "汇报推送成功",
  "data": {
    "id": 1,
    "source": "openclaw",
    "report_date": "2026-02-05T16:00:00.000Z",
    "title": "OpenClaw 每日汇报",
    "content": "## 今日执行...",
    "status": "ok",
    "tasks": [...],
    "metadata": {...},
    "created_at": "2026-02-06T07:43:23.000Z",
    "updated_at": "2026-02-06T07:43:23.000Z"
  }
}
```

说明：`report_date` 以数据库时间存储，可能显示为 UTC 时间戳；Dashboard 已做日期格式化展示。

### 3.3 常见失败示例

无效/禁用 key：
```json
{"success":false,"message":"无效或已禁用的令牌"}
```

缺少 token：
```json
{"success":false,"message":"缺少认证令牌"}
```

缺少 content：
```json
{"success":false,"message":"content 不能为空"}
```

---

## 4. 请求字段说明

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `reportDate` | string | 否 | 建议 `YYYY-MM-DD`，不传则按服务器当前日期 |
| `title` | string | 否 | 汇报标题 |
| `content` | string | 是 | 汇报正文（支持 Markdown） |
| `status` | string | 否 | `ok` / `warning` / `error`，默认 `ok` |
| `tasks` | array | 否 | 任务数组，元素支持 `{title, done, detail}` |
| `metadata` | object | 否 | 扩展信息 |

---

## 5. 第三方接入建议
1. 固定每天推送 1 次（可重试）。
2. `reportDate` 固定传业务日期，避免跨时区歧义。
3. 失败重试建议：指数退避（如 1s/3s/9s），最多 3 次。
4. 不要把 API Key 写入日志或前端代码。

---

## 6. 本地联调用地址
- `http://localhost:3006/api/external/health`
- `http://localhost:3006/api/external/openclaw/reports`
