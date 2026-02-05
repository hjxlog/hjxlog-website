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
  createTaskFromThought,
  getKanbanData,
  getTaskStats
} from '../services/TaskService.js';

const router = express.Router();

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
    const task = await createTask(req.body);
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
    const task = await updateTask(req.params.id, req.body);
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

/**
 * 从想法创建任务
 * POST /api/tasks/from-thought/:thoughtId
 */
router.post('/from-thought/:thoughtId', async (req, res) => {
  try {
    const task = await createTaskFromThought(req.params.thoughtId, req.body);
    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Error creating task from thought:', error.message);
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
