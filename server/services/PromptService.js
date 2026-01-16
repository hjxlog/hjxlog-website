/**
 * 提示词管理服务
 * 管理不同场景的AI提示词模板
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PromptService {
  constructor(dbClient) {
    this.db = dbClient;
  }

  /**
   * 获取所有提示词模板
   */
  async getAllTemplates() {
    try {
      const result = await this.db.query(`
        SELECT id, name, display_name, scenario, keywords,
               system_prompt, user_prompt_template, variables,
               is_active, version, created_at, updated_at
        FROM prompt_templates
        ORDER BY scenario, name
      `);

      return {
        success: true,
        data: result.rows,
      };
    } catch (error) {
      console.error('[PromptService] 获取模板失败:', error);
      return {
        success: false,
        data: [],
        error: error.message,
      };
    }
  }

  /**
   * 获取单个模板
   */
  async getTemplate(name) {
    try {
      const result = await this.db.query(
        'SELECT * FROM prompt_templates WHERE name = $1',
        [name]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          data: null,
          error: '模板不存在',
        };
      }

      return {
        success: true,
        data: result.rows[0],
      };
    } catch (error) {
      console.error('[PromptService] 获取模板失败:', error);
      return {
        success: false,
        data: null,
        error: error.message,
      };
    }
  }

  /**
   * 创建模板
   */
  async createTemplate(template) {
    try {
      const {
        name,
        display_name,
        scenario,
        keywords = [],
        system_prompt,
        user_prompt_template,
        variables = ['{context}', '{question}'],
      } = template;

      const result = await this.db.query(
        `INSERT INTO prompt_templates
         (name, display_name, scenario, keywords, system_prompt, user_prompt_template, variables)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [name, display_name, scenario, keywords, system_prompt, user_prompt_template, variables]
      );

      return {
        success: true,
        data: result.rows[0],
      };
    } catch (error) {
      console.error('[PromptService] 创建模板失败:', error);

      // 检查是否是唯一约束冲突
      if (error.message.includes('already exists')) {
        return {
          success: false,
          error: '模板名称已存在',
        };
      }

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 更新模板
   */
  async updateTemplate(name, updates) {
    try {
      const allowedFields = [
        'display_name',
        'scenario',
        'keywords',
        'system_prompt',
        'user_prompt_template',
        'variables',
        'is_active',
      ];

      const setClause = [];
      const values = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          if (key === 'keywords' || key === 'variables') {
            setClause.push(`${key} = $${paramIndex++}`);
            values.push(value);
          } else {
            setClause.push(`${key} = $${paramIndex++}`);
            values.push(value);
          }
        }
      }

      if (setClause.length === 0) {
        return {
          success: false,
          error: '没有有效的更新字段',
        };
      }

      values.push(name); // WHERE 条件

      const query = `
        UPDATE prompt_templates
        SET ${setClause.join(', ')}, version = version + 1
        WHERE name = $${paramIndex}
        RETURNING *
      `;

      const result = await this.db.query(query, values);

      if (result.rows.length === 0) {
        return {
          success: false,
          error: '模板不存在',
        };
      }

      return {
        success: true,
        data: result.rows[0],
      };
    } catch (error) {
      console.error('[PromptService] 更新模板失败:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 删除模板
   */
  async deleteTemplate(name) {
    try {
      const result = await this.db.query(
        'DELETE FROM prompt_templates WHERE name = $1 RETURNING *',
        [name]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: '模板不存在',
        };
      }

      return {
        success: true,
        data: result.rows[0],
      };
    } catch (error) {
      console.error('[PromptService] 删除模板失败:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 根据检索结果类型自动选择最佳模板
   * @param {Array} documents - 检索到的文档列表
   * @returns {Promise<Object>} 选中的模板
   */
  async selectTemplateByDocuments(documents) {
    try {
      if (!documents || documents.length === 0) {
        // 没有检索结果，返回通用模板
        return await this.getTemplate('general_query');
      }

      // 统计检索结果的类型分布
      const typeCount = {
        photo: 0,
        work: 0,
        blog: 0,
      };

      for (const doc of documents) {
        if (doc.source_type === 'photo') typeCount.photo++;
        else if (doc.source_type === 'work') typeCount.work++;
        else if (doc.source_type === 'blog') typeCount.blog++;
      }

      const total = documents.length;
      console.log(`[PromptService] 文档类型分布: photo=${typeCount.photo}, work=${typeCount.work}, blog=${typeCount.blog}, total=${total}`);

      // 根据主要结果类型选择模板（占30%以上）
      const threshold = Math.max(3, total * 0.3);

      if (typeCount.photo >= threshold) {
        console.log(`[PromptService] 选择地点查询模板 (照片占比: ${(typeCount.photo / total * 100).toFixed(1)}%)`);
        return await this.getTemplate('location_query');
      } else if (typeCount.work >= threshold) {
        console.log(`[PromptService] 选择技术查询模板 (作品占比: ${(typeCount.work / total * 100).toFixed(1)}%)`);
        return await this.getTemplate('tech_query');
      } else if (typeCount.blog >= threshold) {
        console.log(`[PromptService] 选择内容查询模板 (博客占比: ${(typeCount.blog / total * 100).toFixed(1)}%)`);
        return await this.getTemplate('content_query');
      } else {
        // 混合类型或数量较少，使用通用模板
        console.log(`[PromptService] 使用通用查询模板 (混合类型)`);
        return await this.getTemplate('general_query');
      }
    } catch (error) {
      console.error('[PromptService] 选择模板失败:', error);
      // 降级到通用模板
      return await this.getTemplate('general_query');
    }
  }

  /**
   * 测试提示词
   */
  async testPrompt(templateName, context, question) {
    try {
      const templateResult = await this.getTemplate(templateName);
      if (!templateResult.success) {
        return templateResult;
      }

      const template = templateResult.data;

      // 替换变量
      let prompt = template.user_prompt_template;
      prompt = prompt.replace(/{context}/g, context);
      prompt = prompt.replace(/{question}/g, question);

      return {
        success: true,
        data: {
          system_prompt: template.system_prompt,
          user_prompt: prompt,
          template_name: template.name,
        },
      };
    } catch (error) {
      console.error('[PromptService] 测试提示词失败:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 获取场景统计
   */
  async getScenarioStats() {
    try {
      const result = await this.db.query(`
        SELECT
          scenario,
          COUNT(*) as count,
          COUNT(*) FILTER (WHERE is_active = true) as active_count
        FROM prompt_templates
        GROUP BY scenario
        ORDER BY scenario
      `);

      return {
        success: true,
        data: result.rows,
      };
    } catch (error) {
      console.error('[PromptService] 获取统计失败:', error);
      return {
        success: false,
        data: [],
        error: error.message,
      };
    }
  }
}

export default PromptService;
