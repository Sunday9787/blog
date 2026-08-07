---
title: 记一次 pnpm 版本翻车现场：流水线好好的怎么突然就崩了？
date: 2026-05-26 10:00:00
top: true
tags: [pnpm, CI/CD, 阿里云]
categories: [devops]
---

## 事情是这样的

周一早上，当你喝着咖啡哼着小曲，打开阿里云流水线准备看看喜闻乐见的 ✅ 时：

```bash
node:22
pnpm:11.0.8
Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.
```

**嗯？？？构建失败了？？？**

赶紧切到本地跑一發 —— 屁事没有，一路绿灯。

这就很离谱了，同一套代码，本地起飞，CI 坠机？

## 破案过程

### 第一回合：本地 vs 服务器的环境差异

拿出祖传对比大法：

| 环境         | pnpm 版本 |
| :----------- | :-------- |
| 阿里云流水线 | 11.0.8    |
| 本地开发环境 | 10.18.3   |

**好家伙！** 流水线偷偷用上了 pnpm v11，而本地的 v10 表示情绪稳定。

### 第二回合：谁在背后捣鬼？

看看流水线的构建命令：

```bash
npm install pnpm -g  # ← 这就是那个男人
pnpm install && pnpm build
```

好家伙，`npm install pnpm -g` 每次都装**最新版**！

之前流水线装的是 v10，岁月静好。直到有一天，pnpm 发布了 v11，带来了全新的「安全机制」—— 不再和你哔哔，直接报错退出。

### 第三回合：v10 vs v11 态度对比

| pnpm 版本 | 遇到未批准构建脚本时的态度               |
| :-------- | :--------------------------------------- |
| **v10**   | 「嘿，有个脚本没批准哦，不过我先忍了」😑 |
| **v11**   | 「没批准？那我不干了！」😤               |

## 解决方案

### ❌ 临时方案（不推荐）

```bash
pnpm approve-builds --all && pnpm install && pnpm build
```

每次构建都要来这么一出，妥妥的治标不治本，下次还崩。

### ✅ 优雅方案（推荐）

在项目根目录的 `pnpm-workspace.yaml` 中加一行配置：

```yaml
onlyBuiltDependencies:
  - core-js
  - simple-git-hooks
```

然后流水线就可以正常跑了：

```bash
pnpm install && pnpm build
```

**原理是这样的：**

pnpm v11 学坏了，不再相信任何人，必须你亲口告诉他哪个依赖可以运行脚本。`onlyBuiltDependencies` 就是你给他的「白名单」，白名单内的依赖可以撒欢，白名单外的统统不行。

这个配置提交到 Git 后，团队成员和 CI 机器都能自动生效，而且 v10 也能兼容，堪称居家旅行必备良方。

## 血的教训

### 1. CI/CD 环境不要追新

```diff
- npm install pnpm -g          # 永远装最新版，今天是 v11，明天可能是 v99
+ npm install pnpm@10.18.3 -g  # 锁定版本，安心睡觉
```

### 2. 关注 breaking change

pnpm v11 这次升级，把警告改成报错，属于设计层面的「加强管理」。工具升级前建议先看看 changelog，不然哪天它突然翻脸你都不知道为什么。

### 3. 让配置成为团队共识

`pnpm-workspace.yaml` 这种配置文件应该提交到 Git，让团队和 CI 都用同一套配置。一个地方改，到处生效，告别「我本地能跑」这种玄学。

### 4. 排查套路

遇到「本地正常、CI 挂掉」的情况，第一反应应该是：「环境有什么不一样？」—— 版本差异是万恶之源。

## 最终配置一览

```yaml [pnpm-workspace.yaml]
onlyBuiltDependencies:
  - core-js
  - simple-git-hooks
```

```json [package.json]
{
  "packageManager": "pnpm@10.18.3"
}
```

```bash
# 阿里云流水线构建命令
npm install pnpm@10.18.3 -g
pnpm install && pnpm build
```

---

> **一句话总结**：流水线安装 pnpm 时没锁定版本，一不小心升级到 v11，被它的「强制批准脚本」机制教做人。解决方案很简单 —— 声明白名单，锁定版本，然后世界清静。

🎉 搞定！

![爱你哦](https://static-1256180570.cos.ap-nanjing.myqcloud.com/image/1779726698336.jpg?imageMogr2/interlace/1/thumbnail/300x)
