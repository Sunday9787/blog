---
url: /log/vscode/eslint-prettier-stylelint-commitlint.md
---

# 项目工程化之 eslint+prettier+stylelint+commitlint

团队多人协同开发项目中困恼团队管理一个很大的问题是：无可避免地会出现每个开发者编码习惯不同、代码风格迥异，为了代码高可用、可维护性， 如何从项目管理上尽量统一和规范代码呢？

* \[x] 文档约定 - 谆谆教导，自求多福？
* \[x] 经常性 CodeReview - 苦口婆心，耳提面命？

显然这种无法实时反馈、延迟解决的方式会造成沟通成本高，往往最终结果还不太理想...
理想的方式是在项目工程化层面 借助可灵活配置的工具，自动化 解决。

## 统一编辑器配置

.editorconfig 配置

```ini [.editorconfig]
# http://editorconfig.org

# top-most EditorConfig file
root = true

# Unix-style newlines with a newline ending every file
[*]
charset = utf-8
end_of_line = lf
indent_style = space
insert_final_newline = true
trim_trailing_whitespace = true

# Indentation override for js(x), ts(x) and vue files
[*.{js,jsx,ts,tsx,vue}]
indent_size = 2

# Indentation override for css related files
[*.{css,styl,scss,less,sass}]
indent_size = 2

# Indentation override for html files
[*.html]
indent_size = 2

# Trailing space override for markdown file
[*.md]
trim_trailing_whitespace = false

# Indentation override for config files
[*.{json,yml}]
indent_size = 2
```

## 第一步 配置 prettier 格式化规范

1. 安装 prettier
   ::: code-group

```sh [npm]
npm install prettier -D
```

```sh [yarn]
yarn add prettier -D
```

```sh [pnpm]
pnpm add prettier -D
```

```sh [bun]
bun add prettier -D
```

:::

解释

> `prettier` 是自动格式化代码的关键包 格式化不仅限 js ts css html

2. 配置 prettier
   配置双引号还是单引号 需不需要 `;` `,` 号 详细介绍参考[官网](https://prettier.io/docs/en/options.html)

```json [.prettierrc]
{
  "semi": false,
  "tabWidth": 2,
  "trailingComma": "none",
  "printWidth": 120,
  "singleQuote": true,
  "jsxSingleQuote": true,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "htmlWhitespaceSensitivity": "strict",
  "quoteProps": "as-needed",
  "endOfLine": "lf"
}
```

## 第二步 配置 eslint

1. 安装 eslint

::: code-group

```sh [npm]
npm install eslint eslint-plugin-vue @vue/eslint-config-prettier @vue/eslint-config-standard -D
```

```sh [yarn]
yarn add eslint eslint-plugin-vue @vue/eslint-config-prettier @vue/eslint-config-standard -D
```

```sh [pnpm]
pnpm add eslint eslint-plugin-vue @vue/eslint-config-prettier @vue/eslint-config-standard -D
```

```sh [bun]
bun add eslint eslint-plugin-vue @vue/eslint-config-prettier @vue/eslint-config-standard -D
```

:::

解释:

> `eslint` 是必须要装的懂的都懂
> `eslint-plugin-vue` 可以让 `eslint` 检查 `vue` 文件
> `@vue/eslint-config-prettier` 兼容 prettier 配置
> `@vue/eslint-config-standard` vue 标准配置

2. 配置 eslint

```js [.eslintrc.js]
/**
 * @type {import('eslint').Linter.Config}
 */
module.exports = {
  root: true,
  env: {
    browser: true,
    es6: true
  },
  globals: {
    uni: 'readonly',
    wx: 'readonly'
  },
  extends: ['plugin:vue/essential', '@vue/eslint-config-standard', '@vue/eslint-config-prettier'],
  plugins: ['prettier'],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'import/extensions': ['warn', 'never', { json: 'always', vue: 'always' }],
    camelcase: ['off']
  }
}
```

3. 在 package.json中添加 lint 脚本

```json
{
  "scripts": {
    "lint": "eslint --fix"
  }
}
```

## 第三步 配置 stylelint

1. 安装 stylelint

::: code-group

```sh [npm]
npm install stylelint stylelint-config-prettier stylelint-config-recess-order stylelint-config-recommended-vue stylelint-config-standard-scss -D
```

```sh [yarn]
yarn add stylelint stylelint-config-prettier stylelint-config-recess-order stylelint-config-recommended-vue stylelint-config-standard-scss -D
```

```sh [pnpm]
pnpm add stylelint stylelint-config-prettier stylelint-config-recess-order stylelint-config-recommended-vue stylelint-config-standard-scss -D
```

```sh [bun]
bun add stylelint stylelint-config-prettier stylelint-config-recess-order stylelint-config-recommended-vue stylelint-config-standard-scss -D
```

:::

**解释:**

> `stylelint` 校验css/scss/less/stylus 代码规范
> \~~`stylelint-config-prettier` 兼容 prettier 配置 将 stylelint 发现的问题 交给 prettier 格式化处理~~ **依赖 stylelint v15 以下**
> `stylelint-prettier` 将 stylelint 发现的问题 交给 prettier 格式化处理 **依赖 stylelint v15 以上**
> `stylelint-config-recess-order` 校验css声明位置顺序
> `stylelint-config-recommended-vue` vue 推荐配置 且 可以检测 .vue 文件
> `stylelint-config-recommended-scss` scss 推荐配置

1. 配置 stylelint

```js [.stylelintrc.js]
/**
 * @type {import('stylelint').Config}
 */
module.exports = {
  extends: [
    'stylelint-config-recommended-scss',
    'stylelint-config-recommended-vue/scss',
    'stylelint-config-recess-order'
  ],
  plugins: ['stylelint-prettier'],
  rules: {
    'scss/no-global-function-names': null,
    'selector-class-pattern': null,
    'scss/dollar-variable-pattern': [/^\$-{2}/, { ignore: 'global' }],
    // 支持小程序 rpx 单位
    'unit-no-unknown': [true, { ignoreUnits: 'rpx' }],
    // 支持自定义标签定义样式
    'selector-type-no-unknown': [true, { ignore: ['custom-elements', 'default-namespace'] }]
  }
}
```

## 第四步 配置 commitlint

1. 安装 commitlint

::: code-group

```sh [npm]
npm install @commitlint/cli @commitlint/config-conventional commitizen cz-conventional-changelog-zh -D
```

```sh [yarn]
yarn add @commitlint/cli @commitlint/config-conventional commitizen cz-conventional-changelog-zh -D
```

```sh [pnpm]
pnpm add @commitlint/cli @commitlint/config-conventional commitizen cz-conventional-changelog-zh -D
```

```sh [bun]
bun add @commitlint/cli @commitlint/config-conventional commitizen cz-conventional-changelog-zh -D
```

:::

**解释:**

> `@commitlint/cli` 校验 commit
> `@commitlint/config-conventional` commit 规范配置
> `commitizen` 交互式命令提交 commit
> `cz-conventional-changelog-zh` 交互式命令配置

2. 配置 commitlint

```json [.commitlintrc]
{
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "perf",
        "test",
        "build",
        "ci",
        "chore",
        "revert",
        "conflict",
        "font",
        "delete",
        "stash"
      ]
    ]
  }
}
```

## 第五步 配置 commitizen

1. 安装 commitizen

::: code-group

```sh [npm]
npm install husky commitizen cz-conventional-changelog-zh -D
```

```sh [yarn]
yarn add husky commitizen cz-conventional-changelog-zh -D
```

```sh [pnpm]
pnpm add husky commitizen cz-conventional-changelog-zh -D
```

```sh [bun]
bun add husky commitizen cz-conventional-changelog-zh -D
```

:::

**解释:**

> `commitizen` 交互式命令提交 commit
> `cz-conventional-changelog-zh` 交互式命令配置

2. 配置 commitizen

```json [.czrc]
{
  "path": "cz-conventional-changelog-zh"
}
```

3. 在 package.json中添加 commit 脚本

```json
{
  "scripts": {
    "commit": "git-cz"
  }
}
```

## 第六步 配置 lint-staged

1. 安装 lint-staged

::: code-group

```sh [npm]
npm install lint-staged -D
```

```sh [yarn]
yarn add lint-staged -D
```

```sh [pnpm]
pnpm add lint-staged -D
```

```sh [bun]
bun add lint-staged -D
```

:::

**解释:**
lint-stage 配合husky使用 仅仅校验 `stage` 区代码

2. 配置 lint-stage

```json [.lintstagedrc]
{
  "*.{js,jsx,ts,tsx,vue}": ["npm run lint"],
  "*.{css,scss,sass,less,stylus}": ["stylelint --fix"],
  "*.{json}": ["prettier -w"],
  "*.{html,vue}": ["stylelint --custom-syntax postcss-html --fix"]
}
```

## 第七步 配置 husky

1. 安装 husky

::: code-group

```sh [npm]
npm install husky -D
```

```sh [yarn]
yarn add husky -D
```

```sh [pnpm]
pnpm add husky -D
```

```sh [bun]
bun add husky -D
```

:::

2. 在 package.json中添加 prepare 脚本

```json
{
  "scripts": {
    // 项目 clone 后 自动初始化 husky
    "prepare": "husky install"
  }
}
```

3. 配置 husky

初始化 husky

```bash
npx husky install
```

添加 commitlint hooks

```bash
npx husky add .husky/commit-msg 'npx commitlint -e $GIT_PARAMS'
```

添加 lint hooks

```bash
npx husky add .husky/pre-commit 'npx lint-staged'
```

## 最后

大功告成！！！

不论使用什么编辑器!

不论是使用 git命令 还是 各种可视化 git 工具 提交！

统统可以在提交时自动格式化 自动校验 commit 信息！！！

提交时只需要 执行

```bash
pnpm commit
```

自动会出现 交互式命令提交 commit

![今天周五](https://static-1256180570.cos.ap-nanjing.myqcloud.com/photography/2023-04-21-21-11-02-emjio-friday.jpg)
