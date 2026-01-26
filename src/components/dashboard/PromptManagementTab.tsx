import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { apiRequest } from '@/config/api';

interface PromptTemplate {
  id: number;
  name: string;
  display_name: string;
  scenario: string;
  keywords: string[];
  system_prompt: string;
  user_prompt_template: string;
  variables: string[];
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

interface ScenarioStats {
  scenario: string;
  count: number;
  active_count: number;
}

const SCENARIOS = [
  { value: 'location', label: '地点/行程查询', color: 'bg-blue-100 text-blue-800' },
  { value: 'tech', label: '技能/技术查询', color: 'bg-green-100 text-green-800' },
  { value: 'content', label: '内容/文章查询', color: 'bg-purple-100 text-purple-800' },
  { value: 'content_generation', label: '内容生成', color: 'bg-amber-100 text-amber-800' },
  { value: 'image_analysis', label: '图片分析', color: 'bg-rose-100 text-rose-800' },
  { value: 'general', label: '通用查询', color: 'bg-gray-100 text-gray-800' },
];

export default function PromptManagementTab() {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [stats, setStats] = useState<ScenarioStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<PromptTemplate | null>(null);
  const [testResult, setTestResult] = useState<{ system_prompt: string; user_prompt: string } | null>(null);

  // 表单数据
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    scenario: 'general',
    system_prompt: '',
    user_prompt_template: '',
    variables: '{context}, {question}',
    is_active: true,
  });

  // 测试表单
  const [testData, setTestData] = useState({
    templateName: '',
    context: '',
    question: '',
  });

  const scenarios = SCENARIOS;
  const scenarioMap = useMemo(
    () => new Map(scenarios.map((s) => [s.value, s])),
    [scenarios]
  );

  // 获取所有模板
  const fetchTemplates = useCallback(async () => {
    try {
      const result = await apiRequest('/api/prompts/templates');
      if (result.success) {
        setTemplates(result.data);
      }
    } catch (error) {
      console.error('获取模板失败:', error);
      toast.error('获取模板失败');
    }
  }, []);

  // 获取统计信息
  const fetchStats = useCallback(async () => {
    try {
      const result = await apiRequest('/api/prompts/stats');
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('获取统计失败:', error);
    }
  }, []);

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await Promise.all([fetchTemplates(), fetchStats()]);
      setLoading(false);
    };
    initData();
  }, [fetchTemplates, fetchStats]);

  // 打开新建表单
  const openCreateForm = useCallback(() => {
    setCurrentTemplate(null);
    setFormData({
      name: '',
      display_name: '',
      scenario: 'general',
      system_prompt: '',
      user_prompt_template: '',
      variables: '{context}, {question}',
      is_active: true,
    });
    setIsFormOpen(true);
  }, []);

  // 打开编辑表单
  const openEditForm = useCallback((template: PromptTemplate) => {
    setCurrentTemplate(template);
    setFormData({
      name: template.name,
      display_name: template.display_name,
      scenario: template.scenario,
      system_prompt: template.system_prompt,
      user_prompt_template: template.user_prompt_template,
      variables: template.variables.join(', '),
      is_active: template.is_active,
    });
    setIsFormOpen(true);
  }, []);

  // 关闭表单
  const closeForm = useCallback(() => {
    setIsFormOpen(false);
    setCurrentTemplate(null);
  }, []);

  // 保存模板
  const saveTemplate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      ...formData,
      variables: formData.variables.split(',').map(v => v.trim()).filter(v => v),
    };

    try {
      let result;
      if (currentTemplate) {
        result = await apiRequest(`/api/prompts/templates/${currentTemplate.name}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      } else {
        result = await apiRequest('/api/prompts/templates', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      }

      if (result.success) {
        toast.success(currentTemplate ? '模板更新成功' : '模板创建成功');
        await fetchTemplates();
        await fetchStats();
        closeForm();
      } else {
        toast.error(result.message || '保存失败');
      }
    } catch (error) {
      console.error('保存模板失败:', error);
      const message = error instanceof Error ? error.message : '保存失败';
      toast.error(message);
    }
  }, [currentTemplate, formData, fetchStats, fetchTemplates, closeForm]);

  // 删除模板
  const deleteTemplate = useCallback(async (name: string) => {
    if (!confirm('确定要删除这个模板吗？此操作不可撤销。')) {
      return;
    }

    try {
      const result = await apiRequest(`/api/prompts/templates/${name}`, {
        method: 'DELETE',
      });

      if (result.success) {
        toast.success('模板删除成功');
        await fetchTemplates();
        await fetchStats();
      } else {
        toast.error(result.message || '删除失败');
      }
    } catch (error) {
      console.error('删除模板失败:', error);
      const message = error instanceof Error ? error.message : '删除失败';
      toast.error(message);
    }
  }, [fetchStats, fetchTemplates]);

  // 打开测试面板
  const openTestPanel = useCallback((template: PromptTemplate) => {
    setTestData({
      templateName: template.name,
      context: '来源1 摄影作品《深圳湾》\n在[广东省深圳市]拍摄的照片，拍摄时间：2025年1月...',
      question: '我2025年去过哪些地方',
    });
    setTestResult(null);
    setIsTestOpen(true);
  }, []);

  // 测试提示词
  const testPrompt = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await apiRequest('/api/prompts/test', {
        method: 'POST',
        body: JSON.stringify(testData),
      });

      if (result.success) {
        setTestResult(result.data);
        toast.success('提示词测试成功');
      } else {
        toast.error(result.message || '测试失败');
      }
    } catch (error) {
      console.error('测试失败:', error);
      const message = error instanceof Error ? error.message : '测试失败';
      toast.error(message);
    }
  }, [testData]);

  const getScenarioLabel = (scenario: string) => {
    return scenarioMap.get(scenario)?.label || scenario;
  };

  const getScenarioColor = (scenario: string) => {
    return scenarioMap.get(scenario)?.color || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#165DFF] mx-auto mb-4"></div>
          <p className="text-slate-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const scenarioInfo = scenarios.find(s => s.value === stat.scenario);
          return (
            <div key={stat.scenario} className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">{scenarioInfo?.label || stat.scenario}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.count}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    启用: {stat.active_count} / 总计: {stat.count}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${scenarioInfo?.color || 'bg-gray-100'}`}>
                  <i className={`fas ${scenarioInfo?.icon || 'fas fa-question'} text-xl`}></i>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 操作栏 */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-800">提示词模板</h2>
        <button
          onClick={openCreateForm}
          className="px-4 py-2 bg-[#165DFF] text-white rounded-lg hover:bg-[#165DFF]/90 transition-colors flex items-center"
        >
          <i className="fas fa-plus mr-2"></i>
          新建模板
        </button>
      </div>

      {/* 模板列表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{template.display_name}</h3>
                  <p className="text-sm text-slate-500">代码: {template.name}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScenarioColor(template.scenario)}`}>
                    {getScenarioLabel(template.scenario)}
                  </span>
                  {!template.is_active && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      未启用
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-slate-600">系统提示词: </span>
                  <p className="text-slate-800 line-clamp-2">{template.system_prompt}</p>
                </div>

                <div>
                  <span className="text-slate-600">用户提示词模板: </span>
                  <p className="text-slate-800 line-clamp-2">{template.user_prompt_template}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200">
                <div className="text-xs text-slate-500">
                  版本: v{template.version} · 更新: {new Date(template.updated_at).toLocaleDateString()}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openTestPanel(template)}
                    className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                  >
                    <i className="fas fa-flask mr-1"></i>
                    测试
                  </button>
                  <button
                    onClick={() => openEditForm(template)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    <i className="fas fa-edit mr-1"></i>
                    编辑
                  </button>
                  <button
                    onClick={() => deleteTemplate(template.name)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  >
                    <i className="fas fa-trash mr-1"></i>
                    删除
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 编辑/新建表单模态框 */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-slate-800">
                  {currentTemplate ? '编辑提示词模板' : '新建提示词模板'}
                </h3>
                <button
                  onClick={closeForm}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <form onSubmit={saveTemplate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      代码名称 (英文) *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
                      placeholder="location_query"
                      required
                      disabled={!!currentTemplate}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      显示名称 *
                    </label>
                    <input
                      type="text"
                      value={formData.display_name}
                      onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
                      placeholder="地点/行程查询"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">场景类型</label>
                  <select
                    value={formData.scenario}
                    onChange={(e) => setFormData({ ...formData, scenario: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
                  >
                    {scenarios.map((scenario) => (
                      <option key={scenario.value} value={scenario.value}>
                        {scenario.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">系统提示词</label>
                  <textarea
                    value={formData.system_prompt}
                    onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF] resize-none"
                    placeholder="请输入系统提示词"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">用户提示词模板</label>
                  <textarea
                    value={formData.user_prompt_template}
                    onChange={(e) => setFormData({ ...formData, user_prompt_template: e.target.value })}
                    rows={8}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF] resize-none font-mono text-sm"
                    placeholder="请输入用户提示词模板，支持 {context}、{question} 等变量"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    可用变量: {'{context}'}, {'{question}'}, 以及自定义变量
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    变量列表 (用逗号分隔)
                  </label>
                  <input
                    type="text"
                    value={formData.variables}
                    onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
                    placeholder="{context}, {question}"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-slate-300 text-[#165DFF] shadow-sm focus:border-[#165DFF] focus:ring-[#165DFF]"
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm font-medium text-slate-700">
                    启用此模板
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#165DFF] text-white rounded-lg hover:bg-[#165DFF]/90 transition-colors"
                  >
                    {currentTemplate ? '更新模板' : '创建模板'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 测试面板模态框 */}
      {isTestOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-slate-800">测试提示词</h3>
                <button
                  onClick={() => setIsTestOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <form onSubmit={testPrompt} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    模板名称
                  </label>
                  <select
                    value={testData.templateName}
                    onChange={(e) => setTestData({ ...testData, templateName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
                    required
                  >
                    {templates.map((template) => (
                      <option key={template.id} value={template.name}>
                        {template.display_name} ({template.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    上下文信息
                  </label>
                  <textarea
                    value={testData.context}
                    onChange={(e) => setTestData({ ...testData, context: e.target.value })}
                    rows={6}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF] resize-none font-mono text-sm"
                    placeholder="输入检索到的上下文信息..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    用户问题
                  </label>
                  <input
                    type="text"
                    value={testData.question}
                    onChange={(e) => setTestData({ ...testData, question: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#165DFF]/20 focus:border-[#165DFF]"
                    placeholder="我2025年去过哪些地方"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsTestOpen(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <i className="fas fa-flask mr-2"></i>
                    运行测试
                  </button>
                </div>
              </form>

              {/* 测试结果 */}
              {testResult && (
                <div className="mt-6 space-y-4 border-t border-slate-200 pt-6">
                  <h4 className="text-lg font-semibold text-slate-800">测试结果</h4>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      系统提示词
                    </label>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <pre className="text-sm text-slate-800 whitespace-pre-wrap">{testResult.system_prompt}</pre>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      用户提示词 (变量替换后)
                    </label>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <pre className="text-sm text-slate-800 whitespace-pre-wrap">{testResult.user_prompt}</pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
