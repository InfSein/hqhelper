# PLAN

**重构**
- [ ] `scripts` 中的文件应进行整理和精简
- [x] `src\assets` 结构调整
- [x] `src\components` 结构调整
- [x] `src\composables` 与 `src\tools` 总体性梳理
- [x] `src\data` 进行迁移/移除
- [x] `src\models` 进行拆分迁移，丢进types
- [x] `src\store` 进行代码重构。
- [x] 审查各个vue文件的inject，权衡是否真的需要它们。
- [x] `src\variables` 进行迁移/移除
- [x] 使用 `feature` 模式重新设计项目结构
- [x] `src\components\main\GearSelectionPanel.vue` 里面的逻辑写的太他妈啥比了，有空了就重写

**功能**
- [ ] 解包调整
  * 输出所有制作笔记收录的配方及关联物品
  * 数据大小将可能变得过大，需要思考解决方案
- [ ] 主界面路由重构
  * 将原先的「工作流」转正为应用主界面
  * 增加一个模块让用户根据制作笔记选定制作配方
  * 这个模块在原工作流模块的左区放置，通过悬浮按钮/横向滑动进行切换
  * 允许用户选定「工作流」或「HQ工作台」为默认主页
  * 默认主页应当作为一个虚拟页面，动态加载用户设置决定显示什么单页组件
- [ ] App 标题栏重制
  * 常驻显示默认主页切换图标
  * 右侧空间也要利用起来，放些切换主题、GitHub的按钮
  * 要先研究一下electron升级之后能否支持更加灵活的拖拽区设置
- [ ] 增加引导弹窗

**杂项**
- [x] 引入 tailwind
- [x] 升级 electron

## 项目说明

HqHelper Dawntrail 是一个用于辅助最终幻想 XIV 制作、采集、价格查看和工作流管理的前端应用。

### 技术架构

- 使用 Vue 3、TypeScript、Vite、Pinia 和 Naive UI 构建页面。
- Electron 客户端通过预加载脚本向页面暴露安全 API。
- FishXIVItemReader 背包数据由 Electron 主进程接收，再通过 `window.wsApi` 转交给 Vue 前端。

### 本地运行

```bash
npm i
npm run dev
```

### 部署与构建

```bash
npm run build
```

Electron 客户端打包在 `hqhelper-client` 项目中执行。

### 测试方法

```bash
npm run type-check
```

### 搜索记录

- 2026-07-02：查看了 [skills.sh](https://www.skills.sh/)，未发现比当前 Vue、Pinia、前端设计技能更贴合本次 WebSocket 接入的专用技能。
- 2026-07-02：查看了 [Electron IPC 文档](https://www.electronjs.org/docs/latest/tutorial/ipc)，采用主进程维护连接、`contextBridge` 暴露有限 API、`webContents.send` 推送消息的方式。
- 2026-07-02：GitHub 搜索发现 `native-websocket-vue3` 等前端 WebSocket 封装，但本项目需要 Electron 主进程持有本地连接，因此未引入新依赖。

### 已完成功能

- 制作、采集、工作流和价格相关功能。
- 偏好设置、主题、语言、更新和导入导出功能。
- FishXIVItemReader WebSocket 背包数据接入框架。

### 待办事项

- 将收到的背包快照接入具体库存业务逻辑。
