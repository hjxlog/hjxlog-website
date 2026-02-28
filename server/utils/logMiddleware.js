/**
 * 系统日志记录中间件
 * 自动记录API请求和响应，以及错误信息
 */

import pg from 'pg';
import { getClientIp } from './clientIp.js';
const { Client } = pg;

// 日志记录函数
async function logToDatabase(logData, dbClient) {
  try {
    if (!dbClient) {
      console.error('❌ [LOG] 数据库连接不可用，无法记录日志');
      return;
    }

    const {
      log_type = 'system',
      level = 'info',
      module = 'unknown',
      action,
      description,
      user_id = null,
      ip_address = null,
      user_agent = null,
      request_data = null,
      response_data = null,
      error_message = null,
      execution_time = null
    } = logData;

    const query = `
      INSERT INTO system_logs (
        log_type, level, module, action, description, 
        user_id, ip_address, user_agent, request_data, 
        response_data, error_message, execution_time
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `;

    const values = [
      log_type, level, module, action, description,
      user_id, ip_address, user_agent, 
      request_data ? JSON.stringify(request_data) : null,
      response_data ? JSON.stringify(response_data) : null,
      error_message, execution_time
    ];

    await dbClient.query(query, values);
    console.log(`📝 [LOG] 日志记录成功: ${module} - ${action}`);

  } catch (error) {
    console.error('❌ [LOG] 记录日志失败:', error.message);
  }
}

// 获取模块名称（从路径中提取）
function getModuleName(path) {
  const pathParts = path.split('/');
  if (pathParts.length >= 3 && pathParts[1] === 'api') {
    return pathParts[2];
  }
  return 'api';
}

// 判断是否需要记录请求数据
function shouldLogRequestData(method, path) {
  // 不记录GET请求的请求体
  if (method === 'GET') return false;
  
  // 不记录文件上传的请求体（太大）
  if (path.includes('/upload')) return false;
  
  return true;
}

// 判断是否需要记录响应数据
function shouldLogResponseData(path, statusCode) {
  // 记录所有成功响应的数据
  if (statusCode >= 200 && statusCode < 300) return true;
  
  // 也记录错误响应的数据
  if (statusCode >= 400) return true;
  
  // 不记录文件下载的响应体
  if (path.includes('/download') || path.includes('/file')) return false;
  
  return false;
}

// 请求日志中间件
function requestLogMiddleware(dbClient) {
  return (req, res, next) => {
    const startTime = Date.now();
    const originalSend = res.send;
    const originalJson = res.json;
    
    let responseData = null;
    let responseSent = false;

    // 拦截 res.send
    res.send = function(data) {
      if (!responseSent) {
        responseSent = true;
        // 只在成功时记录日志
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            responseData = typeof data === 'string' ? JSON.parse(data) : data;
          } catch (e) {
            responseData = data;
          }
          logRequest();
        }
      }
      return originalSend.call(this, data);
    };

    // 拦截 res.json
    res.json = function(data) {
      if (!responseSent) {
        responseSent = true;
        // 只在成功时记录日志
        if (res.statusCode >= 200 && res.statusCode < 300) {
          responseData = data;
          logRequest();
        }
      }
      return originalJson.call(this, data);
    };

    // 记录请求日志
    function logRequest() {
      // 过滤GET请求，不记录日志
      if (req.method === 'GET') {
        return;
      }
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      const logData = {
        log_type: 'operation',
        level: 'info',
        module: getModuleName(req.path),
        action: `${req.method} ${req.path}`,
        description: `操作成功: ${req.method} ${req.path}`,
        user_id: req.user?.id || null,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'] || null,
        request_data: shouldLogRequestData(req.method, req.path) ? {
          query: req.query,
          body: req.body,
          params: req.params
        } : null,
        response_data: responseData,
        error_message: null,
        execution_time: executionTime
      };

      // 异步记录日志，不阻塞响应
      setImmediate(() => {
        logToDatabase(logData, dbClient);
      });
    }

    next();
  };
}

// 错误日志中间件
function errorLogMiddleware(dbClient) {
  return (error, req, res, next) => {
    const logData = {
      log_type: 'error',
      level: 'error',
      module: getModuleName(req.path),
      action: `${req.method} ${req.path}`,
      description: `API错误: ${error.message}`,
      user_id: req.user?.id || null,
      ip_address: getClientIp(req),
      user_agent: req.headers['user-agent'] || null,
      request_data: shouldLogRequestData(req.method, req.path) ? {
        query: req.query,
        body: req.body,
        params: req.params
      } : null,
      error_message: error.stack || error.message
    };

    // 异步记录错误日志
    setImmediate(() => {
      logToDatabase(logData, dbClient);
    });

    next(error);
  };
}

// 手动记录日志的工具函数
function createLogger(dbClient) {
  return {
    // 记录操作日志
    operation: (module, action, description, additionalData = {}) => {
      const logData = {
        log_type: 'operation',
        level: 'info',
        module,
        action,
        description,
        ...additionalData
      };
      return logToDatabase(logData, dbClient);
    },

    // 记录错误日志
    error: (module, action, error, additionalData = {}) => {
      const logData = {
        log_type: 'error',
        level: 'error',
        module,
        action,
        description: `错误: ${error.message || error}`,
        error_message: error.stack || error.message || error,
        ...additionalData
      };
      return logToDatabase(logData, dbClient);
    },

    // 记录安全日志
    security: (module, action, description, additionalData = {}) => {
      const logData = {
        log_type: 'security',
        level: 'warn',
        module,
        action,
        description,
        ...additionalData
      };
      return logToDatabase(logData, dbClient);
    },

    // 记录系统日志
    system: (module, action, description, level = 'info', additionalData = {}) => {
      const logData = {
        log_type: 'system',
        level,
        module,
        action,
        description,
        ...additionalData
      };
      return logToDatabase(logData, dbClient);
    }
  };
}

export {
  requestLogMiddleware,
  errorLogMiddleware,
  createLogger,
  logToDatabase
};
