---
alwaysApply: true
---

# 项目概览

## 简介

个人技术博客站点（[sunday90.com](https://sunday90.com)），基于 **VitePress** 构建，使用 **vitepress-theme-teek** 主题，内容涵盖前端开发（Vue / TypeScript / JavaScript / Webpack）、Web 安全、开发规范、DevOps 等方向的技术日志，以及摄影、友链等个性化栏目。博主：机车靓仔，签名：群居不倚 独立不惧。

## 技术栈

| 类别     | 技术                                                     |
| -------- | -------------------------------------------------------- |
| 框架     | VitePress ^1.6.4 + Vue 3                                 |
| 主题     | vitepress-theme-teek ^1.6.2                              |
| 语言     | TypeScript / Markdown                                    |
| 包管理   | pnpm 11.20.0（Node 22.23.1，volta 锁定）                 |
| 评论系统 | Giscus（GitHub Discussions）                             |
| CI/CD    | GitHub Actions → GitHub Pages（自定义域名 sunday90.com） |
| 代码质量 | Prettier + lint-staged + simple-git-hooks + cspell       |

## 功能特性

博客集成了多个 VitePress 生态插件：

- **主题增强**：`vitepress-theme-teek` —— 首页 Banner、博主卡片、文章摘要/封面、右侧卡片（置顶文章 / 分类 / 标签 / 友链 / 文档统计）
- **代码展示**：`vitepress-demo-plugin` + `@vitepress-demo-preview` —— 组件 Demo 容器与实时预览
- **代码组图标**：`vitepress-plugin-group-icons` —— 代码块分组图标
- **代码标注**：`vitepress-plugin-legend` —— 代码块标题/说明
- **Vue 在线运行**：`vitepress-plugin-repl` —— Markdown 内嵌 Vue 在线 Playground
- **标签页**：`vitepress-plugin-tabs` —— Markdown 标签页组件
- **RSS 订阅**：`vitepress-plugin-rss` —— 生成 `feed.rss`
- **LLM 友好**：`vitepress-plugin-llms` —— 生成 `llms.txt` 供大模型阅读
- **评论**：Giscus，基于 GitHub Discussions，按页面路径关联
- **搜索**：VitePress 内置本地搜索（`provider: local`）

## 目录结构

```
blog/
├── .github/
│   └── workflows/
│       └── deploy.yml        # CI/CD：构建并部署到 gh-pages
├── .vitepress/
│   ├── config.ts             # 站点配置（导航 / 侧边栏 / 插件 / 主题）
│   └── theme/
│       ├── index.ts          # 主题入口：注册插件与自定义组件
│       └── style.css         # 主题色、字体、摄影页瀑布流样式
├── docs/
│   ├── index.md              # 首页（teek 自动渲染）
│   ├── about/                # 关于
│   ├── archives/             # 存档
│   ├── friends/              # 友链
│   ├── interview/            # 面试
│   ├── log/                  # 技术日志（主要文章区）
│   │   ├── devops/           # DevOps 踩坑记录
│   │   ├── javascript/       # JavaScript 技巧
│   │   ├── security/         # Web 安全
│   │   ├── specification/    # 开发规范
│   │   ├── typescript/       # TypeScript
│   │   ├── vscode/           # VSCode 配置与插件
│   │   ├── vue/              # Vue 系列（含模板编辑器系列文章 + demo）
│   │   └── webpack/          # Webpack 实践
│   └── photography/          # 摄影（瀑布流）
├── package.json              # 依赖与脚本
├── pnpm-workspace.yaml       # pnpm 构建许可配置
├── tsconfig.json
├── .prettierrc / .prettierignore
├── cspell.config.yaml        # 拼写检查词典
└── .npmrc                    # npmmirror 镜像源
```

## 常用命令

环境要求：Node.js ≥ 22（推荐使用 volta 自动切换版本）。

```bash
pnpm install      # 安装依赖
pnpm doc:dev      # 本地开发（热更新）
pnpm doc:build    # 生产构建（输出到 dist/）
pnpm doc:preview  # 本地预览构建产物
pnpm format       # 代码格式化
```

## 文章内容分类

- **JavaScript**：JavaScript 技巧、Word Puzzle
- **TypeScript**：Decorator、设计模式、数据重置
- **Vue**：权限管理、数据权限模块、模板编辑器系列（区域 / 组件 / 控制 / 标线 / 舞台 / Store）、Element Form、虚拟列表、Demo Preview、antd DatePicker 排查
- **Web 安全**：`target=_blank` 防钓鱼漏洞
- **Webpack**：Webpack + TS + ES6 + Vue 集成
- **开发规范**：前端代码规范
- **VSCode**：ESLint + Prettier + Stylelint + Commitlint 配置、插件推荐
- **DevOps**：阿里云 Pipeline pnpm 构建失败排查

## 部署流程

推送 `master` 分支后，`.github/workflows/deploy.yml` 自动触发：

1. 安装 pnpm 与 Node.js（含 pnpm 依赖缓存）
2. `pnpm install` 安装依赖
3. `pnpm run doc:build` 构建站点
4. 通过 `peaceiris/actions-gh-pages` 将 `dist/` 发布到 `gh-pages` 分支
5. 配置自定义域名 `sunday90.com`（CNAME）

## 评论系统

基于 Giscus（GitHub Discussions），仓库为 `Sunday9787/blog`，通过页面路径（`pathname`）映射评论，无需自建后端。

## 许可证

ISC
