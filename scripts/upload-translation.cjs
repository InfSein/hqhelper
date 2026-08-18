/**
 * HQHelper 外部项目脚本：上传目标语言翻译 (ja.json / en.json)
 *
 * 用法:
 *   node scripts/upload-translation.cjs          # 上传所有语言 (ja, en)
 *   node scripts/upload-translation.cjs ja       # 仅上传日语
 *   node scripts/upload-translation.cjs en       # 仅上传英语
 *   node scripts/upload-translation.cjs ja --auto-review  # 上传并自动标记为已审核
 *
 * 说明:
 *   - 读取项目根目录 .env.local 中的 HQHELPER_API_URL 与 HQHELPER_API_KEY
 *   - 上传 src/locales/{language}.json 至 HQHelper API
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

async function uploadLanguage(apiUrl, apiKey, language, autoReview) {
  const filePath = path.resolve(process.cwd(), `src/locales/${language}.json`);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️ 跳过: 未找到文件 ${filePath}`);
    return;
  }

  const jsonContent = fs.readFileSync(filePath, 'utf-8');

  try {
    JSON.parse(jsonContent);
  } catch (err) {
    console.error(`❌ 错误: ${filePath} 格式不是合法的 JSON:`, err.message);
    return;
  }

  console.log(`🚀 正在上传 [${language}] 翻译字典 ...`);

  try {
    const response = await fetch(`${apiUrl}/api/external/translation/entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        language,
        jsonContent,
        autoReview,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`❌ [${language}] 上传失败 (${response.status}):`, data.error || data);
    } else {
      console.log(`✅ [${language}] 上传成功！更新词条数: ${data.updatedCount} (审核状态: ${autoReview ? '已审核' : '待审核'})`);
    }
  } catch (err) {
    console.error(`❌ [${language}] 网络请求失败:`, err.message);
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

  const args = process.argv.slice(2);
  const autoReview = args.includes('--auto-review');
  const nonFlagArgs = args.filter((a) => !a.startsWith('--'));

  let targets = ['ja', 'en'];
  if (nonFlagArgs.length > 0) {
    targets = nonFlagArgs.filter((l) => ['ja', 'en'].includes(l.toLowerCase())).map((l) => l.toLowerCase());
    if (targets.length === 0) {
      console.error(`❌ 错误: 不支持的语言参数 '${nonFlagArgs.join(', ')}'。可选值: ja, en`);
      process.exit(1);
    }
  }

  for (const lang of targets) {
    await uploadLanguage(apiUrl, apiKey, lang, autoReview);
  }
}

main();
