/**
 * HQHelper 外部项目脚本：上传源语言 (zh.json)
 *
 * 用法:
 *   node scripts/upload-source.cjs
 *
 * 说明:
 *   - 读取项目根目录 .env.local 中的 HQHELPER_API_URL 与 HQHELPER_API_KEY
 *   - 上传 src/locales/zh.json 至 HQHelper API
 *   - 该接口需管理员（admin）权限的 API Key
 */

const fs = require('fs');
const path = require('path');

// 读取 .env.local
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        // 去除可能的引号
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

async function main() {
  loadEnv();

  const apiUrl = process.env.HQHELPER_API_URL?.replace(/\/+$/, '');
  const apiKey = process.env.HQHELPER_API_KEY;

  if (!apiUrl) {
    console.error('❌ 错误: 未在 .env.local 中配置 HQHELPER_API_URL');
    process.exit(1);
  }
  if (!apiKey) {
    console.error('❌ 错误: 未在 .env.local 中配置 HQHELPER_API_KEY');
    process.exit(1);
  }

  const filePath = path.resolve(process.cwd(), 'src/locales/zh.json');
  if (!fs.existsSync(filePath)) {
    console.error(`❌ 错误: 未找到源语言文件: ${filePath}`);
    process.exit(1);
  }

  const jsonContent = fs.readFileSync(filePath, 'utf-8');

  // 验证本地 JSON 语法
  try {
    JSON.parse(jsonContent);
  } catch (err) {
    console.error(`❌ 错误: ${filePath} 格式不是合法的 JSON:`, err.message);
    process.exit(1);
  }

  console.log(`🚀 正在上传源语言 JSON 到 ${apiUrl}/api/external/translation/source ...`);

  try {
    const response = await fetch(`${apiUrl}/api/external/translation/source`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ jsonContent }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`❌ 上传失败 (${response.status}):`, data.error || data);
      process.exit(1);
    }

    console.log(`✅ 上传成功！`);
    console.log(`   - 词条总数: ${data.keyCount}`);
    console.log(`   - 源文变动词条数: ${data.sourceChangedCount}`);
    if (data.reviewDemotedCount > 0) {
      console.log(`   - 因源文变更降级为待审核的翻译数: ${data.reviewDemotedCount}`);
    }
  } catch (err) {
    console.error('❌ 网络请求失败:', err.message);
    process.exit(1);
  }
}

main();
