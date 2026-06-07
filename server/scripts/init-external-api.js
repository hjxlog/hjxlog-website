/**
 * 数据库初始化脚本
 * 创建 external_api_tokens 表
 */

import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildApiTokenPrefix, generateApiToken, hashApiToken } from '../utils/tokenValidator.js';

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
                token VARCHAR(255) UNIQUE,
                token_hash VARCHAR(64) UNIQUE,
                token_prefix VARCHAR(20),
                name VARCHAR(100) NOT NULL,
                description TEXT,
                source VARCHAR(50) NOT NULL,
                scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
                is_active BOOLEAN DEFAULT true,
                expires_at TIMESTAMP WITH TIME ZONE,
                last_used_at TIMESTAMP WITH TIME ZONE,
                last_used_ip INET,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                revoked_at TIMESTAMP WITH TIME ZONE,
                rotated_from_id INTEGER REFERENCES external_api_tokens(id) ON DELETE SET NULL,
                created_by VARCHAR(50) DEFAULT 'admin',
                CHECK (token IS NOT NULL OR token_hash IS NOT NULL)
            )
        `);
        console.log('  ✅ 创建表结构');

        // 创建索引
        await client.query('CREATE INDEX idx_external_api_tokens_token ON external_api_tokens(token)');
        await client.query('CREATE INDEX idx_external_api_tokens_token_hash ON external_api_tokens(token_hash)');
        await client.query('CREATE INDEX idx_external_api_tokens_source ON external_api_tokens(source)');
        await client.query('CREATE INDEX idx_external_api_tokens_scopes ON external_api_tokens USING GIN (scopes)');
        await client.query('CREATE INDEX idx_external_api_tokens_is_active ON external_api_tokens(is_active)');
        console.log('  ✅ 创建索引');

        // 生成并插入默认token
        const defaultToken = generateApiToken('api_');
        const defaultTokenHash = hashApiToken(defaultToken);
        const defaultTokenPrefix = buildApiTokenPrefix(defaultToken);

        await client.query(
            `INSERT INTO external_api_tokens
                (token, token_hash, token_prefix, name, description, source, scopes, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)`,
            [
                null,
                defaultTokenHash,
                defaultTokenPrefix,
                '默认外部API Token',
                '用于外部系统推送动态',
                'external',
                JSON.stringify([]),
                'admin'
            ]
        );
        console.log('  ✅ 插入默认Token');

        // 查询并显示token
        const result = await client.query('SELECT token_prefix, name, source, scopes FROM external_api_tokens');
        console.log('\n🎉 数据库初始化完成！');
        console.log('\n📋 当前Token列表：');
        result.rows.forEach((row, index) => {
            console.log(`  ${index + 1}. ${row.name}`);
            console.log(`     Token前缀: ${row.token_prefix}`);
            console.log(`     Source: ${row.source}`);
            console.log(`     Scopes: ${Array.isArray(row.scopes) ? row.scopes.join(',') : ''}`);
        });

        console.log(`\n🔑 默认Token明文（仅显示一次）: ${defaultToken}`);
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
