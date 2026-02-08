/**
 * Task Force 功能 - 服务层
 * 提供任务和项目的业务逻辑
 */

let dbClientGetter = null;

/**
 * 注入统一数据库客户端获取函数
 * @param {Function} getter - () => pgClient
 */
export function setTaskDbClientGetter(getter) {
  dbClientGetter = getter;
}

function getDbClient() {
  const client = typeof dbClientGetter === 'function' ? dbClientGetter() : null;
  if (!client) {
    throw new Error('数据库未连接');
  }
  return client;
}

// ==================== 项目管理 ====================

/**
 * 获取所有项目
 */
export async function getAllProjects() {
  const db = getDbClient();
  const result = await db.query(
    `SELECT p.*,
            COUNT(t.id) as task_count,
            COUNT(CASE WHEN t.status = 'done' THEN 1 END) as completed_count
     FROM projects p
     LEFT JOIN tasks t ON p.id = t.project_id
     WHERE p.status = 'active'
     GROUP BY p.id
     ORDER BY p.created_at DESC`
  );
  return result.rows;
}

/**
 * 创建项目
 */
export async function createProject(data) {
  const db = getDbClient();
  const { name, description, color, icon, start_date, end_date } = data;
  const result = await db.query(
    `INSERT INTO projects (name, description, color, icon, start_date, end_date)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [name, description, color || '#6366f1', icon, start_date, end_date]
  );
  return result.rows[0];
}

/**
 * 更新项目
 */
export async function updateProject(id, data) {
  const db = getDbClient();
  const { name, description, color, icon, status, start_date, end_date } = data;
  const result = await db.query(
    `UPDATE projects
     SET name = COALESCE($1, name),
         description = COALESCE($2, description),
         color = COALESCE($3, color),
         icon = COALESCE($4, icon),
         status = COALESCE($5, status),
         start_date = COALESCE($6, start_date),
         end_date = COALESCE($7, end_date)
     WHERE id = $8
     RETURNING *`,
    [name, description, color, icon, status, start_date, end_date, id]
  );
  return result.rows[0];
}

/**
 * 删除项目
 */
export async function deleteProject(id) {
  const db = getDbClient();
  await db.query('DELETE FROM projects WHERE id = $1', [id]);
}

// ==================== 任务管理 ====================

/**
 * 获取任务列表（支持筛选）
 */
export async function getTasks(filters = {}) {
  const db = getDbClient();
  const { project_id, status, priority, search } = filters;
  
  let query = `
    SELECT t.*,
           p.name as project_name,
           p.color as project_color,
           p.icon as project_icon
    FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE 1=1
  `;
  
  const params = [];
  let paramIndex = 1;

  if (project_id) {
    query += ` AND t.project_id = $${paramIndex++}`;
    params.push(project_id);
  }
  
  if (status) {
    query += ` AND t.status = $${paramIndex++}`;
    params.push(status);
  }
  
  if (priority) {
    query += ` AND t.priority = $${paramIndex++}`;
    params.push(priority);
  }
  
  if (search) {
    query += ` AND (t.title ILIKE $${paramIndex++} OR t.description ILIKE $${paramIndex++})`;
    params.push(`%${search}%`, `%${search}%`);
  }
  
  query += ` ORDER BY t.position ASC, t.created_at DESC`;
  
  const result = await db.query(query, params);
  return result.rows;
}

/**
 * 获取任务详情
 */
export async function getTaskById(id) {
  const db = getDbClient();
  const result = await db.query(
    `SELECT t.*,
            p.name as project_name,
            p.color as project_color
     FROM tasks t
     LEFT JOIN projects p ON t.project_id = p.id
     WHERE t.id = $1`,
    [id]
  );
  return result.rows[0];
}

/**
 * 创建任务
 */
export async function createTask(data) {
  const db = getDbClient();
  const {
    title,
    description,
    project_id,
    status = 'todo',
    priority = 'P2',
    tags,
    start_date,
    due_date,
    estimated_hours,
    parent_task_id,
    source_thought_id
  } = data;

  // 获取当前最大 position
  const positionResult = await db.query(
    `SELECT COALESCE(MAX(position), -1) + 1 as next_position FROM tasks`
  );
  const position = positionResult.rows[0].next_position;

  const result = await db.query(
    `INSERT INTO tasks (
      title, description, project_id, status, priority,
      tags, start_date, due_date, estimated_hours, parent_task_id,
      source_thought_id, position
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
    [
      title, description, project_id, status, priority,
      tags || '{}', start_date, due_date, estimated_hours, parent_task_id,
      source_thought_id, position
    ]
  );
  return result.rows[0];
}

/**
 * 更新任务
 */
export async function updateTask(id, data) {
  const db = getDbClient();
  const allowedFields = [
    'title',
    'description',
    'project_id',
    'status',
    'priority',
    'tags',
    'start_date',
    'due_date',
    'completed_at',
    'estimated_hours',
    'actual_hours',
    'position'
  ];

  const setClauses = [];
  const values = [];
  let index = 1;

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      setClauses.push(`${field} = $${index++}`);
      values.push(data[field]);
    }
  }

  if (setClauses.length === 0) {
    return getTaskById(id);
  }

  values.push(id);
  const result = await db.query(
    `UPDATE tasks
     SET ${setClauses.join(', ')}
     WHERE id = $${index}
     RETURNING *`,
    values
  );
  return result.rows[0];
}

/**
 * 批量更新任务位置（拖拽排序）
 */
export async function updateTasksPosition(tasks) {
  const db = getDbClient();
  const client = typeof db.connect === 'function' ? await db.connect() : db;
  const needRelease = client !== db && typeof client.release === 'function';
  try {
    await client.query('BEGIN');
    
    for (const task of tasks) {
      await client.query(
        'UPDATE tasks SET position = $1 WHERE id = $2',
        [task.position, task.id]
      );
    }
    
    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    if (needRelease) {
      client.release();
    }
  }
}

/**
 * 删除任务
 */
export async function deleteTask(id) {
  const db = getDbClient();
  await db.query('DELETE FROM tasks WHERE id = $1', [id]);
}

/**
 * 从想法创建任务
 */
export async function createTaskFromThought(thoughtId, taskData) {
  const db = getDbClient();
  const { title, description, project_id, priority = 'P2', start_date, due_date } = taskData;

  // 获取想法内容
  const thoughtResult = await db.query(
    'SELECT content, thought_date FROM daily_thoughts WHERE id = $1',
    [thoughtId]
  );
  
  if (thoughtResult.rows.length === 0) {
    throw new Error('Thought not found');
  }

  const thought = thoughtResult.rows[0];

  // 创建任务，关联想法
  const result = await db.query(
    `INSERT INTO tasks (
      title, description, project_id, priority, start_date, due_date,
      source_thought_id, position
    ) VALUES ($1, $2, $3, $4, $5, $6, $7,
      (SELECT COALESCE(MAX(position), -1) + 1 FROM tasks)
    )
    RETURNING *`,
    [
      title || `来自 ${thought.thought_date} 的想法`,
      description || thought.content,
      project_id,
      priority,
      start_date,
      due_date,
      thoughtId
    ]
  );

  return result.rows[0];
}

// ==================== 看板视图数据 ====================

/**
 * 获取看板视图数据
 */
export async function getKanbanData(projectId = null) {
  const filters = projectId ? { project_id: projectId } : {};
  const tasks = await getTasks(filters);

  return {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    done: tasks.filter(t => t.status === 'done'),
    cancelled: tasks.filter(t => t.status === 'cancelled')
  };
}

// ==================== 统计数据 ====================

/**
 * 获取任务统计
 */
export async function getTaskStats() {
  const db = getDbClient();
  const result = await db.query(`
    SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'todo' THEN 1 END) as todo,
      COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
      COUNT(CASE WHEN status = 'done' THEN 1 END) as done,
      COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
      COUNT(CASE WHEN priority = 'P0' THEN 1 END) as p0,
      COUNT(CASE WHEN priority = 'P1' THEN 1 END) as p1,
      COUNT(CASE WHEN due_date < NOW() AND status NOT IN ('done', 'cancelled') THEN 1 END) as overdue
    FROM tasks
  `);
  
  return result.rows[0];
}
