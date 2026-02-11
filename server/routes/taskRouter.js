/**
 * Task Force 功能 - API 路由
 * 提供任务和项目的 RESTful 接口
 */

import express from 'express';
import {
  getAllProjects,
  createProject,
  updateProject,
  deleteProject,
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTasksPosition,
  deleteTask,
  getKanbanData,
  getTaskStats
} from '../services/TaskService.js';

const router = express.Router();
const TASK_STATUSES = new Set(['todo', 'in_progress', 'done', 'cancelled']);
const TASK_PRIORITIES = new Set(['P0', 'P1', 'P2', 'P3']);

function isValidDateValue(value) {
  if (value === null) return true;
  if (typeof value !== 'string') return false;
  return !Number.isNaN(new Date(value).getTime());
}

function normalizeTaskPayload(payload, { requireTitle = false } = {}) {
  const normalized = {};

  if (Object.prototype.hasOwnProperty.call(payload, 'title')) {
    if (typeof payload.title !== 'string' || !payload.title.trim()) {
      return { error: '任务标题不能为空' };
    }
    normalized.title = payload.title.trim();
  } else if (requireTitle) {
    return { error: '任务标题不能为空' };
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'description')) {
    if (payload.description !== null && typeof payload.description !== 'string') {
      return { error: '任务描述格式错误' };
    }
    normalized.description = payload.description;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'project_id')) {
    if (payload.project_id !== null && !Number.isInteger(payload.project_id)) {
      return { error: '项目ID格式错误' };
    }
    normalized.project_id = payload.project_id;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'status')) {
    if (!TASK_STATUSES.has(payload.status)) {
      return { error: '任务状态不合法' };
    }
    normalized.status = payload.status;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'priority')) {
    if (!TASK_PRIORITIES.has(payload.priority)) {
      return { error: '任务优先级不合法' };
    }
    normalized.priority = payload.priority;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'tags')) {
    if (!Array.isArray(payload.tags) || payload.tags.some(tag => typeof tag !== 'string')) {
      return { error: '任务标签格式错误' };
    }
    normalized.tags = payload.tags;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'start_date')) {
    if (!isValidDateValue(payload.start_date)) {
      return { error: '开始日期格式错误' };
    }
    normalized.start_date = payload.start_date;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'due_date')) {
    if (!isValidDateValue(payload.due_date)) {
      return { error: '截止日期格式错误' };
    }
    normalized.due_date = payload.due_date;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'completed_at')) {
    if (!isValidDateValue(payload.completed_at)) {
      return { error: '完成时间格式错误' };
    }
    normalized.completed_at = payload.completed_at;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'estimated_hours')) {
    if (
      payload.estimated_hours !== null &&
      (typeof payload.estimated_hours !== 'number' || Number.isNaN(payload.estimated_hours))
    ) {
      return { error: '预估工时格式错误' };
    }
    normalized.estimated_hours = payload.estimated_hours;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'actual_hours')) {
    if (
      payload.actual_hours !== null &&
      (typeof payload.actual_hours !== 'number' || Number.isNaN(payload.actual_hours))
    ) {
      return { error: '实际工时格式错误' };
    }
    normalized.actual_hours = payload.actual_hours;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'position')) {
    if (payload.position !== null && !Number.isInteger(payload.position)) {
      return { error: '排序字段格式错误' };
    }
    normalized.position = payload.position;
  }

  return { data: normalized };
}

// ==================== 项目路由 ====================

/**
 * 获取所有项目
 * GET /api/tasks/projects
 */
router.get('/projects', async (req, res) => {
  try {
    const projects = await getAllProjects();
    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    console.error('Error fetching projects:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 创建项目
 * POST /api/tasks/projects
 */
router.post('/projects', async (req, res) => {
  try {
    const project = await createProject(req.body);
    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Error creating project:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 更新项目
 * PUT /api/tasks/projects/:id
 */
router.put('/projects/:id', async (req, res) => {
  try {
    const project = await updateProject(req.params.id, req.body);
    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Error updating project:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 删除项目
 * DELETE /api/tasks/projects/:id
 */
router.delete('/projects/:id', async (req, res) => {
  try {
    await deleteProject(req.params.id);
    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== 任务路由 ====================

/**
 * 获取任务列表
 * GET /api/tasks?project_id=1&status=todo&priority=P1&search=keyword
 */
router.get('/', async (req, res) => {
  try {
    const tasks = await getTasks(req.query);
    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error('Error fetching tasks:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 获取任务详情
 * GET /api/tasks/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const task = await getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }
    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Error fetching task:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 创建任务
 * POST /api/tasks
 */
router.post('/', async (req, res) => {
  try {
    const { data, error } = normalizeTaskPayload(req.body, { requireTitle: true });
    if (error) {
      return res.status(400).json({ success: false, error });
    }

    const task = await createTask(data);
    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Error creating task:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 更新任务
 * PUT /api/tasks/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const { data, error } = normalizeTaskPayload(req.body);
    if (error) {
      return res.status(400).json({ success: false, error });
    }

    const task = await updateTask(req.params.id, data);
    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Error updating task:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 批量更新任务位置
 * POST /api/tasks/batch/position
 */
router.post('/batch/position', async (req, res) => {
  try {
    const { tasks } = req.body;
    await updateTasksPosition(tasks);
    res.json({
      success: true,
      message: 'Tasks position updated successfully'
    });
  } catch (error) {
    console.error('Error updating tasks position:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 删除任务
 * DELETE /api/tasks/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    await deleteTask(req.params.id);
    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== 看板路由 ====================

/**
 * 获取看板数据
 * GET /api/tasks/kanban?project_id=1
 */
router.get('/kanban/data', async (req, res) => {
  try {
    const { project_id } = req.query;
    const data = await getKanbanData(project_id);
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching kanban data:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== 统计路由 ====================

/**
 * 获取任务统计
 * GET /api/tasks/stats
 */
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await getTaskStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching task stats:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
