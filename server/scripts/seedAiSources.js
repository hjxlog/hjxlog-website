/**
 * Seed AI info sources and weights from config.
 */
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.join(__dirname, '../../.env') });

const { Client } = pg;

const CONFIG_PATH = path.join(__dirname, '../config/ai_sources.default.json');

function loadConfig() {
  const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
  return JSON.parse(raw);
}

async function seed() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  await client.connect();
  console.log('✓ 数据库连接成功');

  const { sources = [] } = loadConfig();
  let upserted = 0;
  let weightsUpserted = 0;

  for (const source of sources) {
    const {
      name,
      url,
      rss: rssUrl = null,
      type,
      description = null,
      tags = [],
      active = true,
      weights = {},
    } = source;

    const upsertSource = await client.query(
      `INSERT INTO ai_sources (name, url, rss_url, type, description, tags, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (url) DO UPDATE SET
         name = EXCLUDED.name,
         rss_url = EXCLUDED.rss_url,
         type = EXCLUDED.type,
         description = EXCLUDED.description,
         tags = EXCLUDED.tags,
         active = EXCLUDED.active,
         updated_at = NOW()
       RETURNING id`,
      [name, url, rssUrl, type, description, tags, active]
    );

    const sourceId = upsertSource.rows[0].id;
    upserted++;

    for (const [category, weight] of Object.entries(weights)) {
      await client.query(
        `INSERT INTO ai_source_weights (source_id, category, weight)
         VALUES ($1, $2, $3)
         ON CONFLICT (source_id, category) DO UPDATE SET
           weight = EXCLUDED.weight,
           updated_at = NOW()`,
        [sourceId, category, weight]
      );
      weightsUpserted++;
    }
  }

  console.log(`✓ 资讯源已更新: ${upserted} 条`);
  console.log(`✓ 权重已更新: ${weightsUpserted} 条`);
  await client.end();
  console.log('✓ 数据库连接已关闭');
}

seed().catch((error) => {
  console.error('❌ 资讯源初始化失败:', error.message);
  console.error(error);
  process.exit(1);
});
