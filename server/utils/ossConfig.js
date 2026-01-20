import OSS from 'ali-oss';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';

// OSS客户端配置
const createOSSClient = () => {
  return new OSS({
    region: process.env.OSS_REGION,
    accessKeyId: process.env.OSS_ACCESS_KEY_ID,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
    bucket: process.env.OSS_BUCKET
  });
};

// 生成唯一文件名
const generateFileName = (originalName) => {
  const ext = originalName.split('.').pop();
  const timestamp = Date.now();
  const uuid = uuidv4().substring(0, 8);
  return `hjxlog/images/${timestamp}-${uuid}.${ext}`;
};

// 验证文件类型
const validateFileType = (file) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const mimeType = mime.lookup(file.originalname) || file.mimetype;
  return allowedTypes.includes(mimeType);
};

// 验证文件大小 (20MB)
const validateFileSize = (file) => {
  const maxSize = 20 * 1024 * 1024; // 20MB
  return file.size <= maxSize;
};

// 生成预签名URL用于上传
const generatePresignedUrl = async (fileName, contentType) => {
  try {
    const client = createOSSClient();
    const url = await client.signatureUrl(fileName, {
      method: 'PUT',
      'Content-Type': contentType,
      expires: 3600 // 1小时过期
    });
    return url;
  } catch (error) {
    console.error('生成预签名URL失败:', error);
    throw new Error('生成上传URL失败');
  }
};

// 直接上传文件到OSS
const uploadToOSS = async (file) => {
  try {
    // 验证文件
    if (!validateFileType(file)) {
      throw new Error('不支持的文件类型，仅支持 JPEG、PNG、GIF、WebP 格式');
    }
    
    if (!validateFileSize(file)) {
      throw new Error('文件大小超过限制，最大支持 20MB');
    }

    const client = createOSSClient();
    const fileName = generateFileName(file.originalname);
    
    // 上传文件
    const result = await client.put(fileName, file.buffer, {
      headers: {
        'Content-Type': file.mimetype
      }
    });

    // 使用自定义域名或默认域名生成访问URL
    const accessUrl = getFileUrl(fileName);
    
    return {
      success: true,
      url: accessUrl,
      fileName: fileName,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype
    };
  } catch (error) {
    console.error('OSS上传失败:', error);
    throw error;
  }
};

// 批量上传文件
const uploadMultipleToOSS = async (files) => {
  try {
    const uploadPromises = files.map(file => uploadToOSS(file));
    const results = await Promise.allSettled(uploadPromises);
    
    const successful = [];
    const failed = [];
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        // 确保使用正确的URL
        const resultData = result.value;
        successful.push({
          ...resultData,
          url: getFileUrl(resultData.fileName)
        });
      } else {
        failed.push({
          file: files[index].originalname,
          error: result.reason.message
        });
      }
    });
    
    return {
      successful,
      failed,
      total: files.length
    };
  } catch (error) {
    console.error('批量上传失败:', error);
    throw error;
  }
};

// 删除OSS文件
const deleteFromOSS = async (fileName) => {
  try {
    const client = createOSSClient();
    await client.delete(fileName);
    return { success: true };
  } catch (error) {
    console.error('删除OSS文件失败:', error);
    throw error;
  }
};

// 获取文件访问URL
const getFileUrl = (fileName) => {
  // 如果配置了自定义域名，使用自定义域名
  if (process.env.OSS_CUSTOM_DOMAIN) {
    return `${process.env.OSS_CUSTOM_DOMAIN}/${fileName}`;
  }
  // 否则使用默认的OSS域名
  const baseUrl = `https://${process.env.OSS_BUCKET}.${process.env.OSS_REGION}.aliyuncs.com`;
  return `${baseUrl}/${fileName}`;
};

export {
  createOSSClient,
  generateFileName,
  validateFileType,
  validateFileSize,
  generatePresignedUrl,
  uploadToOSS,
  uploadMultipleToOSS,
  deleteFromOSS,
  getFileUrl
};