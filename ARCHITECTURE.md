## 文件职责

- `src/App.vue`：应用外壳，负责主题、全局弹窗、全局状态和 FishXIVItemReader 自动连接启动。
- `src/composables/useInventoryPlugin.ts`：管理 `window.wsApi` 监听、连接、断开、测试连接和插件消息入口。
- `src/types/inventory.ts`：声明 FishXIVItemReader 心跳、背包快照、连接状态和容器 ID 类型。
- `env.electron.d.ts`：声明 Electron 注入到 `window` 的 API 类型。
- `src/types/config/user.ts`：维护用户偏好设置结构、默认值和 WebSocket 密钥缓存编码。
- `src/store/index.ts`：集中保存用户、功能、云同步和主缓存配置。
- `src/components/modals/ModalPreferences.vue`：渲染偏好设置弹窗，并提供第三方数据开关、端口、密钥和测试连接入口。
- `src/components/custom/general/SettingItem.vue`：通用设置项渲染器，支持开关、文本、密码、数字、按钮等输入。

## 调用关系

- `App.vue` 调用 `useInventoryPluginAutoConnect()`。
- `useInventoryPluginAutoConnect()` 读取 Pinia 中的用户配置，并调用 `window.wsApi.connect()` 或 `window.wsApi.disconnect()`。
- Electron 主进程收到插件消息后通过 `window.wsApi.onMessage()` 进入 `useInventoryPlugin.ts`。
- `ModalPreferences.vue` 读取同一份连接状态，并通过 `testConnection()` 做临时连接测试。

## 关键决定

- WebSocket 连接放在 Electron 主进程中，前端不直接创建本地 WebSocket。
- 第三方数据默认关闭，用户保存有效端口和密钥后才会连接。
- 密钥在本地缓存中基础编码保存，避免直接裸存。
- 当前只记录背包快照，具体库存业务处理留在 `handleMessage()` 后续扩展。
