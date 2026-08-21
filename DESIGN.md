# HqHelper — 前端设计语言规范

> **面向 AI 编程 Agent 的设计参考文档。**
> 当你对本项目进行任何 UI / 样式 / 组件修改时，请先通读此文件，确保与现有设计语言保持一致。

---

## 1. 设计哲学

HqHelper 的视觉设计遵循以下核心原则：

- **功能优先**：作为工具类应用，信息密度高，交互效率是第一优先级
- **克制简洁**：视觉干净、留白适度，不使用过度装饰
- **主题自适应**：所有组件必须同时支持亮色和暗色主题
- **毛玻璃增强**：当用户启用自定义背景时，通过 glasscard 效果提升层次感
- **跨端一致**：桌面与移动端保持视觉一致性，通过响应式调整布局

---

## 2. 色彩系统

### 2.1 语义色彩变量

所有颜色通过 CSS 变量定义，**禁止在组件中硬编码颜色值**。

#### 亮色主题 (`.theme-light`)

| 变量 | 值 | 用途 |
|------|-----|------|
| `--app-color-text` | `rgb(51, 54, 57)` | 主文字颜色 |
| `--app-color-text-sub` | `rgb(118, 124, 130)` | 次要/辅助文字 |
| `--app-color-primary` | `#18a058` | 主色 (绿色) |
| `--app-color-info` | `#2080f0` | 信息色 (蓝色) |
| `--app-color-warning` | `#f0a020` | 警告色 (橙色) |
| `--app-color-error` | `#d03050` | 错误色 (红色) |
| `--app-color-border` | `rgb(239, 239, 245)` | 边框颜色 |
| `--app-color-background` | `#fff` | 主背景 |
| `--app-color-base` | `#fff` | 基底色 |
| `--app-color-background-embedded` | `rgb(250, 250, 252)` | 嵌入式组件背景 |
| `--app-color-background-modal` | `#fff` | 弹窗背景 |
| `--app-color-background-action` | `rgb(250, 250, 252)` | 操作栏背景 |
| `--app-color-background-popover` | `#fff` | 弹出层背景 |
| `--app-color-background-hover` | `#F4F5F5` | 悬浮状态背景 |

#### 暗色主题 (`.theme-dark`)

| 变量 | 值 | 用途 |
|------|-----|------|
| `--app-color-text` | `rgba(255, 255, 255, 0.82)` | 主文字颜色 |
| `--app-color-text-sub` | `rgba(255, 255, 255, 0.52)` | 次要/辅助文字 |
| `--app-color-primary` | `#63e2b7` | 主色 (亮绿) |
| `--app-color-info` | `#70c0e8` | 信息色 (亮蓝) |
| `--app-color-warning` | `#f2c97d` | 警告色 (柔橙) |
| `--app-color-error` | `#e88080` | 错误色 (柔红) |
| `--app-color-border` | `rgba(255, 255, 255, 0.09)` | 边框颜色 |
| `--app-color-background` | `rgb(16, 16, 20)` | 主背景 |
| `--app-color-base` | `#000` | 基底色 |
| `--app-color-background-embedded` | `rgb(24, 24, 28)` | 嵌入式组件背景 |
| `--app-color-background-modal` | `rgb(44, 44, 50)` | 弹窗背景 |
| `--app-color-background-action` | `rgb(56, 56, 62)` | 操作栏背景 |
| `--app-color-background-popover` | `rgb(72, 72, 78)` | 弹出层背景 |
| `--app-color-background-hover` | `#2A2A2E` | 悬浮状态背景 |

### 2.2 Tailwind 主题映射

CSS 变量已通过 `src/assets/styles/tailwind.css` 的 `@theme` 映射到 Tailwind 类名：

| Tailwind class | 对应变量 | 用法示例 |
|----------------|----------|----------|
| `text-text` | `--app-color-text` | 主要文字 |
| `text-sub` | `--app-color-text-sub` | 辅助文字 |
| `text-primary` | `--app-color-primary` | 强调文字 |
| `text-info` | `--app-color-info` | 信息提示 |
| `text-warning` | `--app-color-warning` | 警告文字 |
| `text-error` | `--app-color-error` | 错误文字 |
| `bg-bg` | `--app-color-background` | 主背景 |
| `bg-bg-embedded` | `--app-color-background-embedded` | 嵌入背景 |
| `bg-bg-modal` | `--app-color-background-modal` | 弹窗背景 |
| `bg-bg-action` | `--app-color-background-action` | 操作栏 |
| `bg-bg-popover` | `--app-color-background-popover` | 弹出层 |
| `bg-bg-hover` | `--app-color-background-hover` | 悬浮态 |
| `bg-base` | `--app-color-base` | 基底色 |
| `border-border` | `--app-color-border` | 边框 |

### 2.3 用色与 Tailwind 规范

- ✅ 优先使用 Tailwind 语义映射类名（如 `text-text`, `text-sub`, `text-primary`, `bg-bg`, `bg-bg-hover`, `border-border` 等）
- ✅ 在原生 CSS / style 属性中使用 CSS 变量 (`var(--app-color-*)`) 或 Naive UI 内置变量 (`var(--n-*)`)
- ❌ **严禁在 class 中使用 `text-[var(--app-color-*)]` 或 `bg-[var(--app-color-*)]`**，必须使用上方表格中已映射的 Tailwind 语义类名（如 `text-text`, `hover:bg-bg-hover`, `border-border`）
- ❌ **不要硬编码颜色值**（如 `color: #333`）— 除非是一次性装饰元素且不涉及主题
- ❌ 不要使用 `rgb(51,54,57)` 等原始值，而是使用对应的语义变量
- 💡 **Tailwind 4 类名规范**：使用 `shrink-0`（而非 `flex-shrink-0`）、`grow`（而非 `flex-grow`）

---

## 3. 字体系统

### 3.1 字体栈

```css
font-family: FFXIV, Lato, -apple-system, Helvetica Neue, Segoe UI,
             Microsoft Yahei, 微软雅黑, Arial, Helvetica, sans-serif;
```

| 字体 | 用途 |
|------|------|
| `FFXIV` | FFXIV 游戏特殊符号字体 (U+E020–U+E0DB) |
| `Lato` | 主要拉丁字体 (本地加载，非 Google Fonts CDN) |
| 系统字体栈 | 回退字体 |

### 3.2 字号

- 基础字号：`15px`（在 `base.css` 中设定）
- 用户可自定义字号（通过 `store.userConfig.custom_font_size`）
- Naive UI 的字号通过 `themeOverrides` 统一设置
- 文字大小的微调使用 Naive UI 变量 `calc(var(--n-font-size) ± Npx)` 或 Tailwind (`text-sm`, `text-xs` 等)
- 项目自定义的字号辅助类：
  - `.font-small` → `calc(var(--n-font-size) - 2px)`
  - `.font-big` → `calc(var(--n-font-size) + 2px)`

### 3.3 文字样式约定

- 标题使用 `font-bold`（`font-weight: bold`）
- 辅助文字使用 `text-sub` 类
- 不可选文字（如标题标签）添加 `select-none` / `user-select: none`
- 行高：全局 `1.6`

---

## 4. 布局系统

### 4.1 页面布局

应用使用 Naive UI 的 `n-layout` 进行整体布局：

```
┌─────────────────────────────────────────────┐
│  AppHeader (n-layout-header, 高度 69px)      │
├─────────────────────────────────────────────┤
│                                             │
│  Router View (n-layout, 从 top:70px 开始)    │
│  └─ #main-container (padding: 1rem)         │
│                                             │
└─────────────────────────────────────────────┘
```

### 4.2 栅格布局

使用 Naive UI 的 `n-grid` 配合响应式断点：

```vue
<n-grid cols="4" item-responsive :x-gap="10" :y-gap="10">
  <!-- 全宽 -->
  <n-grid-item span="4">...</n-grid-item>
  <!-- 移动端全宽，平板半宽，桌面四分之一 -->
  <n-grid-item span="4 600:2 1340:1">...</n-grid-item>
  <!-- 移动端全宽，桌面半宽 -->
  <n-grid-item span="4 1340:2">...</n-grid-item>
</n-grid>
```

**断点参考**：
| 断点 | 像素 | 场景 |
|------|------|------|
| 默认 | — | 移动端 (竖屏) |
| `600` | 600px | 平板/横屏手机 |
| `1340` | 1340px | 桌面端 |

### 4.3 间距规范

| 场景 | 间距 |
|------|------|
| 栅格间距 (x-gap / y-gap) | `10px` |
| 页面内边距 (#main-container) | `1rem` (16px) |
| 卡片内边距 | Naive UI 默认 (size="medium") |
| 元素间小间距 | `4px` ~ `8px` (Tailwind: `gap-1` ~ `gap-2`) |
| 表单/设置项间距 | `mt-1.5` (6px) |

---

## 5. 组件设计规范

### 5.1 卡片 (Card)

卡片是信息分组的基本容器，使用 Naive UI 的 `n-card`。

**标准样式**：
- 使用 `embedded` 属性（背景为嵌入色）
- 默认 `bordered={false}`
- 当用户设置自定义背景时，自动添加 `.glasscard` 类

**可折叠卡片** (`FoldableCard`)：
```vue
<FoldableCard card-key="unique-key" :title="t('card.title')">
  <!-- 卡片内容 -->
</FoldableCard>
```
- 折叠状态缓存到 `userConfig.cache_ui_fold`
- 支持 `extraHeaderButtons` 在标题栏右侧添加操作按钮

**卡片标题规范**：
- 使用 `.app-card-title` 类包裹标题区域
- 标题文字使用 `.title` 类
- 描述文字使用 `.description` 类
- 额外操作区使用 `.app-card-title__actions` 类
- 标题栏右侧的操作区使用 `.app-extra-header` + `.square-action` 模式

### 5.2 弹窗 (Modal)

所有弹窗基于 `MyModal` 模板：

```vue
<MyModal
  v-model:show="showModal"
  :icon="IconComponent"
  :title="t('modal.title')"
  max-width="600px"
>
  <!-- 弹窗内容 -->
  <template #action>
    <div class="app-modal-footer">
      <n-button @click="showModal = false">{{ t('common.cancel') }}</n-button>
      <n-button type="primary" @click="handleConfirm">{{ t('common.confirm') }}</n-button>
    </div>
  </template>
</MyModal>
```

**弹窗设计约定**：
- 默认最大宽度 `600px`，可通过 `max-width` 调整
- 弹窗可拖拽 (`draggable`)
- 宽度设为 `98%`（移动端适配）
- 底部操作栏使用 `.app-modal-footer`（`flex`, `justify-end`, `gap: 8px`）
- 功能弹窗可通过 `showSetting` prop 显示设置入口

### 5.3 分组框 (GroupBox)

用于对表单或信息区域进行分组：

```vue
<GroupBox :title="t('group.title')" :descriptions="['help text']">
  <!-- 分组内容 -->
</GroupBox>
```

- 使用 `<fieldset>` + `<legend>` 原生语义
- 虚线边框 (`border: 1px dashed`)
- 圆角遵循 Naive UI 变量 (`var(--n-border-radius)`)

### 5.4 按钮 (Button)

**标准按钮**：直接使用 Naive UI 的 `n-button`

**带 Tooltip 的按钮** (`TooltipButton`)：
```vue
<TooltipButton
  :icon="SomeIcon"
  :tip="t('button.tooltip')"
  quaternary
  size="small"
  @click="handleClick"
/>
```

**正方形按钮**：使用 `.n-square-button` 类（`width: var(--n-height); padding: 0;`）

**无边框按钮**：使用 `.no-border` 类

**标题栏操作按钮** (`.square-action`)：
- 默认显示图标 (22×22px)
- 悬浮时展开显示文字（平滑动画）
- 使用 `.unshow-text` 类控制文字的显隐过渡

### 5.5 表单与设置 (Form / Settings)

**紧凑表单** (`CompactForm` + `CompactFormItem`)：用于信息密集的表单

**设置项** (`SettingItem`)：用于偏好设置页面
- 标签支持帮助按钮 (`HelpButton`)
- 描述文字可折叠
- 支持多种输入类型：switch、radio-group、select、cascader、string、button、image-select

### 5.6 帮助按钮 (HelpButton)

使用 `HelpButton` 组件显示帮助信息：

```vue
<HelpButton icon="info" :size="18" :descriptions="['说明文字']" />
```

---

## 6. 毛玻璃效果 (Glasscard)

当用户设置了自定义背景图片时，卡片和面板会激活毛玻璃效果。

### 6.1 CSS 变量

| 变量 | 亮色值 | 暗色值 |
|------|--------|--------|
| `--glasscard-blur` | `4px` | `4px` |
| `--glasscard-saturate` | `120%` | `150%` |
| `--glasscard-bg` | `rgba(255,255,255,0.4)` | `rgba(16,16,20,0.6)` |
| `--glasscard-bg-small` | `rgba(255,255,255,0.36)` | `transparent` |
| `--glasscard-shadow` | `0 4px 8px rgba(8,10,20,0.45)` | `0 4px 8px rgba(0,0,0,0.6)` |

### 6.2 使用方式

```vue
<n-card :class="store.userConfig.custom_background ? 'glasscard' : ''" embedded>
```

- `.glasscard` — 完整毛玻璃效果（带阴影和模糊）
- `.glasscard.glasscard--small` — 轻量版（无阴影，带边框）

### 6.3 实现条件

毛玻璃效果仅在以下条件满足时应用：
1. 用户设置了 `custom_background`
2. 组件的 `disableGlass` prop 未设为 `true`

---

## 7. 动画与过渡

### 7.1 全局过渡

- 主题切换过渡：`color 0.5s, background-color 0.5s`
- 链接悬浮过渡：`0.4s`

### 7.2 操作按钮动画

`.square-action` 按钮的悬浮展开效果：
```css
.square-action {
  width: 22px;
  transition: width 0.3s ease;
}
.square-action:hover {
  width: auto;
}
.square-action .unshow-text {
  opacity: 0;
  transition: opacity 0.3s ease;
}
.square-action:hover .unshow-text {
  opacity: 1;
}
```

### 7.3 加载页动画

`index.html` 中的加载页使用多阶段动画序列：
- Logo 淡入升起 (0.1s delay)
- 标题文字滑入展开 (0.6s delay)
- 进度条增长 + 渐变流动
- 提示文字延迟淡入

---

## 8. 图标系统

- 图标库：`@vicons/material` (Material Design Icons)
- 使用 Naive UI 的 `n-icon` 包裹：

```vue
<n-icon :component="SomeIcon" />
<!-- 或指定大小 -->
<n-icon :component="SomeIcon" size="16" />
```

- 图标以 `shallowRef` 存储动态图标引用
- 常见图标导入模式：

```ts
import { SettingsSharp, HomeOutlined, KeyboardArrowUpRound } from '@vicons/material'
```

---

## 9. 响应式设计

### 9.1 移动端判定

```ts
const { isMobile } = useResponsive()
// isMobile = window.innerWidth < window.innerHeight
```

### 9.2 响应式调整要点

| 场景 | 桌面端 | 移动端 |
|------|--------|--------|
| Toast 消息位置 | `top` | `bottom` |
| Tooltip 触发方式 | `hover` | `manual` (禁用) |
| 表单输入框宽度 | `60%` ~ `70%` | `75%` ~ `85%` |
| 下拉菜单展开触发 | `hover` | `click` |
| 账户面板 | 显示 | 隐藏 |
| 开发模式标签 | 显示 | 隐藏 |

### 9.3 CSS class 标记

根组件 `div` 上会添加以下 class 组合以供 CSS 选择器使用：
- `lang-zh` / `lang-en` / `lang-ja` — 当前语言
- `theme-light` / `theme-dark` — 当前主题
- `app-mobile` / `app-desktop` — 设备类型
- `env-web` / `env-electron` — 运行环境
- `env-overlay` — 悬浮窗模式

---

## 10. 滚动条

项目自定义了 WebKit 滚动条样式（见 `scrollbar.css`）：

- 滚动条宽度：`15px`
- 滑块颜色：`#8b8b8b`（悬浮 `#606060`）
- 圆角滑块
- 三角箭头按钮（SVG 内联）
- 轨道背景透明

---

## 11. 新增页面/组件的设计检查清单

新增 UI 元素时，按以下清单逐项确认：

- [ ] 颜色：使用 CSS 变量或 Tailwind 语义类名，不硬编码
- [ ] 主题：在亮色和暗色主题下均正常显示
- [ ] 毛玻璃：卡片级组件考虑 `.glasscard` 支持
- [ ] 响应式：在桌面和移动端均可正常使用
- [ ] 字体：使用项目字体栈，不引入额外字体
- [ ] 图标：使用 `@vicons/material`，通过 `n-icon` 渲染
- [ ] 按钮：使用 Naive UI `n-button` 或项目 `TooltipButton`
- [ ] 弹窗：使用 `MyModal` 模板，命名 `ModalXxx.vue`
- [ ] 卡片：使用 `FoldableCard` 或 Naive UI `n-card embedded`
- [ ] 间距：遵循现有间距规范（10px gap、1rem padding）
- [ ] 文字：所有可见文本使用 i18n
- [ ] 动画：新增动画应克制、流畅，与现有风格统一
