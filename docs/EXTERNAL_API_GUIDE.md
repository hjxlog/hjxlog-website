# 外部API功能使用说明

## 功能概述

外部API允许外部系统（如OpenClaw）通过HTTP请求向网站推送日记/动态数据。

**特性：**
- ✅ Token认证机制
- ✅ 支持Markdown格式内容
- ✅ 支持图片上传（自动上传到阿里云OSS）
- ✅ 默认私密状态（需手动审核后公开）
- ✅ IP限流保护

---

## 数据库初始化

### 方式1：使用初始化脚本（推荐）

```bash
cd ~/Documents/github/hjxlog-website/server
node scripts/init-external-api.js
```

脚本会自动：
1. 创建 `external_api_tokens` 表
2. 创建必要的索引
3. 生成并插入默认Token
4. 显示Token信息（请妥善保存）

### 方式2：手动执行SQL

如果数据库在Docker中运行：

```bash
# 进入数据库容器
docker exec -it hjxlog-database psql -U postgres -d postgres

# 执行SQL脚本
\i server/database/create_external_api_table.sql

# 查看Token
SELECT token, name, source FROM external_api_tokens;
```

---

## API使用方法

### 1. 推送日记/动态

**端点：** `POST /api/external/moments`

**请求头：**
```http
Content-Type: multipart/form-data
Authorization: Bearer <your_token>
```

**请求参数：**
- `content` (string, 必填): 日记内容（支持Markdown）
- `visibility` (string, 可选): 可见性，默认 `private`
- `images` (file[], 可选): 图片文件（最多9张，单张最大10MB）

**示例代码：**

```javascript
// 使用 fetch API
const formData = new FormData();
formData.append('content', '今天天气不错，写了一篇新文章...');
formData.append('visibility', 'private');

// 添加图片（可选）
if (imageFiles.length > 0) {
  imageFiles.forEach(file => {
    formData.append('images', file);
  });
}

fetch('http://your-domain.com/api/external/moments', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer oc_your_token_here'
  },
  body: formData
})
.then(res => res.json())
.then(data => console.log(data));
```

### 1.1 推送 OpenClaw 每日汇报（推荐）

**端点：** `POST /api/external/openclaw/reports`

**请求头：**
```http
Content-Type: application/json
Authorization: Bearer <your_token>
```

**请求体：**
```json
{
  "reportDate": "2026-02-06",
  "title": "OpenClaw 每日执行汇报",
  "content": "## 今日完成\n- 任务A\n- 任务B",
  "status": "ok",
  "tasks": [
    { "title": "抓取日报", "done": true },
    { "title": "同步知识库", "done": false, "detail": "目标接口超时" }
  ],
  "metadata": {
    "workspace": "prod",
    "duration_minutes": 42
  }
}
```

**说明：**
- 该接口会写入独立表 `openclaw_daily_reports`，不会进入 `moments`。
- 同一 `source + reportDate` 会自动覆盖更新，适合每日定时推送。

**成功响应：**
```json
{
  "success": true,
  "message": "日记推送成功",
  "data": {
    "id": 123,
    "content": "...",
    "visibility": "private",
    "images": ["https://oss.example.com/moment/xxx.jpg"],
    "created_at": "2026-02-04T23:50:00Z"
  }
}
```

### 2. 健康检查

**端点：** `GET /api/external/health`

```bash
curl http://your-domain.com/api/external/health
```

### 3. 查看Token信息

**端点：** `GET /api/external/tokens`

需要Token认证。

---

## Token管理

### 后台可视化管理（推荐）

在 Dashboard 新增了 `系统 -> API Key管理`，支持：
- 创建 Key（描述 + key）
- 禁用 / 启用
- 查看最近使用时间与 IP

### 查看所有Token

```sql
SELECT id, name, source, is_active, created_at FROM external_api_tokens;
```

### 创建新Token

```sql
INSERT INTO external_api_tokens (token, name, description, source, created_by)
VALUES (
    'new_token_here',
    '新Token名称',
    'Token描述',
    'source_name',
    'admin'
);
```

### 禁用Token

```sql
UPDATE external_api_tokens SET is_active = false WHERE token = 'token_to_disable';
```

---

## 工作流程

1. **外部系统调用API** → 携带Token + 数据
2. **服务器验证Token** → 检查是否有效
3. **上传图片到OSS** → 如有图片
4. **保存到数据库** → moments表，visibility='private'
5. **返回结果** → 成功或失败信息

6. **管理员审核** → 在后台将私密日记改为公开

---

## 安全建议

1. **定期更换Token** - 建议每3-6个月更换
2. **使用HTTPS** - 生产环境必须使用加密传输
3. **IP白名单** - 可添加IP限制增强安全性
4. **监控日志** - 定期查看system_logs表中的API调用记录

---

## 故障排查

### 问题：Token验证失败
- 检查Token是否正确（无多余空格）
- 确认Token在数据库中存在且is_active=true
- 检查Authorization header格式：`Bearer <token>`

### 问题：图片上传失败
- 检查OSS配置（.env文件）
- 确认图片格式（支持JPEG、PNG、GIF、WebP）
- 检查文件大小（单张最大10MB）

### 问题：数据库连接失败
- 确认数据库服务运行中
- 检查.env中的数据库配置
- 验证网络连接和端口

---

## 开发测试

本地测试端口：`http://localhost:3006`

完整URL示例：
```
POST http://localhost:3006/api/external/moments
```
