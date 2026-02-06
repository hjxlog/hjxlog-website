/**
 * 外部API测试脚本
 * 用于测试 /api/external/moments 接口
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const CONFIG = {
    API_URL: process.env.API_URL || 'http://localhost:3006',
    API_TOKEN: process.env.API_TOKEN || 'your_token_here', // 从数据库初始化脚本获取
};

// 颜色输出
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * 测试1：健康检查
 */
async function testHealth() {
    log('\n========================================', 'blue');
    log('测试1：健康检查', 'blue');
    log('========================================', 'blue');

    try {
        const response = await fetch(`${CONFIG.API_URL}/api/external/health`);
        const data = await response.json();

        if (data.success) {
            log('✅ 健康检查通过', 'green');
            console.log(JSON.stringify(data, null, 2));
            return true;
        } else {
            log('❌ 健康检查失败', 'red');
            return false;
        }
    } catch (error) {
        log(`❌ 请求失败: ${error.message}`, 'red');
        return false;
    }
}

/**
 * 测试2：推送纯文本日记
 */
async function testTextMoment() {
    log('\n========================================', 'blue');
    log('测试2：推送纯文本日记', 'blue');
    log('========================================', 'blue');

    const formData = new FormData();
    formData.append('content', `# 今天的学习笔记

学习了如何使用外部API推送数据到网站。

## 关键点
- Token认证机制
- 图片上传到OSS
- 数据库存储

测试时间：${new Date().toLocaleString('zh-CN')}`);

    formData.append('visibility', 'private');

    try {
        const response = await fetch(`${CONFIG.API_URL}/api/external/moments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CONFIG.API_TOKEN}`
            },
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            log('✅ 纯文本日记推送成功', 'green');
            console.log(JSON.stringify(data, null, 2));
            return true;
        } else {
            log('❌ 推送失败', 'red');
            console.log(JSON.stringify(data, null, 2));
            return false;
        }
    } catch (error) {
        log(`❌ 请求失败: ${error.message}`, 'red');
        return false;
    }
}

/**
 * 测试3：推送带图片的日记
 */
async function testMomentWithImage() {
    log('\n========================================', 'blue');
    log('测试3：推送带图片的日记', 'blue');
    log('========================================', 'blue');

    // 检查是否有测试图片
    const testImagePath = path.join(__dirname, '../../test-image.jpg');
    
    if (!fs.existsSync(testImagePath)) {
        log('⚠️  未找到测试图片，跳过此测试', 'yellow');
        log(`   需要图片：${testImagePath}`, 'yellow');
        return null;
    }

    const imageBuffer = fs.readFileSync(testImagePath);
    const blob = new Blob([imageBuffer]);

    const formData = new FormData();
    formData.append('content', `# 带图片的日记

这是一篇包含图片的测试日记。

![测试图片](image)

上传时间：${new Date().toLocaleString('zh-CN')}`);

    formData.append('visibility', 'private');
    formData.append('images', blob, 'test-image.jpg');

    try {
        const response = await fetch(`${CONFIG.API_URL}/api/external/moments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CONFIG.API_TOKEN}`
            },
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            log('✅ 带图片日记推送成功', 'green');
            console.log(JSON.stringify(data, null, 2));
            return true;
        } else {
            log('❌ 推送失败', 'red');
            console.log(JSON.stringify(data, null, 2));
            return false;
        }
    } catch (error) {
        log(`❌ 请求失败: ${error.message}`, 'red');
        return false;
    }
}

/**
 * 测试4：无效Token测试
 */
async function testInvalidToken() {
    log('\n========================================', 'blue');
    log('测试4：无效Token测试（应返回403）', 'blue');
    log('========================================', 'blue');

    const formData = new FormData();
    formData.append('content', '这是一次使用无效Token的测试');

    try {
        const response = await fetch(`${CONFIG.API_URL}/api/external/moments`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer invalid_token_12345'
            },
            body: formData
        });

        const data = await response.json();

        if (response.status === 403 && !data.success) {
            log('✅ Token验证机制工作正常', 'green');
            console.log(JSON.stringify(data, null, 2));
            return true;
        } else {
            log('❌ Token验证机制可能有问题', 'red');
            console.log(JSON.stringify(data, null, 2));
            return false;
        }
    } catch (error) {
        log(`❌ 请求失败: ${error.message}`, 'red');
        return false;
    }
}

/**
 * 主测试函数
 */
async function runTests() {
    log('\n🚀 开始外部API测试', 'blue');
    log(`📍 API地址: ${CONFIG.API_URL}`, 'blue');
    log(`🔑 Token: ${CONFIG.API_TOKEN.substring(0, 20)}...`, 'blue');

    const results = {
        healthCheck: await testHealth(),
        textMoment: await testTextMoment(),
        momentWithImage: await testMomentWithImage(),
        invalidToken: await testInvalidToken()
    };

    // 统计结果
    log('\n========================================', 'blue');
    log('测试结果汇总', 'blue');
    log('========================================', 'blue');

    const passed = Object.values(results).filter(r => r === true).length;
    const failed = Object.values(results).filter(r => r === false).length;
    const skipped = Object.values(results).filter(r => r === null).length;

    log(`✅ 通过: ${passed}`, 'green');
    log(`❌ 失败: ${failed}`, failed > 0 ? 'red' : 'reset');
    log(`⚠️  跳过: ${skipped}`, 'yellow');

    if (failed === 0) {
        log('\n🎉 所有测试通过！', 'green');
    } else {
        log('\n⚠️  部分测试失败，请检查配置和服务状态', 'yellow');
    }
}

// 执行测试
runTests().catch(error => {
    log(`\n💥 测试执行出错: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
});
