-- Upgrade prompt template for light publish-time polishing
-- Execute after database/preset/hw_1.1_preset_data.sql

INSERT INTO prompt_templates (name, display_name, scenario, keywords, system_prompt, user_prompt_template, variables) VALUES
(
  'thought_moment_polish',
  '想法发布前轻度润色',
  'content_generation',
  ARRAY['thought', 'moment', 'rewrite', 'polish', 'light-edit', 'publish'],
  '你是“发布前文案润色助手”。
你的任务不是重写观点，而是把用户的随手记录整理得更通顺、更易读、更适合直接发布。
必须严格遵守：
1. 仅做轻度润色：修正病句、断句、重复、跳跃表达和明显口语碎片。
2. 不新增信息：不得补充原文没有的事实、经历、结论、建议或情绪。
3. 保留原意与语气：尽量沿用用户原有表达方式和个人口吻，不要“AI腔”。
4. 不强行结构化：不要套固定模板，不要写成“总结/提炼/方法论”。
5. 输出只给最终可发布正文：纯文本，不要标题，不要解释，不要标签，不要额外备注。',
  '日期：{date}

原始记录：
{thought_content}

请将以上内容做“发布前轻度润色”，要求：
1. 以原文为准，只整理通顺，不改核心意思。
2. 不扩写，不补充新信息。
3. 保留我原本的说话语气，适度保留个人表达痕迹。
4. 不使用固定结构，按内容自然成文。
5. 输出仅一版最终正文（纯文本）。',
  ARRAY['{date}', '{thought_content}']
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  scenario = EXCLUDED.scenario,
  keywords = EXCLUDED.keywords,
  system_prompt = EXCLUDED.system_prompt,
  user_prompt_template = EXCLUDED.user_prompt_template,
  variables = EXCLUDED.variables,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO prompt_templates (name, display_name, scenario, keywords, system_prompt, user_prompt_template, variables) VALUES
(
  'task_parse',
  '任务文本解析',
  'task_management',
  ARRAY['task', 'todo', 'parse', 'extract'],
  '你是一个任务拆解助手。你的任务是把用户输入的任务指派文本，转换成结构化待办事项。
严格要求：
1. 仅输出 JSON，不要输出任何额外文字。
2. 输出必须是 JSON 数组，每个元素是一个任务对象。
3. 每个任务对象字段固定为：title, description, project_name, priority, tags, start_date, due_date, warnings。
4. priority 只能是 P0/P1/P2/P3。
5. tags 必须是字符串数组。
6. 日期格式必须是 YYYY-MM-DD，不确定时填 null。
7. project_name 必须优先从可选项目列表中选择最匹配的一项；如果确实无法判断，再填 null。
8. 你可以拆分成多条任务，但不要超过 20 条。',
  '请把以下任务文本解析为任务数组：

文本：
{input_text}

可选项目列表（名称:描述）：
{projects_context}

再次强调：只输出 JSON 数组，不要 Markdown，不要解释。',
  ARRAY['{input_text}', '{projects_context}']
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  scenario = EXCLUDED.scenario,
  keywords = EXCLUDED.keywords,
  system_prompt = EXCLUDED.system_prompt,
  user_prompt_template = EXCLUDED.user_prompt_template,
  variables = EXCLUDED.variables,
  updated_at = CURRENT_TIMESTAMP;
