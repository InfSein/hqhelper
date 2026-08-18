/**
 * HQHelper 外部项目脚本：下载已翻译语言字典 (ja.json / en.json)
 *
 * 用法:
 *   node scripts/download-translation.cjs       # 下载所有语言 (ja, en)
 *   node scripts/download-translation.cjs ja    # 仅下载日语
 *   node scripts/download-translation.cjs en    # 仅下载英语
 *
 * 说明:
 *   - 读取项目根目录 .env.local 中的 HQHELPER_API_URL 与 HQHELPER_API_KEY
 *   - 从 HQHelper API 拉取最新已翻译字典并写入 src/locales/{language}.json
 *   - 仅包含已有翻译的词条，未翻译的词条不包含在结果中
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

async function downloadLanguage(apiUrl, apiKey, language) {
  console.log(`📥 正在下载 [${language}] 翻译字典 ...`);

  try {
    const response = await fetch(`${apiUrl}/api/external/translation/entries?language=${language}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`❌ [${language}] 下载失败 (${response.status}):`, data.error || data);
      return;
    }

    const outputDir = path.resolve(process.cwd(), 'src/locales');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, `${language}.json`);
    fs.writeFileSync(outputPath, data.jsonContent, 'utf-8');

    console.log(`✅ [${language}] 下载完成并写入 ${outputPath} (共 ${data.count} 条已翻译词条)`);
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
  let targets = ['ja', 'en'];

  if (args.length > 0) {
    targets = args.filter((l) => ['ja', 'en'].includes(l.toLowerCase())).map((l) => l.toLowerCase());
    if (targets.length === 0) {
      console.error(`❌ 错误: 不支持的语言参数 '${args.join(', ')}'。可选值: ja, en`);
      process.exit(1);
    }
  }

  for (const lang of targets) {
    await downloadLanguage(apiUrl, apiKey, lang);
  }
}

main();
