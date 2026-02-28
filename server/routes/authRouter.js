import express from 'express';
import bcrypt from 'bcrypt';
import { createAuthToken } from '../utils/authToken.js';

// 创建认证路由的工厂函数
export function createAuthRouter(getDbClient) {
    const router = express.Router();

    // 用户注册
    router.post('/register', async (req, res) => {
        try {
            const dbClient = getDbClient();
            if (!dbClient) {
                throw new Error('数据库未连接');
            }

            const { username, email, password, bio } = req.body;

            if (!username || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: '用户名、邮箱和密码不能为空'
                });
            }

            console.log('👤 [API] 用户注册请求:', { username, email });

            // 检查用户名是否已存在
            const existingUser = await dbClient.query(
                'SELECT id FROM users WHERE username = $1 OR email = $2',
                [username, email]
            );

            if (existingUser.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: '用户名或邮箱已存在'
                });
            }

            // 加密密码
            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(password, saltRounds);

            // 创建用户
            const result = await dbClient.query(
                `INSERT INTO users (username, email, password_hash, bio) 
         VALUES ($1, $2, $3, $4) RETURNING id, username, email, bio, created_at`,
                [username, email, passwordHash, bio || '']
            );

            console.log('✅ [API] 用户注册成功');
            res.status(201).json({
                success: true,
                data: result.rows[0],
                message: '注册成功'
            });

        } catch (error) {
            console.error('❌ [API] 用户注册失败:', error.message);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // 用户登录
    router.post('/login', async (req, res) => {
        try {
            const dbClient = getDbClient();
            if (!dbClient) {
                throw new Error('数据库未连接');
            }

            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: '用户名和密码不能为空'
                });
            }

            console.log('🔐 [API] 用户登录请求:', { username });

            // 查找用户
            const result = await dbClient.query(
                'SELECT id, username, email, password_hash, bio, avatar, created_at FROM users WHERE username = $1 OR email = $1',
                [username]
            );

            if (result.rows.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: '用户名或密码错误'
                });
            }

            const user = result.rows[0];

            // 验证密码
            const isValidPassword = await bcrypt.compare(password, user.password_hash);

            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: '用户名或密码错误'
                });
            }

            // 返回用户信息（不包含密码）
            const { password_hash, ...userInfo } = user;
            const token = createAuthToken({
                userId: userInfo.id,
                username: userInfo.username
            });

            console.log('✅ [API] 用户登录成功');
            res.json({
                success: true,
                data: userInfo,
                user: userInfo,
                token,
                message: '登录成功'
            });

        } catch (error) {
            console.error('❌ [API] 用户登录失败:', error.message);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    return router;
}

// 创建用户管理路由的工厂函数
export function createUsersRouter(getDbClient) {
    const router = express.Router();

    // 获取用户列表（管理员用）
    router.get('/', async (req, res) => {
        try {
            const dbClient = getDbClient();
            if (!dbClient) {
                throw new Error('数据库未连接');
            }

            console.log('👥 [API] 获取用户列表请求');

            const result = await dbClient.query(
                'SELECT id, username, email, bio, avatar, created_at FROM users ORDER BY created_at DESC'
            );

            console.log('✅ [API] 用户列表获取成功:', result.rows.length, '个用户');
            res.json({
                success: true,
                data: result.rows
            });

        } catch (error) {
            console.error('❌ [API] 获取用户列表失败:', error.message);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // 获取单个用户信息
    router.get('/:id', async (req, res) => {
        try {
            const dbClient = getDbClient();
            if (!dbClient) {
                throw new Error('数据库未连接');
            }

            const { id } = req.params;
            console.log('👤 [API] 获取用户信息请求:', id);

            const result = await dbClient.query(
                'SELECT id, username, email, bio, avatar, created_at FROM users WHERE id = $1',
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '用户不存在'
                });
            }

            console.log('✅ [API] 用户信息获取成功:', result.rows[0].username);
            res.json({
                success: true,
                data: result.rows[0]
            });

        } catch (error) {
            console.error('❌ [API] 获取用户信息失败:', error.message);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // 修改密码
    router.put('/:id/password', async (req, res) => {
        try {
            const dbClient = getDbClient();
            if (!dbClient) {
                throw new Error('数据库未连接');
            }

            const { id } = req.params;
            const { currentPassword, newPassword } = req.body;

            console.log('🔐 [API] 修改密码请求:', { id });

            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: '当前密码和新密码不能为空'
                });
            }

            // 获取用户当前密码哈希
            const userResult = await dbClient.query(
                'SELECT password_hash FROM users WHERE id = $1',
                [id]
            );

            if (userResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '用户不存在'
                });
            }

            // 验证当前密码
            const isValidPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);

            if (!isValidPassword) {
                return res.status(400).json({
                    success: false,
                    message: '当前密码不正确'
                });
            }

            // 加密新密码
            const saltRounds = 10;
            const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

            // 更新密码
            const updateResult = await dbClient.query(
                'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, username, email',
                [newPasswordHash, id]
            );

            console.log('✅ [API] 密码修改成功');
            res.json({
                success: true,
                data: updateResult.rows[0],
                message: '密码修改成功'
            });

        } catch (error) {
            console.error('❌ [API] 修改密码失败:', error.message);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    return router;
}
