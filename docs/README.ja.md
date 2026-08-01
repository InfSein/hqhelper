<p align="center">
  <img alt="icon" height="160" src="/docs/image/app-logo.png" />
</p>
<h1 align="center"></h1>

<p align="center">
  <a href="/README.md">简体中文</a>
  |
  <strong>日本語</strong>
  |
  <a href="/docs/README.en.md">English</a>
</p>

[![GitHub License](https://img.shields.io/github/license/InfSein/hqhelper?style=flat&logo=github)](/LICENSE) ![GitHub Repo stars](https://img.shields.io/github/stars/InfSein/hqhelper?style=flat&logo=github) ![Github Created At](https://img.shields.io/github/created-at/InfSein/hqhelper?style=flat&logo=github) <br>
[![CodeFactor](https://www.codefactor.io/repository/github/infsein/hqhelper/badge/dev)](https://www.codefactor.io/repository/github/infsein/hqhelper/overview/dev) [![GitHub commit activity](https://img.shields.io/github/commit-activity/m/InfSein/hqhelper/dev)](https://github.com/InfSein/hqhelper/commits/master) [![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/InfSein/hqhelper) <br>
[![GitHub Release](https://img.shields.io/github/v/release/InfSein/hqhelper?style=flat&logo=github)](https://github.com/InfSein/hqhelper/releases) [![GitHub Downloads (all assets, all releases)](https://img.shields.io/github/downloads/InfSein/hqhelper/total?style=flat&logo=github)](https://github.com/InfSein/hqhelper/releases) [![Crowdin](https://badges.crowdin.net/hqhelper/localized.svg)](https://crowdin.com/project/hqhelper) <br>
[![Based on Vite](https://img.shields.io/badge/Vite-7.3.2-646CFF?style=flat&logo=vite)](https://github.com/vitejs/vite) [![Based on Vue3](https://img.shields.io/badge/Vue-3.5.28-4FC08D?style=flat&logo=vue.js)](https://github.com/vuejs/core) [![Based on TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?style=flat&logo=typescript)](https://github.com/microsoft/TypeScript) [![Based on Naive UI](https://img.shields.io/badge/Naive%20UI-2.43.2-008080?style=flat&logo=npm)](https://github.com/tusen-ai/naive-ui)

生産＆採集プレイヤー向けの秘伝書レシピ計算ツール。

パッチで追加されたHQ装備、食事、強化薬の情報整理とレシピ計算ツールを提供します。さらに、生産＆採集プレイヤーにとって便利なその他の機能も用意しています。

## 使い方

### ブラウザで使う

#### 本番環境サイト

* メインサイト: https://infsein.github.io/hqhelper/#/
* サブサイト:https://hqhelper.nbb.fan/#/


#### テスト環境サイト

* https://beta.hqhelper.nbb.fan/#/

> [!CAUTION]\
> 名前の通り、テスト専用です。
> 頻繁に更新され、深刻なバグが発生する可能性があります。

### アプリとして使う

様々なラッピング方法を提供する予定ですが、ブラウザと同じパフォーマンスを保証しかねます。

[hqhelper-client](https://github.com/InfSein/hqhelper-client) をご覧ください。

### 手動ビルド

 `Node.js` をインストールする必要があります。

```sh
git clone https://github.com/InfSein/hqhelper.git
cd hqhelper
npm i
npm run dev
```

## サポートの提供

### フォローしてください

* **このリポジトリにStarをつけてください**
* **SNS**：[Weibo](https://weibo.com/u/7870808507) | [X（Twitter)](https://twitter.com/FF14_HqHelper)
* **NGA**：<https://bbs.nga.cn/read.php?tid=41510690>

### 開発に参加する

* **問題を探す:**：使用中にエラーや問題点を見つけたり、UIや機能、ロジックの改善案がある場合は、 [イシューを提出](https://github.com/InfSein/hqhelper/issues/new) してください。
* **問題を解決する**：フロントエンドプログラミングのスキルがある方は、 [プルリクエスト](https://github.com/InfSein/hqhelper/pulls) を通じて `HqHelper` の開発に参加できます。コードは共通の規約といくつかの追加規則に従う必要があります。詳しくは [Wiki](https://github.com/InfSein/hqhelper/wiki)をご覧ください。

### ギフティング

* <https://afdian.com/a/infseins>

## その他

### バージョン番号の説明

バージョン番号は `MAJOR.MINOR.PATCH`  という命名規則に従います。

1. `MAJOR`,`MINOR`,`PATCH` はすべて正の整数です;
2. `MAJOR` は `HqHelper`の第何世代かを示し、対応する `ファイナルファンタジーXIV` の拡張パッケージも表します;
3. `MINOR` は `ファイナルファンタジーXIV` の中間バージョン（例：7.1の1）を表します;
4. `PATCH` は、指定した `MAJOR` および `MINOR` のもとで、何回目の更新かを示します。

例として、`2.1.17` は以下を意味します：

- 第 `2` 世代の `HqHelper`であり、 `ファイナルファンタジーXIV` の パッチ`7.x` に対応している;
-  `ファイナルファンタジーXIV` の第 `1` 中間バージョン、つまり `7.1`に対応。
-  `7.1` に対応したバージョンを基づいて、`17` 回目の更新。

### アクティビティの概要

![Repobeats analytics image](https://repobeats.axiom.co/api/embed/63a7eccc9d5dbb3887525e67ed8bf2512246388b.svg "Repobeats analytics image")

### Star数の推移

[![Stargazers over time](https://starchart.cc/InfSein/hqhelper.svg?variant=adaptive)](https://starchart.cc/InfSein/hqhelper)
