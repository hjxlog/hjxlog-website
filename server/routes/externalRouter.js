/**
 * 外部API路由
 * 用于外部系统推送数据到网站（如OpenClaw推送日记）
 */

import express from 'express';
import multer from 'multer';
import {
    uploadToOSS,
    uploadMultipleToOSS,
    validateFileType
} from '../utils/ossConfig.js';
import { createLogger } from '../utils/logMiddleware.js';
import { createTokenAuthMiddleware } from '../utils/tokenValidator.js';

const logger = createLogger('ExternalAPI');

// 创建外部API路由
export function createExternalRouter(getDbClient) {
    const router = express.Router();

    // 获取Token认证中间件
    const getTokenAuthMiddleware = () => {
        const dbClient = getDbClient();
        if (!dbClient) {
            throw new Error('数据库未连接');
        }
        return createTokenAuthMiddleware(dbClient);
    };

    // 配置multer用于接收图片（使用内存存储）
    const upload = multer({
        storage: multer.memoryStorage(),
        limits: {
            fileSize: 10 * 1024 * 1024, // 单个文件最大10MB
            files: 9 // 最多9张图片
        }
    });

    /**
     * POST /api/external/moments
     * 推送日记/动态（支持Markdown + 图片）
     */
    router.post('/moments', getTokenAuthMiddleware(), upload.array('images', 9), async (req, res) => {
        const dbClient = getDbClient();
        const tokenInfo = req.apiToken;

        try {
            logger.info('收到外部API推送请求', {
                source: tokenInfo.source,
                tokenName: tokenInfo.name,
                hasImages: !!req.files
            });

            // 获取表单数据和文件
            const { content, visibility = 'private' } = req.body;
            const files = req.files || [];

            // 验证必填字段
            if (!content || content.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: '内容不能为空'
                });
            }

            // 上传图片到OSS
            let imageUrls = [];
            if (files.length > 0) {
                logger.info(`开始上传 ${files.length} 张图片到OSS`);
                
                try {
                    const uploadPromises = files.map(async (file) => {
                        // 验证文件类型
                        if (!validateFileType(file)) {
                            throw new Error(`不支持的文件类型: ${file.originalname}`);
                        }

                        // 生成文件名：moments/时间戳_随机数.ext
                        const timestamp = Date.now();
                        const random = Math.random().toString(36).substring(2, 8);
                        const ext = file.originalname.split('.').pop();
                        const fileName = `moments/${timestamp}_${random}.${ext}`;

                        // 上传到OSS
                        const imageUrl = await uploadToOSS(
                            file.buffer,
                            fileName,
                            file.mimetype
                        );

                        return imageUrl;
                    });

                    imageUrls = await Promise.all(uploadPromises);
                    logger.info(`成功上传 ${imageUrls.length} 张图片`, {
                        urls: imageUrls
                    });

                } catch (uploadError) {
                    logger.error('图片上传失败', { error: uploadError.message });
                    return res.status(500).json({
                        success: false,
                        message: `图片上传失败: ${uploadError.message}`
                    });
                }
            }

            // 插入数据库
            const imagesStr = imageUrls.length > 0 ? imageUrls.join(',') : null;

            const insertResult = await dbClient.query(
                `INSERT INTO moments (content, visibility, images, author_id)
                 VALUES ($1, $2, $3, $4)
                 RETURNING id, content, visibility, images, created_at`,
                [content, visibility, imagesStr, tokenInfo.source]
            );

            const newMoment = insertResult.rows[0];

            logger.info('日记推送成功', {
                momentId: newMoment.id,
                visibility: newMoment.visibility,
                hasImages: !!newMoment.images
            });

            return res.status(201).json({
                success: true,
                message: '日记推送成功',
                data: {
                    id: newMoment.id,
                    content: newMoment.content,
                    visibility: newMoment.visibility,
                    images: newMoment.images ? newMoment.images.split(',') : [],
                    created_at: newMoment.created_at
                }
            });

        } catch (error) {
            logger.error('外部API推送失败', {
                error: error.message,
                stack: error.stack
            });

            return res.status(500).json({
                success: false,
                message: `推送失败: ${error.message}`
            });
        }
    });

    /**
     * GET /api/external/health
     * 健康检查（不需要认证）
     */
    router.get('/health', (req, res) => {
        res.json({
            success: true,
            service: 'external-api',
            status: 'running',
            timestamp: new Date().toISOString()
        });
    });

    /**
     * GET /api/external/tokens
     * 获取当前token信息（需要认证）
     */
    router.get('/tokens', getTokenAuthMiddleware(), (req, res) => {
        const tokenInfo = req.apiToken;
        res.json({
            success: true,
            data: {
                name: tokenInfo.name,
                source: tokenInfo.source,
                description: tokenInfo.description
            }
        });
    });

    return router;
}
