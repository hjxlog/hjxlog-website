# HJXLog 数据库设置指南

## 数据库信息
- **数据库名**: hjxlog
- **用户名**: postgres
- **密码**: 12345678
- **主机**: localhost
- **端口**: 5432

## 快速开始

### 1. 创建数据库表结构
在PostgreSQL中执行以下命令：

```bash
# 连接到PostgreSQL
psql -U postgres -d hjxlog

# 或者直接执行SQL文件
psql -U postgres -d hjxlog -f create_tables.sql
```

### 2. 插入测试数据
```bash
# 插入测试数据
psql -U postgres -d hjxlog -f insert_test_data.sql
```

### 3. 验证数据
```sql
-- 查看所有表
\dt

-- 查看博客数据
SELECT id, title, category, views, likes FROM blogs;

-- 查看作品数据
SELECT id, title, category, status FROM works;

-- 查看用户数据
SELECT id, username, email FROM users;
```

## 表结构说明

### blogs 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 主键，自增 |
| title | VARCHAR(255) | 博客标题 |
| excerpt | TEXT | 博客摘要 |
| content | TEXT | 博客内容（Markdown格式） |
| author | VARCHAR(100) | 作者 |
| category | VARCHAR(50) | 分类 |
| tags | TEXT[] | 标签数组 |
| published | BOOLEAN | 是否发布 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |
| views | INTEGER | 浏览次数 |
| likes | INTEGER | 点赞次数 |
| cover_image | TEXT | 封面图片URL |

### works 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 主键，自增 |
| title | VARCHAR(255) | 作品标题 |
| description | TEXT | 作品描述 |
| category | VARCHAR(50) | 作品分类 |
| status | VARCHAR(20) | 项目状态 |
| tags | TEXT[] | 标签数组 |
| technologies | TEXT[] | 技术栈数组 |
| project_url | TEXT | 项目链接 |
| github_url | TEXT | GitHub链接 |
| cover_image | TEXT | 封面图片URL |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### users 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 主键，自增 |
| username | VARCHAR(50) | 用户名 |
| email | VARCHAR(100) | 邮箱 |
| password_hash | VARCHAR(255) | 密码哈希 |
| avatar | TEXT | 头像URL |
| bio | TEXT | 个人简介 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

## 测试数据说明

### 博客数据特点
- 所有博客标题都带有 `【数据库数据】` 前缀，便于区分数据来源
- 包含8篇技术博客，涵盖前端、后端、数据库、架构等多个领域
- 每篇博客都有完整的内容、标签、分类等信息
- 包含真实的浏览量和点赞数据

### 作品数据特点
- 包含5个项目作品
- 涵盖不同的项目状态：completed、in-progress、planning
- 包含技术栈、项目链接、GitHub链接等信息

### 用户数据特点
- 包含3个测试用户：admin、hjx、guest
- 密码哈希为示例数据，实际使用时需要真实的bcrypt哈希

## 常用查询示例

### 查询已发布的博客
```sql
SELECT id, title, category, views, likes 
FROM blogs 
WHERE published = true 
ORDER BY created_at DESC;
```

### 按分类查询博客
```sql
SELECT id, title, views, likes 
FROM blogs 
WHERE category = '前端开发' AND published = true;
```

### 查询热门博客（按浏览量排序）
```sql
SELECT id, title, category, views, likes 
FROM blogs 
WHERE published = true 
ORDER BY views DESC 
LIMIT 5;
```

### 搜索博客（标题或标签）
```sql
SELECT id, title, category, tags 
FROM blogs 
WHERE published = true 
AND (
    title ILIKE '%React%' 
    OR 'React' = ANY(tags)
);
```

### 查询项目作品
```sql
SELECT id, title, category, status, technologies 
FROM works 
ORDER BY created_at DESC;
```

## 性能优化

数据库已经创建了以下索引：
- `idx_blogs_category` - 博客分类索引
- `idx_blogs_published` - 博客发布状态索引
- `idx_blogs_created_at` - 博客创建时间索引（降序）
- `idx_blogs_author` - 博客作者索引
- `idx_works_category` - 作品分类索引
- `idx_works_status` - 作品状态索引

## 自动更新时间

所有表都配置了自动更新 `updated_at` 字段的触发器，当记录被修改时会自动更新时间戳。

## 下一步

1. 执行上述SQL脚本创建表和插入数据
2. 在应用中配置数据库连接
3. 访问 `/database-test` 页面测试数据库连接
4. 查看博客页面，确认显示的是数据库数据（标题带有【数据库数据】前缀）