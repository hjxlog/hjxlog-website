-- Local debug test data for HJXLog
-- Execute after dbschema and (optionally) preset.

TRUNCATE TABLE
  ai_user_opinions,
  ai_daily_digests,
  ai_source_items,
  knowledge_base,
  chat_sessions,
  chat_rate_limits,
  chat_global_usage,
  task_time_logs,
  task_comments,
  tasks,
  projects,
  long_term_memory,
  daily_thoughts,
  openclaw_daily_reports,
  blog_views,
  view_logs,
  system_logs,
  photos,
  moments,
  works,
  blogs,
  users
RESTART IDENTITY CASCADE;

-- 插入用户数据
INSERT INTO users (username, email, password_hash, avatar, bio) VALUES
('admin', 'admin@hjxlog.com', '$2b$10$93QjprbEpLkLmz8.VqjGkOXyPJzZ02Dd01W5HVMxQK.cRQwxwkApG', '/avatars/admin.jpg', '博客系统管理员，专注于前端开发和技术分享'),
('hjx', 'hjx@hjxlog.com', '$2b$10$93QjprbEpLkLmz8.VqjGkOXyPJzZ02Dd01W5HVMxQK.cRQwxwkApG', '/avatars/hjx.jpg', '全栈开发工程师，热爱技术，喜欢分享编程经验'),
('guest', 'guest@hjxlog.com', '$2b$10$93QjprbEpLkLmz8.VqjGkOXyPJzZ02Dd01W5HVMxQK.cRQwxwkApG', '/avatars/guest.jpg', '访客用户');

-- 插入博客数据（带有【数据库数据】标识）
INSERT INTO blogs (title, excerpt, content, author, category, tags, published, featured, views, cover_image) VALUES
('【数据库数据】React 18 新特性深度解析：并发渲染的革命性变化', 
 '深入探讨React 18中的并发渲染、自动批处理、Suspense改进等核心特性，以及它们如何改变我们构建用户界面的方式。', 
 '# React 18 新特性深度解析

React 18 带来了许多令人兴奋的新特性，其中最重要的是并发渲染（Concurrent Rendering）。这个特性彻底改变了React处理更新的方式...

## 并发渲染的核心概念

并发渲染允许React在渲染过程中暂停和恢复工作，这意味着React可以：
- 优先处理高优先级的更新
- 在后台准备新的UI
- 避免阻塞主线程

## 自动批处理

React 18引入了自动批处理，这意味着多个状态更新会被自动合并到一个重新渲染中...

```javascript
// React 18 中的自动批处理
function App() {
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);

  function handleClick() {
    setCount(c => c + 1); // 不会立即重新渲染
    setFlag(f => !f); // 不会立即重新渲染
    // React 会批处理这些更新
  }

  return (
    <div>
      <button onClick={handleClick}>Next</button>
      <h1 style={{color: flag ? "blue" : "black"}}>{count}</h1>
    </div>
  );
}
```

## Suspense 改进

React 18 对 Suspense 进行了重大改进，现在支持服务端渲染...', 
 'HJX', '前端开发', 
 ARRAY['React', 'JavaScript', '前端框架', '性能优化', '并发渲染'], 
 true, true, 1250, 
 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop'),

('【数据库数据】TypeScript 5.0 新特性：装饰器和模板字符串类型', 
 '探索TypeScript 5.0中的装饰器支持、const断言改进、以及新的模板字符串类型功能，提升开发体验和类型安全。', 
 '# TypeScript 5.0 新特性详解

TypeScript 5.0 是一个重要的里程碑版本，带来了许多开发者期待已久的特性...

## 装饰器支持

TypeScript 5.0 正式支持了ECMAScript装饰器提案，这为我们提供了更强大的元编程能力...

```typescript
function logged(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  descriptor.value = function(...args: any[]) {
    console.log(`调用方法: ${propertyKey}`);
    return originalMethod.apply(this, args);
  };
}

class Calculator {
  @logged
  add(a: number, b: number) {
    return a + b;
  }
}
```

## 模板字符串类型改进

新版本对模板字符串类型进行了重大改进...', 
 'HJX', '前端开发', 
 ARRAY['TypeScript', 'JavaScript', '类型系统', '装饰器'], 
 true, true, 980, 
 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&h=400&fit=crop'),

('【数据库数据】Vue 3 Composition API 最佳实践指南', 
 '从基础概念到高级技巧，全面掌握Vue 3 Composition API的使用方法，构建更加灵活和可维护的Vue应用。', 
 '# Vue 3 Composition API 最佳实践

Composition API是Vue 3最重要的新特性之一，它为我们提供了更灵活的组件逻辑组织方式...

## 为什么选择Composition API

相比于Options API，Composition API具有以下优势：
- 更好的逻辑复用
- 更好的TypeScript支持
- 更灵活的代码组织
- 更小的打包体积

## 基础用法

```vue
<script setup>
import { ref, computed, onMounted } from ''vue''

const count = ref(0)
const doubleCount = computed(() => count.value * 2)

function increment() {
  count.value++
}

onMounted(() => {
  console.log(''组件已挂载'')
})
</script>
```', 
 'HJX', '前端开发', 
 ARRAY['Vue.js', 'Composition API', 'JavaScript', '前端框架'], 
 true, true, 1450, 
 'https://images.unsplash.com/photo-1611262588024-d12430b98920?w=800&h=400&fit=crop'),

('【数据库数据】Node.js 性能优化：从理论到实践', 
 '深入分析Node.js应用的性能瓶颈，介绍内存管理、事件循环优化、集群部署等实用的性能优化技巧。', 
 '# Node.js 性能优化实战

Node.js以其高性能和非阻塞I/O而闻名，但在实际应用中，我们仍然需要注意许多性能优化的细节...

## 事件循环优化

Node.js的事件循环是其高性能的核心，理解事件循环的工作原理对性能优化很重要...

## 内存管理

内存泄漏是Node.js应用中常见的性能问题：

```javascript
// 避免全局变量
let globalCache = {}; // 可能导致内存泄漏

// 使用WeakMap
const cache = new WeakMap();

// 及时清理定时器
const timer = setInterval(() => {
  // 一些操作
}, 1000);

// 记得清理
clearInterval(timer);
```', 
 'HJX', '后端开发', 
 ARRAY['Node.js', '性能优化', 'JavaScript', '后端'], 
 true, true, 890, 
 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=400&fit=crop'),

('【数据库数据】PostgreSQL 高级查询技巧与性能优化', 
 '深入探讨PostgreSQL的高级查询功能、索引优化策略、查询计划分析等数据库性能优化技术。', 
 '# PostgreSQL 高级查询技巧与性能优化

PostgreSQL是一个功能强大的开源关系型数据库，掌握其高级特性对于构建高性能应用至关重要...

## 复杂查询优化

### 窗口函数的使用

```sql
-- 计算每个分类中的排名
SELECT 
    title,
    category,
    views,
    ROW_NUMBER() OVER (PARTITION BY category ORDER BY views DESC) as rank
FROM blogs
WHERE published = true;
```

### CTE（公用表表达式）

```sql
WITH popular_blogs AS (
    SELECT * FROM blogs 
    WHERE views > 1000
)
SELECT category, COUNT(*) as count
FROM popular_blogs
GROUP BY category;
```

## 索引策略

### 复合索引

```sql
-- 为常用查询创建复合索引
CREATE INDEX idx_blogs_category_published 
ON blogs(category, published);
```

### 部分索引

```sql
-- 只为已发布的博客创建索引
CREATE INDEX idx_published_blogs_views 
ON blogs(views) 
WHERE published = true;
```', 
 'HJX', '数据库', 
 ARRAY['PostgreSQL', '数据库优化', 'SQL', '性能调优'], 
 true, true, 756, 
 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&h=400&fit=crop'),

('【数据库数据】微前端架构实践：从单体到微服务的前端演进', 
 '探讨微前端架构的设计理念、技术选型和实施策略，分享大型前端项目的架构演进经验。', 
 '# 微前端架构实践

随着前端应用规模的不断增长，传统的单体前端架构面临着越来越多的挑战...

## 微前端的核心理念

微前端架构将前端应用分解为多个独立的、可部署的微应用：
- 技术栈无关
- 独立开发和部署
- 运行时集成
- 团队自治

## 技术选型

常见的微前端解决方案包括：
- Single-SPA
- qiankun
- Module Federation
- iframe（传统方案）

```javascript
// qiankun 示例
import { registerMicroApps, start } from ''qiankun'';

registerMicroApps([
  {
    name: ''react-app'',
    entry: ''//localhost:3000'',
    container: ''#container'',
    activeRule: ''/react'',
  },
]);

start();
```', 
 'HJX', '架构设计', 
 ARRAY['微前端', '架构设计', 'qiankun', '模块联邦'], 
 true, true, 1120, 
 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop'),

('【数据库数据】Docker 容器化部署实战：从开发到生产', 
 '详细介绍Docker容器化技术的核心概念、最佳实践和生产环境部署策略，助力现代化应用部署。', 
 '# Docker 容器化部署实战

Docker已经成为现代应用部署的标准工具，它解决了"在我机器上能运行"的经典问题...

## Docker基础概念

- **镜像（Image）**：应用的只读模板
- **容器（Container）**：镜像的运行实例
- **Dockerfile**：构建镜像的指令文件
- **仓库（Repository）**：存储镜像的地方

## Dockerfile最佳实践

```dockerfile
# 使用官方Node.js镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]
```', 
 'HJX', 'DevOps', 
 ARRAY['Docker', '容器化', '部署', 'DevOps'], 
 true, true, 923, 
 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&h=400&fit=crop'),

('【数据库数据】全栈开发实战：构建现代化Web应用', 
 '从前端到后端，从数据库到部署，全面介绍现代化Web应用的开发流程和最佳实践。', 
 '# 全栈开发实战指南

现代化的Web应用开发需要掌握前端、后端、数据库等多个技术栈...

## 技术栈选择

### 前端技术栈
- React/Vue/Angular
- TypeScript
- Tailwind CSS
- Vite/Webpack

### 后端技术栈
- Node.js/Python/Java
- Express/FastAPI/Spring Boot
- PostgreSQL/MongoDB
- Redis

### 部署和运维
- Docker
- Nginx
- CI/CD
- 云服务

## 项目架构

```
project/
├── frontend/          # 前端应用
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/           # 后端API
│   ├── src/
│   ├── tests/
│   └── package.json
├── database/          # 数据库脚本
│   ├── migrations/
│   └── seeds/
└── docker-compose.yml # 容器编排
```', 
 'HJX', '全栈开发', 
 ARRAY['全栈开发', 'React', 'Node.js', 'PostgreSQL', 'Docker'], 
 true, true, 1456, 
 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=800&h=400&fit=crop');

-- 插入作品数据
INSERT INTO works (title, description, content, category, status, tags, technologies, features, challenges, screenshots, project_url, github_url, cover_image, featured) VALUES
('HJXLog 博客系统', 
 '基于React和Node.js构建的现代化博客系统，支持Markdown编辑、标签分类、搜索功能等。', 
 '# HJXLog 博客系统

这是一个现代化的全栈博客系统，采用React + Node.js + PostgreSQL技术栈构建。系统具有完整的前后端分离架构，支持响应式设计，提供了丰富的内容管理功能。

## 项目背景

随着个人博客和技术分享的需求增长，我决定构建一个功能完善、性能优秀的博客系统。该系统不仅满足个人使用需求，也可以作为学习全栈开发的实践项目。

## 核心功能

系统包含了博客管理、作品展示、用户认证等核心模块，采用现代化的开发技术和最佳实践，确保代码质量和可维护性。

## 技术亮点

- 采用TypeScript提供类型安全
- 使用Tailwind CSS实现响应式设计
- PostgreSQL数据库提供可靠的数据存储
- 完整的API设计和文档
- 容器化部署支持', 
 'Web应用', 'completed', 
 ARRAY['博客', '全栈', 'CMS'], 
 ARRAY['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind CSS'], 
 ARRAY['Markdown编辑器', '博客分类管理', '标签系统', '搜索功能', '响应式设计', '用户认证', 'SEO优化', '评论系统'],
 ARRAY['前后端分离架构设计', 'PostgreSQL数据库优化', 'React性能优化', 'API接口设计', 'TypeScript类型系统集成'],
 ARRAY['https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop'],
 'https://hjxlog.com', 
 'https://github.com/hjx/hjxlog-blog', 
 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=400&fit=crop', true),

('React 组件库', 
 '企业级React组件库，包含常用的UI组件，支持主题定制和TypeScript。', 
 '# React 企业级组件库

这是一个专为企业级应用设计的React组件库，提供了丰富的UI组件和完善的开发工具链。组件库遵循现代设计规范，支持主题定制，具有良好的可访问性和国际化支持。

## 设计理念

组件库采用原子设计理论，从基础原子组件到复杂的模板组件，提供了完整的设计系统。每个组件都经过精心设计和测试，确保在各种场景下的稳定性和一致性。

## 开发体验

提供了完整的TypeScript类型定义，支持IDE智能提示。配备了Storybook文档站点，方便开发者查看组件示例和API文档。

## 质量保证

每个组件都有完整的单元测试覆盖，使用Jest和React Testing Library进行测试。持续集成确保代码质量和组件的稳定性。', 
 '开源项目', 'in-progress', 
 ARRAY['组件库', 'UI', 'React'], 
 ARRAY['React', 'TypeScript', 'Storybook', 'Jest'], 
 ARRAY['丰富的UI组件', '主题定制系统', 'TypeScript支持', 'Storybook文档', '单元测试覆盖', '可访问性支持', '国际化支持', '响应式设计'],
 ARRAY['组件API设计的一致性', '主题系统的灵活性', 'TypeScript类型定义的完整性', '组件性能优化', '跨浏览器兼容性'],
 ARRAY['https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop'],
 'https://ui.hjxlog.com', 
 'https://github.com/hjx/react-ui-lib', 
 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop', true),

('微前端架构方案', 
 '基于qiankun的微前端架构解决方案，支持多技术栈应用集成。', 
 '# 微前端架构解决方案

这是一个基于qiankun框架的微前端架构实践项目，展示了如何将大型前端应用拆分为多个独立的微应用，实现技术栈无关的应用集成。

## 架构设计

采用主应用 + 微应用的架构模式，主应用负责路由管理和应用注册，微应用独立开发和部署。支持React、Vue、Angular等多种技术栈的应用集成。

## 核心特性

- 技术栈无关：支持任意技术栈的微应用
- 独立开发：各团队可以独立开发和部署
- 样式隔离：自动处理样式冲突问题
- 通信机制：提供应用间通信解决方案

## 实践经验

项目总结了微前端架构的最佳实践，包括应用拆分策略、部署方案、性能优化等方面的经验。', 
 '架构方案', 'completed', 
 ARRAY['微前端', '架构', 'qiankun'], 
 ARRAY['qiankun', 'React', 'Vue', 'Angular', 'Webpack'], 
 ARRAY['多技术栈支持', '应用独立部署', '样式隔离', '应用间通信', '路由管理', '状态共享', '错误边界', '性能监控'],
 ARRAY['应用拆分粒度的把握', '应用间通信机制设计', '样式隔离方案实现', '公共依赖管理', '部署策略优化'],
 ARRAY['https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop'],
 null, 
 'https://github.com/hjx/micro-frontend-demo', 
 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop', true),

('Node.js API 框架', 
 '轻量级的Node.js API开发框架，集成了认证、日志、缓存等常用功能。', 
 '# Node.js API 开发框架

这是一个轻量级但功能完整的Node.js API开发框架，旨在提高API开发效率，减少重复代码。框架集成了认证、日志、缓存、数据验证等常用功能。

## 框架特性

框架采用模块化设计，开发者可以根据需要选择使用的功能模块。提供了丰富的中间件和工具函数，支持快速构建RESTful API。

## 核心模块

- 认证模块：支持JWT、OAuth等多种认证方式
- 日志模块：结构化日志记录和查询
- 缓存模块：Redis缓存集成
- 数据验证：请求参数验证和转换
- 错误处理：统一的错误处理机制

## 开发体验

提供了完整的TypeScript支持和API文档生成工具，支持热重载开发。内置了常用的开发和调试工具。', 
 '开源项目', 'planning', 
 ARRAY['API', 'Node.js', '框架'], 
 ARRAY['Node.js', 'Express', 'TypeScript', 'Redis', 'JWT'], 
 ARRAY['JWT认证系统', '结构化日志', 'Redis缓存集成', '参数验证', '错误处理', 'API文档生成', '热重载开发', '中间件系统'],
 ARRAY['框架架构设计', '性能优化策略', '安全性考虑', '扩展性设计', '文档和示例完善'],
 ARRAY['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&h=600&fit=crop'],
 null, 
 'https://github.com/hjx/node-api-framework', 
 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=400&fit=crop', true),

('数据可视化平台', 
 '基于D3.js和React的数据可视化平台，支持多种图表类型和实时数据更新。', 
 '# 数据可视化平台

这是一个功能强大的数据可视化平台，基于D3.js和React构建，支持多种图表类型和实时数据展示。平台提供了直观的数据分析和展示能力。

## 平台特色

平台支持多种数据源接入，包括数据库、API、文件等。提供了丰富的图表组件和自定义配置选项，用户可以轻松创建专业的数据可视化报表。

## 技术实现

采用React + D3.js的技术组合，React负责组件管理和状态控制，D3.js负责复杂的数据可视化渲染。WebSocket实现实时数据更新。

## 应用场景

适用于业务数据分析、监控大屏、报表系统等场景。支持响应式设计，可以在各种设备上正常使用。', 
 'Web应用', 'in-progress', 
 ARRAY['数据可视化', '图表', '实时'], 
 ARRAY['React', 'D3.js', 'WebSocket', 'Node.js'], 
 ARRAY['多种图表类型', '实时数据更新', '数据源接入', '自定义配置', '响应式设计', '交互式图表', '数据导出', '主题定制'],
 ARRAY['大数据量渲染性能', '实时数据同步机制', '复杂图表交互设计', '多数据源整合', '移动端适配优化'],
 ARRAY['https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&h=600&fit=crop'],
 'https://dataviz.hjxlog.com', 
 'https://github.com/hjx/data-visualization', 
 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop', true);



-- 系统日志测试数据
INSERT INTO system_logs (log_type, level, module, action, description, user_id, username, ip_address, user_agent, request_method, request_url, request_params, response_status, execution_time, error_message, error_stack, extra_data, created_at, request_data, response_data) VALUES
('request', 'INFO', 'auth', 'login', '用户登录成功', 1, 'admin', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'POST', '/api/auth/login', '{"remember_me": true}', 200, 150, NULL, NULL, NULL, CURRENT_TIMESTAMP, '{"username": "admin", "remember_me": true}', '{"status": "success", "token": "jwt_token_here"}'),
('error', 'ERROR', 'blog', 'create', '创建博客失败：标题不能为空', 2, 'user2', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'POST', '/api/blogs', '{"content": "测试内容"}', 400, 50, '标题不能为空', 'ValidationError: title is required', NULL, CURRENT_TIMESTAMP, '{"title": "", "content": "测试内容"}', NULL),
('system', 'WARN', 'database', 'backup', '数据库备份完成，但存在警告', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 30000, '备份过程中发现性能问题', NULL, '{"backup_size": "1.2GB", "warnings": ["某些表未优化"]}', CURRENT_TIMESTAMP, NULL, '{"backup_size": "1.2GB", "warnings": ["某些表未优化"]}'),
('security', 'ERROR', 'auth', 'login', '登录失败：密码错误', NULL, 'hacker', '192.168.1.102', 'curl/7.68.0', 'POST', '/api/auth/login', '{"password": "wrong_password"}', 401, 100, '密码验证失败', 'AuthenticationError: Invalid credentials', NULL, CURRENT_TIMESTAMP, '{"username": "hacker", "password": "wrong_password"}', NULL);

-- 插入照片数据
INSERT INTO photos (title, description, image_url, thumbnail_url, category, location, taken_at, published) VALUES
('夕阳下的城市天际线', 
 '城市在夕阳西下时的美丽轮廓，高楼大厦在金色光芒中显得格外壮观。', 
 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop', 
 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop', 
 '城市风光', 
 '上海外滩', 
 '2024-01-15', 
 true),

('静谧的森林小径', 
 '阳光透过茂密的树叶洒在蜿蜒的小径上，营造出宁静祥和的氛围。', 
 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=800&fit=crop', 
 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop', 
 '自然风光', 
 '黄山风景区', 
 '2024-01-20', 
 true),

('海边的日出', 
 '清晨时分，太阳从海平面缓缓升起，海水波光粼粼，景色美不胜收。', 
 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop', 
 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop', 
 '自然风光', 
 '青岛海滨', 
 '2024-01-25', 
 true),

('古典建筑的细节', 
 '传统建筑的精美雕刻和装饰，展现了古代工匠的精湛技艺。', 
 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&h=800&fit=crop', 
 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop', 
 '建筑摄影', 
 '故宫博物院', 
 '2024-02-01', 
 true),

('街头的生活瞬间', 
 '捕捉城市街头的日常生活场景，展现人们的真实生活状态。', 
 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1200&h=800&fit=crop', 
 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop', 
 '人文纪实', 
 '北京胡同', 
 '2024-02-05', 
 true),

('山峰云海', 
 '高山之巅，云海翻腾，仿佛置身仙境之中。', 
 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop', 
 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop', 
 '自然风光', 
 '华山', 
 '2024-02-10', 
 false),

('现代建筑的几何美学', 
 '现代建筑的线条和几何形状，展现了当代设计的美学理念。', 
 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=800&fit=crop', 
 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop', 
 '建筑摄影', 
 '深圳CBD', 
 '2024-02-15', 
 true),

('花园中的春色', 
 '春天的花园里，各种花卉竞相开放，色彩斑斓。', 
 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1200&h=800&fit=crop', 
 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop', 
 '自然风光', 
 '苏州园林', 
 '2024-03-01', 
 true);

-- 插入示例动态数据
INSERT INTO moments (content, author_id, visibility) VALUES
('欢迎来到我的动态空间！这里会分享一些日常的想法和有趣的内容。', 'admin', 'public'),
('今天学习了新的技术栈，感觉收获满满！', 'admin', 'public'),
('分享一些最近拍摄的照片，希望大家喜欢。', 'admin', 'public');

-- 显示插入结果
SELECT 
    'Data inserted successfully!' as result,
    (SELECT COUNT(*) FROM users) as users_count,
    (SELECT COUNT(*) FROM blogs) as blogs_count,
    (SELECT COUNT(*) FROM works) as works_count,
    (SELECT COUNT(*) FROM blog_views) as blog_views_count,
    (SELECT COUNT(*) FROM system_logs) as system_logs_count,
    (SELECT COUNT(*) FROM moments) as moments_count,
    (SELECT COUNT(*) FROM photos) as photos_count;

-- Task force sample data
INSERT INTO projects (name, description, color, icon) VALUES
  ('个人网站优化', '持续优化 hjxlog-website', '#6366f1', 'globe'),
  ('学习计划', '技术学习和技能提升', '#10b981', 'book'),
  ('生活事务', '日常待办事项', '#f59e0b', 'home')
ON CONFLICT DO NOTHING;

INSERT INTO tasks (title, description, project_id, status, priority, due_date) VALUES
  ('实现任务管理功能', '设计并实现Task Force模块', 1, 'in_progress', 'P1', '2026-02-10'),
  ('学习 Rust 基础', '完成 Rustlings 练习', 2, 'todo', 'P2', '2026-02-15'),
  ('购买日用品', '牛奶、面包、水果', 3, 'todo', 'P3', '2026-02-06')
ON CONFLICT DO NOTHING;

-- Memory sample data
INSERT INTO daily_thoughts (thought_date, content, mood, tags, is_summarized) VALUES
  ('2026-02-06', '今天完成了任务管理模块的大部分接口，剩余前端细节。', 'productive', ARRAY['task-force','backend'], true),
  ('2026-02-07', '开始梳理数据库脚本结构，准备统一 schema/preset/test。', 'focused', ARRAY['database','refactor'], false)
ON CONFLICT (thought_date) DO UPDATE SET
  content = EXCLUDED.content,
  mood = EXCLUDED.mood,
  tags = EXCLUDED.tags,
  is_summarized = EXCLUDED.is_summarized,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO long_term_memory (title, content, source_date, category, importance, tags) VALUES
  ('统一数据库脚本入口', '将建表和数据脚本拆分为 dbschema/preset/test，可显著降低维护复杂度。', '2026-02-07', '架构', 8, ARRAY['database','engineering'])
ON CONFLICT DO NOTHING;
