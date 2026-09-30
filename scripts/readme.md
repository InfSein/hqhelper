# Scripts

此文件夹存放自动化构建脚本。

这些脚本大多会在调试与构建过程中被自动地调用，不会参与到前端项目本身。

## 脚本列表

### i18n相关

现在通过HqHelper内部api进行i18n同步工作。

需要先配置环境变量：
```env
# HqHelper API 服务地址（末尾无需斜杠）
HQHELPER_API_URL=xxx

# 从 HqHelper 后台「系统 -> API 密钥」中生成的 64 位密钥
HQHELPER_API_KEY=your_64_character_api_key_here
```

#### ① 上传源语言 (`upload-source.cjs`)
- **作用**：读取 `src/locales/zh.json`，展平后增量同步至数据库。若有词条源文本变更，系统会自动降级对应已完成翻译至待审核（`review`）状态，并自动保留最近 5 次上传快照历史。
- **运行命令**：
  ```bash
  npm run i18n:upload-source
  ```

#### ② 上传目标语言翻译 (`upload-translation.cjs`)
- **作用**：读取 `src/locales/ja.json` 或 `en.json` 并批量导入译文，默认以待审核（`review`）状态入库。若需直接标记为已审核可追加 `--auto-review` 参数。
- **运行命令**：
  ```bash
  npm run i18n:upload-translation     # 同时上传 ja 与 en
  npm run i18n:upload-ja              # 仅上传 ja
  npm run i18n:upload-en              # 仅上传 en
  node scripts/upload-translation.cjs ja --auto-review # 上传并标记为已审核
  ```

#### ③ 下载目标语言翻译 (`download-translation.cjs`)
- **作用**：从 API 拉取指定语言已翻译并反展平的 JSON 字典，写入 `src/locales/ja.json` 或 `en.json`。未翻译的词条在导出的 JSON 中不包含该 key。
- **运行命令**：
  ```bash
  npm run i18n:download-translation   # 同时下载 ja 与 en
  npm run i18n:download-ja            # 仅下载 ja
  npm run i18n:download-en            # 仅下载 en
  ```


### update-version.cjs

此脚本用于在本地 `npm i` 时自动更新 `public/version.json` 文件中的 `hqhelper` 版本，以便客户端判别是否需要更新。

要启用此脚本，则需确保 `package.json` 中配置了 `postinstall`，配置内容应包括 `node scripts/update-version.cjs`。

部分分支可能不会执行此脚本。
