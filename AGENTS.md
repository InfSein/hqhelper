# HqHelper — AI Agent 编码指南

> **面向 AI 编程 Agent 的项目参考手册。**
> 当你对本项目进行任何修改时，请先通读此文件，遵循其中的约定。

---

## 1. 项目概述

**HqHelper** 是面向《最终幻想XIV》(FFXIV) 生产/采集玩家的秘籍配方制作计算器。
- 仓库：`InfSein/hqhelper`
- 运行平台：Web (SPA)、Electron 桌面端、Android (WebView)
- 支持语言：简体中文 (zh)、英文 (en)、日文 (ja)

---

## 2. 技术栈

| 层面 | 技术 | 版本/说明 |
|------|------|-----------|
| **框架** | Vue 3 | Composition API (`<script setup lang="ts">`) |
| **语言** | TypeScript | ~5.8，strict 模式 |
| **构建** | Vite 7 | `@vitejs/plugin-vue`，Vite 插件体系 |
| **路由** | Vue Router 4 | Hash 模式 (`createWebHashHistory`) |
| **状态管理** | Pinia 3 | Options API 风格定义 Store |
| **UI 库** | Naive UI | 通过 `unplugin-vue-components` 自动按需引入 |
| **CSS** | Tailwind CSS 4 + 原生 CSS | Tailwind 用于 utility classes；全局样式用原生 CSS |
| **国际化** | vue-i18n 11 | Composition API 模式，`legacy: false` |
| **HTTP** | Alova 3 | API 请求库 |
| **本地存储** | localStorage + IndexedDB (idb) | 配置/缓存存 localStorage；大文件存 IDB |
| **图标** | @vicons/material | Material Design Icons |
| **图表** | vue-data-ui | 数据可视化 |
| **Lint** | ESLint 9 + eslint-plugin-vue | Flat config (`eslint.config.ts`) |
| **其他** | clsx + tailwind-merge (`cn()`)、vue-clipboard3、lz-string、xlsx |

### 关键 Vite 插件

- `unplugin-auto-import` — 自动导入 Vue/Vue Router/Pinia/Naive UI 的 API，**无需手动 import**
- `unplugin-vue-components` — 自动注册 `src/components/templates/` 和 `src/components/ui/` 下的组件
- `vite-svg-loader` — 以 Vue 组件方式导入 SVG
- `@tailwindcss/vite` — Tailwind CSS 4 的 Vite 集成

---

## 3. 项目结构

```
hqhelper/
├── index.html              # SPA 入口 (含加载页和错误处理)
├── vite.config.ts           # Vite 配置
├── eslint.config.ts         # ESLint 配置
├── tsconfig.app.json        # TypeScript 配置
├── package.json             # 依赖与脚本
├── public/                  # 静态资源 (图标、音频、manifest.json 等)
├── scripts/                 # 构建/部署脚本 (Node.js CJS)
├── src/
│   ├── main.ts              # Vue 应用入口
│   ├── App.vue              # 根组件 (主题/国际化/布局)
│   ├── assets/
│   │   ├── main.css          # 全局样式入口
│   │   ├── styles/           # 拆分的样式文件
│   │   │   ├── tailwind.css  # Tailwind 导入 + 自定义 @theme
│   │   │   ├── base.css      # CSS Reset 与字体
│   │   │   ├── custom.css    # Naive UI 组件覆写
│   │   │   ├── shared.css    # 跨组件共享样式 (glasscard 等)
│   │   │   ├── font.css      # 字体声明
│   │   │   └── scrollbar.css # 滚动条样式
│   │   ├── data/             # 游戏数据 JSON (装备/职业/配方等)
│   │   ├── font/             # 字体文件 (Lato, FFXIV)
│   │   └── icons/            # SVG 图标
│   ├── components/
│   │   ├── templates/        # 模板级可复用组件 (自动注册)
│   │   │   ├── FoldableCard.vue   # 可折叠卡片
│   │   │   ├── MyModal.vue        # 通用弹窗模板
│   │   │   ├── GroupBox.vue       # 分组框
│   │   │   ├── CompactForm.vue    # 紧凑表单
│   │   │   └── CompactFormItem.vue
│   │   ├── ui/               # UI 级原子组件 (自动注册)
│   │   │   ├── TooltipButton.vue
│   │   │   ├── SettingItem.vue
│   │   │   ├── HelpButton.vue
│   │   │   ├── Stepper.vue
│   │   │   └── ...
│   │   ├── app/              # 应用级全局组件
│   │   │   ├── AppHeader.vue
│   │   │   ├── Dialog.vue
│   │   │   └── ...
│   │   ├── item/             # 物品相关组件
│   │   ├── craft/            # 制作相关组件
│   │   ├── job/              # 职业相关组件
│   │   ├── chart/            # 图表组件
│   │   ├── map/              # 地图组件
│   │   └── modals/           # 全局弹窗 (ModalXxx.vue)
│   ├── views/                # 路由页面 (每个子目录一个页面)
│   │   ├── main/             # 首页 (HQ工作台)
│   │   ├── workflow/         # 工作流页面
│   │   ├── workflow-process/ # 工作流进程
│   │   ├── food-and-tinc/    # 食药计算
│   │   ├── gatherclock/      # 采集时钟
│   │   ├── collectable-submissions/ # 工票计算
│   │   ├── fashion-clothes/  # 时装计算
│   │   ├── macro-manage/     # 生产宏管理
│   │   ├── download/
│   │   └── error/            # 错误页 (404)
│   ├── composables/          # 组合式函数 (useXxx.ts)
│   ├── store/                # Pinia Store
│   ├── router/               # Vue Router 配置
│   ├── locales/              # i18n 翻译文件 (zh/en/ja.json)
│   ├── types/                # TypeScript 类型定义
│   │   ├── config/           # 配置模型 (user/func/cloud/cache)
│   │   ├── game/             # 游戏数据类型
│   │   ├── item/             # 物品类型
│   │   ├── api/              # API 相关类型
│   │   └── workstate/        # 工作状态类型
│   ├── tools/                # 业务工具函数
│   ├── utils/                # 通用工具函数
│   ├── constants/            # 常量
│   └── data/                 # 运行时数据 (更新日志等)
├── env.d.ts                  # Vite 环境类型声明
├── env.electron.d.ts         # Electron API 类型声明
└── env.android.d.ts          # Android API 类型声明
```

### 关键目录说明

| 目录 | 用途 | 注意 |
|------|------|------|
| `components/templates/` | 高阶可复用模板组件 | 已通过 `unplugin-vue-components` 自动注册，无需手动 import |
| `components/ui/` | 原子级 UI 组件 | 已通过 `unplugin-vue-components` 自动注册 |
| `components/modals/` | 全局弹窗组件 | 命名 `ModalXxx.vue`，基于 `MyModal` 模板 |
| `composables/` | 组合式函数 | 命名 `useXxx.ts`，封装可复用逻辑 |
| `tools/` | 业务逻辑 | 与游戏/应用业务强相关的工具函数 |
| `utils/` | 通用工具 | 与业务无关的通用工具 (Tailwind 合并、IDB、API 等) |
| `types/config/` | 配置类型 | 每个配置类型都有对应的 `fixXxxConfig()` 函数进行迁移/修复 |

---

## 4. 代码规范与约定

### 4.1 Vue 组件

- **始终使用 `<script setup lang="ts">`** — 不使用 Options API
- **组件文件结构**：`<script setup>` → `<template>` → `<style scoped>`
- **Props 定义**：优先使用 TypeScript interface + `defineProps<T>()`
- **事件定义**：使用 `defineEmits(['eventName'])`
- **Model 绑定**：使用 `defineModel<T>('name', { required: true })`
- **命名约定**：
  - 模板/UI 组件：PascalCase (`FoldableCard.vue`)
  - 弹窗组件：`ModalXxx.vue`
  - 页面组件：`XxxPage.vue`
  - 页面子组件放在同级 `components/` 目录下
- **自动导入**：Vue/VueRouter/Pinia 的 API (ref, computed, watch 等) 无需手动 import

### 4.2 TypeScript

- 类型文件集中在 `src/types/` 下按领域组织
- 每个配置模型 (user/func/cloud/cache) 都有对应的 `fixXxxConfig()` 函数，用于版本迁移和默认值修复
- 允许使用 `any` 类型 (ESLint 规则已关闭)，但应尽量避免
- 使用 `import type` 导入纯类型
- 字符串在作为类型时使用双引号，作为变量时使用单引号，例如 `const str : "str1" | "str2" = 'str1'`
- 不使用分号，除非一行多个。例如：
  ```
  let a
  let b; let c
  window.alert()
  ```
- 数组和object定义末行加逗号，但是单行定义除外。例如：
  ```
  {
    single: false,
    data: '',
  }
  { single: true }
  [
    '1',
    '2',
  ]
  ['1', '2']
  ```

### 4.3 样式

- **Tailwind CSS 4** 用于快速 utility class 编写（如 `flex`, `mt-2`, `text-sm`, `shrink-0` 等）
- **主题色彩类名**：使用映射好的 Tailwind 语义类名（`text-text`, `text-sub`, `text-primary`, `bg-bg-hover`, `border-border` 等），**严禁**使用 `text-[var(--app-color-*)]` 或 `hover:bg-[var(--app-color-*)]` 等任意值类名
- **Tailwind 4 类名规范**：使用 `shrink-0`（而非 `flex-shrink-0`）、`grow`（而非 `flex-grow`）
- **自定义 CSS 变量** 用于颜色主题 — 通过 `--app-color-*` 定义，映射到 Tailwind 的 `@theme`
- **Scoped Style** 优先 — 组件样式尽量 `<style scoped>`
- **全局样式覆写** Naive UI 组件放在 `custom.css`
- **共享样式** 放在 `shared.css`（如 `.glasscard`, `.app-card-title` 等）
- **不启用 Tailwind Preflight** — 使用自定义 base.css 替代
- **`cn()` 工具函数**：用于条件合并 Tailwind 类名（`clsx` + `tailwind-merge`）

### 4.4 国际化 (i18n)

- **所有用户可见文本必须使用 i18n**：`t('key')` 或 `t('key', { arg: value })`
- 通过 `useLocale()` composable 获取 `t` 函数（**不是** 直接使用 `useI18n()`）
- 翻译文件位于 `src/locales/`（zh.json, en.json, ja.json）
- 默认/回退语言：中文 (zh)
- 代码注释可以使用中文

### 4.5 主题系统

- 通过 CSS 变量实现亮/暗主题切换：`.theme-light` / `.theme-dark`
- 使用 `useConfig()` composable 获取当前主题
- 支持跟随系统主题 (`system`)
- Naive UI 主题通过 `n-config-provider` 传递
- **毛玻璃效果 (Glasscard)**：当用户设置自定义背景时激活，使用 `.glasscard` 类

### 4.6 响应式

- 通过 `useResponsive()` composable 获取 `isMobile`
- 移动端判定：`window.innerWidth < window.innerHeight`
- 使用 Naive UI 的 `n-grid` 配合 `item-responsive` 实现响应式布局
- 使用 `span="4 600:2 1340:1"` 格式定义断点响应

### 4.7 多平台兼容

- Web / Electron / Android 通过全局 API 对象区分：
  - `window.electronAPI` — Electron 环境
  - `window.androidAPI` — Android 环境
- 环境类型声明在 `env.electron.d.ts` 和 `env.android.d.ts`
- 使用 `useAppMode()` 获取应用模式 (normal/overlay)
- CSS class 区分：`.env-electron`, `.env-web`, `.env-overlay`

---

## 5. 组件使用约定

### 5.1 弹窗 (Modal)

```vue
<!-- 所有弹窗都继承 MyModal 模板 -->
<MyModal
  v-model:show="showModal"
  :icon="SomeIcon"
  :title="t('modal.title')"
  max-width="800px"
>
  <!-- 内容 -->
</MyModal>
```

### 5.2 可折叠卡片

```vue
<FoldableCard card-key="unique-key" :title="t('card.title')">
  <!-- 内容 -->
</FoldableCard>
```

### 5.3 路由页面

```vue
<!-- 路由页面必须包含 id="main-container" 的根元素 -->
<template>
  <div id="main-container">
    <RouterCard :page-name="t('page.name')" :page-icon="Icon" />
    <!-- 页面内容 -->
  </div>
</template>
```

### 5.4 Naive UI 组件

由于 `unplugin-vue-components` 已配置 `NaiveUiResolver`，所有 Naive UI 组件（`n-button`, `n-card` 等）无需手动 import，直接在模板中使用。

### 5.5 全局弹窗消息

```ts
const NAIVE_UI_MESSAGE = useMessage() // 通过 auto-import 自动注册
NAIVE_UI_MESSAGE.success(t('message.xxx'))
NAIVE_UI_MESSAGE.error(t('message.yyy'))
```

---

## 6. 构建与运行

```bash
# 安装依赖
npm install

# 开发服务器 (端口 5173)
npm run dev

# 类型检查
npm run type-check

# 构建生产版本
npm run build

# ESLint 检查与修复
npm run lint
```

---

## 7. 路由说明

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | MainPage | HQ 工作台 (首页) |
| `/fthelper` | FoodAndTincPage | 食药计算 |
| `/cshelper` | CollectableSubmissionsPage | 收藏品提交 |
| `/fchelper` | FashionClothesPage | 时装搭配 |
| `/gatherclock` | GatherClockPage | 采集时钟 |
| `/workflow` | WorkflowPage | 工作流管理 |
| `/workflow_process` | WorkflowProcessPage | 工作流进程 |
| `/download` | DownloadPage | 下载页 |
| `/macromanage` | MacroManagePage | 宏管理 |
| `*` | ErrorPage404 | 404 错误页 |

---

## 8. 数据流与状态管理

### Pinia Store

- 唯一全局 Store：`useStore()`（位于 `src/store/index.ts`）
- 管理四类持久化配置：
  - `userConfig` — 用户偏好设置（主题、语言、缓存等）
  - `funcConfig` — 功能设置（各功能页的具体参数）
  - `cloudConfig` — 云同步配置
  - `mainCache` — 主缓存
- 每种配置都有 `set/reload/update` 三个 action
- 存储到 localStorage，通过 `fixXxxConfig()` 函数保证向后兼容

### 跨组件通信

- `provide/inject` 用于父→子深层传递（如 `appForceUpdate`）
- 全局弹窗通过 `useAppModals()` composable 控制

---

## 9. 编码注意事项

### 必须遵守

1. **前端修改必须参考 `DESIGN.md`** — 所有涉及 UI/样式/组件的修改，必须先阅读项目根目录下的 `DESIGN.md`，确保与现有设计语言保持一致。
2. **所有可见文本使用 i18n** — 不要硬编码中文/英文/日文字符串到模板中。
3. **使用项目已有的组件和模式** — 优先复用 `templates/` 和 `ui/` 下的组件，不要重新造轮子。
4. **路由页面必须包含 `id="main-container"`** — 否则 AppHeader 的抽屉功能会失效。
5. **主题兼容** — 确保新增的 UI 元素在亮色和暗色主题下都正常显示。
6. **响应式** — 确保修改在桌面和移动端都可用。

### 最佳实践

- 新增 composable 时遵循 `useXxx.ts` 命名规范
- 新增弹窗使用 `MyModal` 模板包裹，命名为 `ModalXxx.vue`
- 新增页面同步更新 `src/router/index.ts`
- 新增类型定义放在 `src/types/` 下对应子目录
- 配置项新增字段需同步更新 `fixXxxConfig()` 函数
- 代码注释用中文或英文均可
- 不要直接修改 `auto-imports.d.ts` 和 `components.d.ts`（它们由插件自动生成）

### 避免

- ❌ 不要使用 Vue Options API
- ❌ 不要直接使用 `useI18n()`，使用 `useLocale()` 代替
- ❌ 不要修改 Tailwind preflight（项目已禁用）
- ❌ 不要使用 `text-[var(--app-color-*)]`、`hover:bg-[var(--app-color-*)]` 等任意值类名，必须使用 Tailwind 主题映射语义类名（如 `text-text`, `hover:bg-bg-hover`）
- ❌ 不要使用旧版 Tailwind 类名如 `flex-shrink-0`（改用 `shrink-0`）
- ❌ 不要在 `templates/` 和 `ui/` 组件中手动 import 已自动注册的组件
- ❌ 不要引入新的 UI 库替代 Naive UI

---

## 10. 文档同步要求

> [!IMPORTANT]
> 当你对项目进行修改时，**必须同步更新相关文档**，包括但不限于：

1. **`AGENTS.md`（本文件）**
   - 新增路由页面 → 更新「路由说明」表格
   - 新增/删除顶层目录或调整目录结构 → 更新「项目结构」
   - 引入/移除依赖 → 更新「技术栈」表格
   - 新增编码约定 → 更新对应章节

2. **`DESIGN.md`**
   - 新增/修改颜色变量 → 更新色彩系统章节
   - 新增/修改模板组件 → 更新组件规范章节
   - 新增共享样式类 → 更新样式规范
   - 调整主题变量 → 更新主题系统章节

3. **i18n 翻译文件**
   - 新增可见文本 → 同步更新 zh.json / en.json / ja.json

---

## 11. 变更检查清单

在提交修改前，确认以下事项：

- [ ] 代码通过 TypeScript 类型检查 (`npm run type-check`)
- [ ] 代码通过 ESLint 检查 (`npm run lint`)
- [ ] 新增文本已添加 i18n 翻译（至少 zh）
- [ ] 亮色/暗色主题均正常显示
- [ ] 桌面/移动端视觉未出现异常
- [ ] 已参考 `DESIGN.md` 保持风格一致
- [ ] 已同步更新 `AGENTS.md` / `DESIGN.md`（如涉及相关变更）
