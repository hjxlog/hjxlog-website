import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取统一 Schema 文件
const sqlFilePath = path.join(__dirname, '../../database/dbschema/001_schema.sql');
const sql = fs.readFileSync(sqlFilePath, 'utf-8');

// 数据库配置
const client = new pg.Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
});

console.log('📡 正在连接数据库...');

try {
  await client.connect();
  console.log('✅ 数据库连接成功');

  console.log('📝 正在执行 SQL: dbschema/001_schema.sql');
  await client.query(sql);
  console.log('✅ 表创建成功！');

  // 验证表是否创建成功
  const tables = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema='public'
    AND table_name IN ('daily_thoughts', 'long_term_memory')
    ORDER BY table_name;
  `);

  console.log('\n📊 已创建的表：');
  tables.rows.forEach(row => {
    console.log(`  - ${row.table_name}`);
  });

} catch (error) {
  console.error('❌ 错误：', error.message);
  process.exit(1);
} finally {
  await client.end();
  console.log('\n👋 数据库连接已关闭');
}
