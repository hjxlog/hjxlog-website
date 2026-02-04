/**
 * 数据库初始化脚本
 * 创建 external_api_tokens 表
 */

import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Client } = pg;

async function initDatabase() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'postgres',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '123456'
    });

    try {
        console.log('🔗 正在连接数据库...');
        await client.connect();
        console.log('✅ 数据库连接成功');

        console.log('📋 创建 external_api_tokens 表...');
        
        // 删除已存在的表
        await client.query('DROP TABLE IF EXISTS external_api_tokens CASCADE');
        console.log('  ✅ 清理旧表（如果存在）');

        // 创建表
        await client.query(`
            CREATE TABLE external_api_tokens (
                id SERIAL PRIMARY KEY,
                token VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                source VARCHAR(50) NOT NULL,
                is_active BOOLEAN DEFAULT true,
                last_used_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                created_by VARCHAR(50) DEFAULT 'admin'
            )
        `);
        console.log('  ✅ 创建表结构');

        // 创建索引
        await client.query('CREATE INDEX idx_external_api_tokens_token ON external_api_tokens(token)');
        await client.query('CREATE INDEX idx_external_api_tokens_source ON external_api_tokens(source)');
        await client.query('CREATE INDEX idx_external_api_tokens_is_active ON external_api_tokens(is_active)');
        console.log('  ✅ 创建索引');

        // 生成并插入默认token
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        const tokenHash = Buffer.from(`oc_${timestamp}${random}`).toString('base64');
        const defaultToken = 'oc_' + tokenHash.replace(/[^a-zA-Z0-9]/g, '').substring(0, 40);

        await client.query(
            `INSERT INTO external_api_tokens (token, name, description, source, created_by)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                defaultToken,
                'OpenClaw内部Token',
                '用于OpenClaw系统推送日记和动态',
                'openclaw',
                'admin'
            ]
        );
        console.log('  ✅ 插入默认Token');

        // 查询并显示token
        const result = await client.query('SELECT token, name, source FROM external_api_tokens');
        console.log('\n🎉 数据库初始化完成！');
        console.log('\n📋 当前Token列表：');
        result.rows.forEach((row, index) => {
            console.log(`  ${index + 1}. ${row.name}`);
            console.log(`     Token: ${row.token}`);
            console.log(`     Source: ${row.source}`);
        });

        console.log('\n⚠️  请妥善保存以上Token，用于API认证！');

    } catch (error) {
        console.error('❌ 数据库初始化失败:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await client.end();
        console.log('\n🔌 数据库连接已关闭');
    }
}

// 执行初始化
initDatabase();
