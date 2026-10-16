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
- [x] 主界面路由重构
  * 将原先的「工作流」转正为应用主界面
  * 增加一个模块让用户根据制作笔记选定制作配方
  * 这个模块在原工作流模块的左区放置，通过悬浮按钮/横向滑动进行切换
  * 允许用户选定「工作流」或「HQ工作台」为默认主页
  * 默认主页应当作为一个虚拟页面，动态加载用户设置决定显示什么单页组件
- [x] App 标题栏重制
  * 常驻显示默认主页切换图标
- [ ] 右侧区域重制
  * 右侧空间也要利用起来，放些切换主题、GitHub的按钮
  * 要先研究一下electron升级之后能否支持更加灵活的拖拽区设置
- [x] 增加引导弹窗

**杂项**
- [x] 引入 tailwind
- [x] 升级 electron

## 搜索记录

### 采集时钟增加 Bark 推送提醒
- **需求**：采集时钟提醒方式增加 Bark，并提供“Bark推送地址”配置项。
- **技术调研**：
  - 参考来源：[Finb/Bark](https://github.com/Finb/Bark)、[Finb/bark-server](https://github.com/Finb/bark-server)、[Bark 官方文档与 API V2](https://bark.day.app/#/)
  - Bark 支持 HTTP GET 与 POST 请求，其中 REST API V2 支持发送 JSON 负载（包含 `title`、`body`、`icon`、`group` 等）。
  - Bark 官方服务器（`https://api.day.app`）原生支持 CORS 跨域请求（`access-control-allow-origin: *`），可在 Web 前端、Electron 和移动端直接发起 `fetch`。
  - 用户配置格式兼容完整 URL（如 `https://api.day.app/{device_key}/`、自建服务器地址）以及纯 `device_key` 格式。

