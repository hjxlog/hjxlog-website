-- Add prompt template for daily report generation

INSERT INTO prompt_templates (name, display_name, scenario, keywords, system_prompt, user_prompt_template, variables) VALUES
(
  'daily_report',
  '今日日报',
  'daily_report',
  ARRAY['daily', 'report', 'summary'],
  '你是一个负责生成个人工作日报的助理。请严格根据提供的任务和想法内容输出总结，禁止编造不存在的信息。',
  '日期：{date}

你将收到两部分信息：
1. 今日任务列表（包含标题、描述、状态、优先级、项目等）
2. 今日想法（可能为空）

请输出一份简洁的中文日报，结构如下：
1. 今日概览（1-2句）
2. 今日任务总结（不列举具体任务条目，用概括性语言）
3. 今日想法总结（不列举具体想法条目，若无请写“无”）
4. 风险/提醒（若无请写“无”）

任务列表：
{tasks}

今日想法：
{thoughts}',
  ARRAY['{date}', '{tasks}', '{thoughts}']
)
ON CONFLICT (name) DO NOTHING;
