# Task Force 开发清单

## 📋 Phase 1 - 核心功能

### ✅ 已完成
- [x] 数据库表结构（create_task_tables.sql）
- [x] 后端服务层（TaskService.js）
- [x] API路由（taskRouter.js）
- [x] 前端页面框架（TasksPage.tsx）
- [x] 看板视图组件（TaskKanban.tsx）
- [x] 列表视图组件（TaskList.tsx）
- [x] 筛选组件（TaskFilters.tsx）
- [x] 统计组件（TaskStats.tsx）
- [x] 创建任务弹窗（CreateTaskModal.tsx）
- [x] 创建项目弹窗（CreateProjectModal.tsx）
- [x] 添加路由到 App.tsx

### 🚧 进行中

### ⏳ 待开发

#### P0-1: 全局快捷键 + 快速添加
- [x] 快捷键监听组件 (useShortcut.ts)
- [x] Cmd+K / Ctrl+K 唤起快速输入框
- [x] 智能解析 `#项目 @标签`
- [x] 快速添加组件 (QuickAddModal.tsx)
- [x] 集成到 TasksPage

#### P0-2: 任务详情页
- [x] 任务详情侧边栏组件 (TaskDetailSidebar.tsx)
- [x] 子任务列表
- [x] 子任务勾选状态
- [x] 子任务CRUD
- [x] 任务描述编辑
- [x] 看板/列表集成点击打开详情

#### P0-3: 日历视图
- [x] 日历组件（月视图）TaskCalendar.tsx
- [x] 任务日期标记
- [x] 点击日期查看当天任务
- [x] 点击任务卡片打开详情
- [x] 集成到TasksPage

#### P0-4: 今天视图
- [x] 筛选今天到期的任务
- [x] 今天视图专属布局
- [x] 逾期任务高亮
- [x] 任务分类展示
- [x] 集成到TasksPage

#### P1-1: 工作生活模式切换
- [ ] 快速切换按钮
- [ ] 筛选对应项目任务
- [ ] 独立统计数据

#### P1-2: 从想法创建任务
- [x] ThoughtsPage添加创建任务按钮
- [x] 选择项目和优先级
- [x] 关联想法到任务
- [x] CreateTaskFromThoughtModal组件
- [x] DailyThoughtEditor集成

#### P1-3: 优化体验
- [ ] 任务拖拽排序（位置更新）
- [ ] 批量操作（删除/归档）
- [ ] 任务搜索高亮

---

## 🔍 代码质量检查
- [ ] TypeScript类型检查通过
- [ ] ESLint检查通过
- [ ] 所有API端点测试
- [ ] 数据库迁移脚本
- [ ] 响应式设计适配

---

## 📦 交付清单
- [ ] 所有功能开发完成
- [ ] 代码提交到 task_todolist 分支
- [ ] 创建 Pull Request 到 main
- [ ] PR描述文档
- [ ] 数据库迁移说明

---

_最后更新：2026-02-05 16:40_
