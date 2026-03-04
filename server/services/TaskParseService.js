import PromptService from './PromptService.js';
import LLMService from './LLMService.js';
import { getAllProjects } from './TaskService.js';

let dbClientGetter = null;

const TASK_PRIORITIES = new Set(['P0', 'P1', 'P2', 'P3']);

export function setTaskParseDbClientGetter(getter) {
  dbClientGetter = getter;
}

function getDbClient() {
  const client = typeof dbClientGetter === 'function' ? dbClientGetter() : null;
  if (!client) {
    throw new Error('数据库未连接');
  }
  return client;
}

function extractJsonText(rawText) {
  const text = typeof rawText === 'string' ? rawText.trim() : '';
  if (!text) return '';

  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const arrayStart = text.indexOf('[');
  const arrayEnd = text.lastIndexOf(']');
  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    return text.slice(arrayStart, arrayEnd + 1);
  }

  const objectStart = text.indexOf('{');
  const objectEnd = text.lastIndexOf('}');
  if (objectStart >= 0 && objectEnd > objectStart) {
    return text.slice(objectStart, objectEnd + 1);
  }

  return text;
}

function toDateInputValue(value) {
  if (!value || typeof value !== 'string') return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function inferDateRangeFromText(input) {
  const text = typeof input === 'string' ? input : '';
  if (!text.trim()) return { start_date: null, due_date: null };

  const today = new Date();
  const toDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 优先解析 YYYY-MM-DD 或 YYYY/MM/DD
  const fullMatch = text.match(/\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/);
  if (fullMatch) {
    const candidate = new Date(Number(fullMatch[1]), Number(fullMatch[2]) - 1, Number(fullMatch[3]));
    if (!Number.isNaN(candidate.getTime())) {
      const date = toDate(candidate);
      return { start_date: date, due_date: date };
    }
  }

  // 解析 M-D / M/D（按当年）
  const shortMatch = text.match(/(?:^|\D)(\d{1,2})[-/](\d{1,2})(?:\D|$)/);
  if (shortMatch) {
    const candidate = new Date(today.getFullYear(), Number(shortMatch[1]) - 1, Number(shortMatch[2]));
    if (!Number.isNaN(candidate.getTime())) {
      const date = toDate(candidate);
      return { start_date: date, due_date: date };
    }
  }

  if (text.includes('明天')) {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    const date = toDate(d);
    return { start_date: date, due_date: date };
  }
  if (text.includes('后天')) {
    const d = new Date(today);
    d.setDate(d.getDate() + 2);
    const date = toDate(d);
    return { start_date: date, due_date: date };
  }
  if (text.includes('下周')) {
    const d = new Date(today);
    d.setDate(d.getDate() + 7);
    const date = toDate(d);
    return { start_date: toDate(today), due_date: date };
  }

  return { start_date: null, due_date: null };
}

function normalizeTags(rawTags) {
  if (!Array.isArray(rawTags)) return [];
  const set = new Set();
  for (const tag of rawTags) {
    if (typeof tag !== 'string') continue;
    const cleaned = tag.trim();
    if (cleaned) set.add(cleaned);
  }
  return Array.from(set).slice(0, 8);
}

function normalizePriority(rawPriority) {
  if (typeof rawPriority !== 'string') return 'P2';
  const cleaned = rawPriority.trim().toUpperCase();
  return TASK_PRIORITIES.has(cleaned) ? cleaned : 'P2';
}

function normalizeWarnings(rawWarnings, localWarnings) {
  const warnings = Array.isArray(rawWarnings)
    ? rawWarnings.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim())
    : [];
  return [...warnings, ...localWarnings];
}

function resolveProjectId(projectName, projects) {
  if (typeof projectName !== 'string') return null;
  const cleaned = projectName.trim();
  if (!cleaned) return null;
  const lowered = cleaned.toLowerCase();
  if (['null', 'none', 'n/a', 'na', '无', '未指定', '不确定'].includes(lowered)) {
    return null;
  }

  const lower = lowered;
  const exact = projects.find((project) => String(project.name || '').trim().toLowerCase() === lower);
  if (exact) return exact.id;

  const contains = projects.find((project) => {
    const name = String(project.name || '').trim().toLowerCase();
    return name.includes(lower) || lower.includes(name);
  });

  return contains ? contains.id : null;
}

function sanitizeProjectName(projectName) {
  if (typeof projectName !== 'string') return '';
  const cleaned = projectName.trim();
  if (!cleaned) return '';
  const lowered = cleaned.toLowerCase();
  if (['null', 'none', 'n/a', 'na', '无', '未指定', '不确定'].includes(lowered)) return '';
  return cleaned;
}

function inferProjectIdFromText(input, projects) {
  const text = typeof input === 'string' ? input.toLowerCase() : '';
  if (!text.trim() || !Array.isArray(projects) || projects.length === 0) return null;

  let best = null;
  let bestScore = 0;

  for (const project of projects) {
    const name = String(project?.name || '').trim();
    if (!name) continue;
    const nameLower = name.toLowerCase();
    const descriptionLower = String(project?.description || '').toLowerCase();

    let score = 0;
    if (text.includes(nameLower)) score += 100;
    for (const token of nameLower.split(/\s+/).filter(Boolean)) {
      if (token.length >= 2 && text.includes(token)) score += 20;
    }
    for (const token of descriptionLower.split(/[\s,，。；、|/]+/).filter(Boolean)) {
      if (token.length >= 2 && text.includes(token)) score += 5;
    }

    if (score > bestScore) {
      bestScore = score;
      best = project;
    }
  }

  return best && bestScore > 0 ? best.id : null;
}

function parseTaskDrafts(llmRawText) {
  const jsonText = extractJsonText(llmRawText);
  if (!jsonText) {
    throw new Error('AI 未返回可解析内容');
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    throw new Error('AI 返回格式解析失败，请重试');
  }

  if (Array.isArray(parsed)) return parsed;
  if (parsed && Array.isArray(parsed.tasks)) return parsed.tasks;

  throw new Error('AI 返回结果不是任务数组');
}

export async function parseTasksFromText(inputText) {
  const text = typeof inputText === 'string' ? inputText.trim() : '';
  if (!text) {
    throw new Error('请输入要解析的任务文本');
  }

  if (text.length > 8000) {
    throw new Error('文本过长，请控制在 8000 字以内');
  }

  const dbClient = getDbClient();
  const promptService = new PromptService(dbClient);
  const templateResult = await promptService.getTemplate('task_parse');

  if (!templateResult.success || !templateResult.data) {
    throw new Error('提示词模板 task_parse 缺失，请先初始化 prompt_templates 数据。');
  }

  const projects = await getAllProjects();
  const projectContext = projects
    .map((project) => {
      const name = typeof project.name === 'string' ? project.name.trim() : '';
      if (!name) return null;
      const description = typeof project.description === 'string' ? project.description.trim() : '';
      return description ? `${name}: ${description}` : `${name}: （无描述）`;
    })
    .filter(Boolean)
    .join('\n');
  const template = templateResult.data;
  const llmService = new LLMService();

  const userPrompt = template.user_prompt_template
    .replace('{input_text}', text)
    .replace('{projects_context}', projectContext)
    .replace('{projects}', projectContext);

  const responseText = await llmService.chat({
    system: template.system_prompt,
    messages: [{ role: 'user', content: userPrompt }]
  });

  const rawDrafts = parseTaskDrafts(responseText);
  console.log('[TaskParse] AI returned rawDrafts:', JSON.stringify(rawDrafts, null, 2));
  console.log('[TaskParse] Available projects:', JSON.stringify(projects, null, 2));

  const drafts = rawDrafts
    .map((item) => {
      if (!item || typeof item !== 'object') return null;

      const title = typeof item.title === 'string' ? item.title.trim() : '';
      if (!title) return null;

      const localWarnings = [];
      const sourceText = [item.title, item.description, text].filter((seg) => typeof seg === 'string' && seg.trim()).join('\n');
      const normalizedProjectName = sanitizeProjectName(item.project_name);
      console.log(`[TaskParse] Task "${title}": project_name="${item.project_name}", normalized="${normalizedProjectName}"`);
      let projectId = resolveProjectId(normalizedProjectName, projects);
      if (projectId === null) {
        projectId = inferProjectIdFromText(sourceText, projects);
      }
      if (normalizedProjectName && projectId === null) {
        localWarnings.push(`未匹配到项目: ${normalizedProjectName}`);
      }
      if (projectId === null) {
        localWarnings.push('未识别到明确项目，请手动确认');
      }

      const priority = normalizePriority(item.priority);
      if (typeof item.priority === 'string' && priority === 'P2' && item.priority.trim().toUpperCase() !== 'P2') {
        localWarnings.push(`优先级已回退为 P2: ${item.priority}`);
      }

      const parsedStartDate = toDateInputValue(item.start_date);
      const parsedDueDate = toDateInputValue(item.due_date);
      const inferredRange = inferDateRangeFromText(sourceText);
      const today = getTodayDateString();

      const result = {
        title,
        description: typeof item.description === 'string' ? item.description.trim() : '',
        project_id: projectId,
        priority,
        tags: normalizeTags(item.tags),
        start_date: parsedStartDate || inferredRange.start_date || today,
        due_date: parsedDueDate || inferredRange.due_date || parsedStartDate || inferredRange.start_date || today,
        warnings: normalizeWarnings(item.warnings, localWarnings)
      };
      console.log(`[TaskParse] Final task "${title}":`, JSON.stringify({
        project_id: result.project_id,
        start_date: result.start_date,
        due_date: result.due_date,
        parsedStartDate,
        parsedDueDate,
        inferredRange,
        today
      }, null, 2));
      return result;
    })
    .filter(Boolean)
    .slice(0, 20);

  console.log('[TaskParse] Final drafts array:', JSON.stringify(drafts, null, 2));

  if (drafts.length === 0) {
    throw new Error('AI 未解析出有效任务，请补充更明确的任务描述');
  }

  return drafts;
}
