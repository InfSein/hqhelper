## HqHelper 贡献指南

#### **代码修改**

如果您具有前端编程能力，您可以通过发起 [Pull Request](https://github.com/InfSein/hqhelper/pulls) 等方式参与到 `HqHelper` 的开发工作中。代码可能需要遵守通用规范和一些额外村规，具体请参阅我们的 [Wiki](https://github.com/InfSein/hqhelper/wiki) 。

您可以使用 AI 编程工具，但应当确保代码质量，让 PR 能够被人类看懂。

#### **i18n 翻译**

`HqHelper` 对简体中文·英文·日文提供第一方支持。

如果你希望添加 `HqHelper` 的 i18n 语言：
很遗憾，我们高度依赖游戏解包解析的json数据文件，暂时没有余力去兼容其他语言。
一种比较合适的方案是 `fork` 本仓库，制作一个单独的语言版本并自行维护。
如果仍旧非常希望我们增加第一方支持，请新建 `Issue` 以收集社区意见。

如果你希望对 `HqHelper` 的现有翻译进行修改：
请直接发起 [Pull Request](https://github.com/InfSein/hqhelper/pulls) 对语言json文件进行修改。在 `vscode` 中，可以使用 `i18n Ally` 插件辅助工作。
