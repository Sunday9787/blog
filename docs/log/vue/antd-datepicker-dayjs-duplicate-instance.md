---
title: 排查笔记：a-config-provider 配了中文，DatePicker 面板却还是英文？
date: 2026-08-28
categories: [Vue]
tags: [dayjs, ant-design-vue, pnpm, 排查]
---

> 一个典型的「配置生效了，但又没完全生效」的 case，根因藏在 pnpm 依赖结构里。

## 问题现象

在 Vue 3 + ant-design-vue 4 项目中，`App.vue` 里明明做了三件套配置：

```ts
import 'dayjs/locale/zh-cn' // 注册中文 locale
import zhCN from 'ant-design-vue/es/locale/zh_CN' // 引入中文语言包
dayjs.locale('zh-cn') // 设置 dayjs 全局语言
```

模板里也包了 `<a-config-provider :locale="zhCN">`。然而打开页面：

- 日期选择器的**输入框占位符是中文**（"请选择日期"）
- 但**弹出面板里的月份、星期全是英文**（Jan / Feb / Sun / Mon…）

语言包似乎生效了，又似乎没生效，非常割裂。

## 排查思路

### 1. 先确认 antd 语言包有没有生效

占位符是中文，说明 `ConfigProvider` 的 `zh_CN` 语言包**生效了**。占位符文本来自 antd 的语言包对象（`DatePicker.lang.placeholder`），与 dayjs 无关。

### 2. 面板的月份/星期文案来自哪里？

这是关键。打开 ant-design-vue 的 `vc-picker` 源码，日期面板渲染月份、星期用的是：

```js
// vc-picker/panels/DatePanel/DateBody.js
const weekDaysLocale = locale.shortWeekDays || generateConfig.locale.getShortWeekDays(locale.locale)

// vc-picker/generate/dayjs.js
getShortMonths: locale => dayjs().locale(parseLocale(locale)).localeData().monthsShort()
```

也就是说，**面板文案直接取自 dayjs 的 localeData**。所以就算 antd 语言包是中文，只要 **dayjs 实例里没注册 `zh-cn`**，面板照样渲染英文。

### 3. 那 dayjs 的 `zh-cn` 到底注册了没有？

写脚本验证，结果让人意外：

```
== 应用里的 dayjs ==
active locale: zh-cn  ✅
monthsShort: ["1月","2月","3月"]  ✅

== ant-design-vue 内部的 dayjs ==
active locale: en  ❌
```

**同一个进程里出现了两个 dayjs 实例！** App.vue 里注册的 `zh-cn` 只作用在「应用那份」dayjs 上，而 antd 渲染面板用的是「另一份」完全独立的 dayjs。

## 根因：dayjs 被安装了两次

dayjs 是**单例设计**的 —— locale、插件都挂在模块级变量上。一旦项目里存在两份 dayjs，就会各持一份"独立世界"。

看 pnpm 依赖结构就明白了：

```
node_modules/dayjs                                        → 1.11.23（应用用）
node_modules/.pnpm/ant-design-vue@4.2.6_.../node_modules/dayjs → 1.11.20（antd 用）
```

- 应用声明 `"dayjs": "^1.11.23"`，被 hoist 到顶层
- ant-design-vue 声明 `"dayjs": "^1.10.5"`，pnpm 在生成 lockfile 时给它解析到了 **1.11.20**，作为嵌套依赖安装

于是 antd 的 `vc-picker/generate/dayjs.js` 里那句 `import dayjs from 'dayjs'`，按 Node 解析规则优先命中它自己嵌套的那份 **1.11.20** —— 这份实例里 `zh-cn` 从未被注册过，默认英文。

用 `require.resolve` 可以实锤：

```js
// 从 antd 的 generate 目录解析 dayjs
req.resolve('dayjs')
// → .../.pnpm/dayjs@1.11.23/node_modules/dayjs/dayjs.min.js（修复前是 1.11.20）
```

## 修复：让所有 dayjs 统一到同一个版本

核心思路是**消除重复实例**，而不是到处补注册。用 pnpm overrides 强制所有依赖统一使用根项目的 dayjs 版本。

配置写在 `pnpm-workspace.yaml`（项目根，monorepo 推荐位置）：

```yaml
# pnpm-workspace.yaml
overrides:
  dayjs: ^1.11.23
```

也可以写 `$dayjs` —— 表示"取根项目 package.json 里 dayjs 声明的版本"（pnpm 10/11 支持，锁文件会解析成具体版本）：

```yaml
overrides:
  dayjs: $dayjs
```

然后重新安装：

```bash
pnpm install
```

这样 antd 和应用的 dayjs 会合并为同一个 hoisted 实例，`pnpm-lock.yaml` 头部也会记录这份 overrides。

修复后验证：

```
是否同一实例: true
antd dayjs active locale: zh-cn
monthsShort: ["1月","2月","3月"]
```

日期面板终于全中文了。

## 经验总结

1. **单例模块被重复安装，是最隐蔽的坑之一。** dayjs、moment、`lodash` 这类模块级状态的库，重复实例化会导致"配置了但没生效"。同类问题还包括 UI 库与业务各自持有不同实例导致的 `useContext`/注入失效等。

2. **先分清"配置生效的对象"和"实际渲染的对象"。** 占位符中文、面板英文，说明语言来源有两个（antd 语言包 vs dayjs locale），按渲染链路逐个确认，就能快速锁定。

3. **验证依赖解析用 `require.resolve`。** 不要猜，直接看模块最终解析到哪个文件、哪个版本，一切一目了然。

4. **pnpm overrides 是治理这类问题的通用手段。** 可写在 `pnpm-workspace.yaml`（推荐）或 `package.json` 的 `pnpm.overrides`，直接指定版本即可。若用 `$` 跟随根版本，注意 pnpm 12（pacquet 重写版）曾存在不解析 `$` 自引用的 bug，升级时留意；官方更推荐用 catalog 机制统一维护版本。
