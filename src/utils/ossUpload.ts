// 前端OSS图片上传工具函数
import { API_BASE_URL } from '@/config/api';

// 上传进度回调类型定义
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// 上传结果类型定义
export interface UploadResult {
  success: boolean;
  url?: string;
  fileName?: string;
  originalName?: string;
  size?: number;
  mimeType?: string;
  error?: string;
}

// 批量上传结果类型定义
export interface BatchUploadResult {
  successful: UploadResult[];
  failed: Array<{ file: string; error: string }>;
  total: number;
}

// API基础URL - 使用统一配置
// const API_BASE_URL 已从 @/config/api 导入

/**
 * 验证文件类型
 * @param {File} file - 要验证的文件
 * @returns {boolean} 是否为支持的图片类型
 */
export const validateImageType = (file) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return allowedTypes.includes(file.type);
};

/**
 * 验证文件大小
 * @param {File} file - 要验证的文件
 * @param {number} maxSize - 最大文件大小（字节），默认15MB
 * @returns {boolean} 文件大小是否符合要求
 */
export const validateImageSize = (file, maxSize = 15 * 1024 * 1024) => {
  return file.size <= maxSize;
};

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的文件大小
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 单个图片上传到OSS
 * @param {File} file - 要上传的图片文件
 * @param {Function} onProgress - 上传进度回调函数
 * @returns {Promise<UploadResult>} 上传结果
 */
export const uploadImageToOSS = async (file, onProgress) => {
  try {
    // 验证文件类型
    if (!validateImageType(file)) {
      throw new Error('不支持的文件类型，仅支持 JPEG、PNG、GIF、WebP 格式');
    }

    // 验证文件大小
    if (!validateImageSize(file)) {
      throw new Error('文件大小超过限制，最大支持 15MB');
    }

    // 创建FormData
    const formData = new FormData();
    formData.append('image', file);
    
    console.log('🔍 [OSS上传] 准备上传文件:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      formDataEntries: Array.from(formData.entries()).map(([key, value]) => ({
        key,
        value: value instanceof File ? `File: ${value.name}` : value
      }))
    });

    // 创建XMLHttpRequest以支持上传进度
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // 监听上传进度
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = {
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100)
          };
          onProgress(progress);
        }
      });

      // 监听请求完成
      xhr.addEventListener('load', () => {
        console.log('📡 [OSS上传] 收到响应:', {
          status: xhr.status,
          statusText: xhr.statusText,
          responseText: xhr.responseText
        });
        
        try {
          const response = JSON.parse(xhr.responseText);
          console.log('📋 [OSS上传] 解析响应:', response);
          
          if (xhr.status === 200 && response.success) {
            console.log('✅ [OSS上传] 上传成功');
            resolve({
              success: true,
              url: response.data.url,
              fileName: response.data.fileName,
              originalName: response.data.originalName,
              size: response.data.size,
              mimeType: response.data.mimeType
            });
          } else {
            console.log('❌ [OSS上传] 上传失败:', response.message);
            reject(new Error(response.message || '上传失败'));
          }
        } catch (error) {
          console.error('❌ [OSS上传] 解析响应失败:', error);
          reject(new Error('解析响应失败'));
        }
      });

      // 监听请求错误
      xhr.addEventListener('error', () => {
        reject(new Error('网络错误'));
      });

      // 发送请求
      const uploadUrl = `${API_BASE_URL}/api/upload/image`;
      console.log('🚀 [OSS上传] 发送请求到:', uploadUrl);
      
      xhr.open('POST', uploadUrl);
      xhr.send(formData);
      
      console.log('📤 [OSS上传] 请求已发送');
    });

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 批量图片上传到OSS
 * @param {File[]} files - 要上传的图片文件数组
 * @param {Function} onProgress - 整体上传进度回调函数
 * @param {Function} onFileProgress - 单个文件上传进度回调函数
 * @returns {Promise<BatchUploadResult>} 批量上传结果
 */
export const uploadMultipleImagesToOSS = async (files, onProgress, onFileProgress) => {
  try {
    const results = {
      successful: [],
      failed: [],
      total: files.length
    };

    let completedCount = 0;

    // 并发上传所有文件
    const uploadPromises = files.map(async (file, index) => {
      try {
        const result = await uploadImageToOSS(file, (progress) => {
          if (onFileProgress) {
            onFileProgress(index, progress);
          }
        });

        if (result.success) {
          results.successful.push(result);
        } else {
          results.failed.push({
            file: file.name,
            error: result.error || '上传失败'
          });
        }
      } catch (error) {
        results.failed.push({
          file: file.name,
          error: error.message
        });
      } finally {
        completedCount++;
        if (onProgress) {
          onProgress({
            completed: completedCount,
            total: files.length,
            percentage: Math.round((completedCount / files.length) * 100)
          });
        }
      }
    });

    await Promise.all(uploadPromises);
    return results;

  } catch (error) {
    throw new Error(`批量上传失败: ${error.message}`);
  }
};

/**
 * 使用预签名URL上传图片（前端直传OSS）
 * @param {File} file - 要上传的图片文件
 * @param {Function} onProgress - 上传进度回调函数
 * @returns {Promise<UploadResult>} 上传结果
 */
export const uploadImageWithPresignedUrl = async (file, onProgress) => {
  try {
    // 验证文件
    if (!validateImageType(file)) {
      throw new Error('不支持的文件类型，仅支持 JPEG、PNG、GIF、WebP 格式');
    }

    if (!validateImageSize(file)) {
      throw new Error('文件大小超过限制，最大支持 15MB');
    }

    // 生成文件名
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split('.').pop();
    const fileName = `moments/${timestamp}-${randomStr}.${ext}`;

    // 获取预签名URL
    const presignedResponse = await fetch(`${API_BASE_URL}/api/upload/presigned-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileName: fileName,
        contentType: file.type
      })
    });

    const presignedData = await presignedResponse.json();
    if (!presignedData.success) {
      throw new Error(presignedData.message || '获取上传URL失败');
    }

    // 使用预签名URL上传文件
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // 监听上传进度
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = {
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100)
          };
          onProgress(progress);
        }
      });

      // 监听请求完成
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          // 构建文件访问URL
          const fileUrl = presignedData.data.uploadUrl.split('?')[0];
          resolve({
            success: true,
            url: fileUrl,
            fileName: fileName,
            originalName: file.name,
            size: file.size,
            mimeType: file.type
          });
        } else {
          reject(new Error('上传失败'));
        }
      });

      // 监听请求错误
      xhr.addEventListener('error', () => {
        reject(new Error('网络错误'));
      });

      // 发送PUT请求上传文件
      xhr.open('PUT', presignedData.data.uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 删除OSS文件
 * @param {string} fileName - 要删除的文件名
 * @returns {Promise<boolean>} 删除是否成功
 */
export const deleteImageFromOSS = async (fileName) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/upload/file/${encodeURIComponent(fileName)}`, {
      method: 'DELETE'
    });

    const data = await response.json();
    return data.success;

  } catch (error) {
    console.error('删除文件失败:', error);
    return false;
  }
};

/**
 * 从URL中提取文件名
 * @param {string} url - 文件URL
 * @returns {string} 文件名
 */
export const extractFileNameFromUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.substring(1); // 去掉开头的 '/'
  } catch (error) {
    console.error('提取文件名失败:', error);
    return '';
  }
};

/**
 * 压缩图片
 * @param {File} file - 原始图片文件
 * @param {number} quality - 压缩质量 (0-1)
 * @param {number} maxWidth - 最大宽度
 * @param {number} maxHeight - 最大高度
 * @returns {Promise<File>} 压缩后的图片文件
 */
export const compressImage = (file, quality = 0.8, maxWidth = 1920, maxHeight = 1080) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // 计算新的尺寸
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      // 绘制图片
      ctx.drawImage(img, 0, 0, width, height);

      // 转换为Blob
      canvas.toBlob((blob) => {
        const compressedFile = new File([blob], file.name, {
          type: file.type,
          lastModified: Date.now()
        });
        resolve(compressedFile);
      }, file.type, quality);
    };

    img.src = URL.createObjectURL(file);
  });
};

export default {
  uploadImageToOSS,
  uploadMultipleImagesToOSS,
  uploadImageWithPresignedUrl,
  deleteImageFromOSS,
  validateImageType,
  validateImageSize,
  formatFileSize,
  extractFileNameFromUrl,
  compressImage
};