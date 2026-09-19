---
url: /log/specification/code-style.md
---

# 前端开发规范

规范不是强制性的，对代码的编写和程序的运行不会有致命的问题，但是没有规范会有一系列的问题，比如：

缺乏规范，第一个问题就是团队编码风格不一，增加了成员之间代码的阅读成本，加大了团队协作成本和维护成本；
随着团队人员的变化（多人开发一个应用，或者应用更换开发人员），如果缺乏规范，项目可能会变得一团糟，甚至失控；
即便是个人开发，规范也是需要的，当把项目转给其他人的时候，如果有规范的话，会大大降低阅读成本。

## 命名规范

> 基本命名准则
>
> * 贴合业务
> * 简洁、语义化，能够英文释义
> * 始终保持一种命名方法。项目中可能多人协同开发，而命名方式有多种都是可行的，进行开发时应保持原来代码命名风格
> * 书写时 名词在前 动词形容词在后
>
>   例如：productAdd、productDel

### 项目命名

命名使用 snake\_case 规则（全部采用小写方式，以下划线分隔）

正例：h5\_station\_company

反例：H5\_STATION\_COMPANY / h5StationCompany

### 目录命名

命名使用 kebab-case 规则（全部采用小写方式， 以中划线分隔），有复数结构时，要采用复数命名法， 缩写不用复数）

注意：

公共组件以及页面入口，需要单独命名 xxxx/index.vue

UNI-APP 页面入口，需要文件名跟文件夹名一致（pages/user/user.vue）

正例：

src/views/user/index.vue

反例：

src/views/user.vue

\*\*【特殊】\*\*项目中的 components 中的组件目录，使用 kebab-case命名

正例： components/head-search/page-loading/index.vue

反例：components/headSearch/pageLoading/index.vue

\*\*【特殊】\*\*项目中的 其他目录也应使用 kebab-case命名

正例： src/pages/layout-header/index.vue

反例：src/pages/layoutHeader/index.vue

### JS、CSS、SCSS、HTML、PNG 等文件命名

命名使用 kebab-case 规则（全部采用小写方式，以中线分隔）

正例： src/images/layout-header.jpg

反例：src/images/layoutHeader.jpg

\*\*【特殊】\*\*js/ts 文件

正例： src/utils/eventBus.js

反例：src/utils/eventbus.js

不推荐：src/utils/event-bus.js

### 命名严谨性

代码中的命名严禁使用拼音与英文混合的方式，更不允许直接使用中文的方式。 说明：正确的 英文拼写和语法可以让阅读者易于理解，避免歧义。注意，即使纯拼音命名方式也要避免采用

正例：rmb/shanghai 等国际通用的名称，可视同英文

反例： Jiage \[价格] / getShujuList() \[数据列表]

杜绝完全不规范的缩写，避免望文不知义：

反例： button“缩写”命名成 bt；product “缩写”命名成 pro，此类随意缩写严重 降低了代码的可阅读性

严禁ABCD123456此类命名

### css 命名规范

#### id

命名使用 kebab-case 规则（全部采用小写方式，以中线分隔）

正例： #user-avatar

反例：#userAvatar

#### class

命名使用 CSS [BEM](https://getbem.com/) 规则（全部采用小写方式，以中线、下划线分隔）

命名模式

* block {}，block 代表了更高级别的抽象或组件。(多词 - 中划线分割)
* block\_\_element {}，代表 .block 的后代，用于形成一个完整的 .block 的整体。 (多词 - 中划线分割)
* block–modifier {}，代表 .block 的不同状态或不同版本。(多词 - 中划线分割)

```css
/** 块 */
.nav-primary {}
/** 块__元素 */
.nav-primary__link
/** 块__元素--修饰符 */
.nav-primary__link--is-active

/** 块 */
.grid
/** 块__元素 */
.grid__description
/** 块__元素 */
.grid__img-wrap
/** 块__元素 */
.grid__img

/** 块 */
.global-footer
/** 块__元素 */
.global-footer__col
/** 块__元素 */
.global-footer__header
/** 块__元素 */
.global-footer__link
```

```html
<form class="form form--simple">
  <input class="form__input" type="text" />
  <button class="form__button form__button--disabled">submit</button>
</form>
```

正例：

```html
<div class="card">
  <div class="card-head">
    <h1 class="card-head__title">标题</h1>
    <span class="card-head__title__sub">子标题</span>
  </div>
  <div class="card-inner">
    <slot />
  </div>
</div>
```

反例：

```html
<div class="card">
  <div class="head">
    <h1 class="title">标题</h1>
    <span class="title-sub">子标题</span>
  </div>
  <div class="inner">
    <slot />
  </div>
</div>
```

正例：

```html
<article class="article">
  <div class="article-body">
    <button class="article__button-primary">按钮1</button>
    <button class="article__button-success">按钮2</button>
  </div>
</article>
```

反例：

```html
<article class="article">
  <div class="body">
    <button class="button-primary">按钮1</button>
    <button class="button-success">按钮2</button>
  </div>
</article>
```

参考引用

<https://codeguide.bootcss.com/>

<https://getbem.com/>

<https://juejin.cn/post/6844903740978249735>

#### 书写顺序

书写顺序按照（相同层级顺序按照字符长度排先后顺序）

* 元素位置 层级 显示方式
* 元素大小尺寸 对齐方式
* 字体 行高
* 颜色
* 元素外貌修饰
* 动画过度设置

```css
.card {
  /** 元素位置 层级 显示方式 */
  position: reactive;
  display: block;

  /** 元素大小尺寸 对齐方式 */
  padding: 10px;
  margin: 0 auto;

  /** 字体 行高 */
  color: #333;
  font-size: 16px;
  line-height: 1.6;
  text-align: left;

  /** 颜色 */
  color: #333;
  background-color: #fff;

  /** 元素外貌修饰 */
  cursor: default;
  border-radius: 8px;
  border: 1px solid #e8e8e8;

  /** 动画过度设置 */
  transition-duration: 0.1s;
  transition-timing-function: ease-in;
  transition-property: color;
}
```

#### 常用的 CSS 命名规则

* 头：header
* 内容：content/container/wrapper/inner
* 尾：footer
* 导航：nav
* 侧栏：sidebar
* 栏目：column
* 页面外围控制整体佈局宽度：wrapper
* 左右中：left right center
* 登录条：login-bar
* 标志：logo
* 广告：banner
* 页面主体：main
* 热点：hot
* 新闻：news
* 下载：download
* 子导航：sub-nav
* 菜单：menu
* 子菜单：submenu
* 搜索：search
* 友情链接：friend-link
* 页脚：footer
* 版权：copyright
* 滚动：scroll
* 标签：tag
* 文章列表：list
* 提示信息：msg/message
* 小技巧：tips
* 栏目标题：title
* 加入：join
* 指南：guide
* 服务：service
* 注册：register
* 状态：status
* 投票：vote
* 合作伙伴：partner

### JS 命名规范

根据 eslint 配置

#### 变量

命名方法：小驼峰式命名法

命名规范：前缀应当是名词 + 后缀动词

正例：

```js
let maxCount = 10
let tableTitle = '销售数据'
```

反例：

```js
let max_count = 10
let table_title = '销售数据'
```

#### 常量

命名方法：名称全部大写(必须使用 const 声明)

命名规范：使用大写字母和下划线来组合命名，下划线用以分割单词

```js
const MAX_COUNT = 10
const TABLE_TITLE = '销售数据'
```

#### 函数

命名方法：小驼峰式命名法

命名规范：前缀应当是动词 + 后缀名词

动词列表：

| 动词   | 含义                         | 返回值                                                |
| ------ | ---------------------------- | ----------------------------------------------------- |
| can    | 判断是否可执行某个动作(权限) | 函数返回一个布尔值。true：可执行；false：不可执行     |
| has    | 判断是否含有某个值           | 函数返回一个布尔值。true：含有此值；false：不含有此值 |
| is     | 判断是否为某个值             | 函数返回一个布尔值。true：为某个值；false：不为某个值 |
| get    | 获取某个值                   | 函数返回一个非布尔值                                  |
| set    | 设置某个值                   | 无返回值、返回是否设置成功或者返回链式对象            |
| load   | 加载某些数据                 | 无返回值或者返回是否加载完成的结果                    |
| create | 创建某些数据                 | 必须要有返回值                                        |
| remove | 移除某些数据                 | 无返回值或者返回是已移除的结果                        |

```js
function createTable() {
  return { data: [], loading: false }
}

function getName() {
  return this.name
}
```

#### 类

命名方法：大驼峰式

命名规范：前缀为名称

```js
class Persion {
    constructor(options) }{
        this.name = options.name
    }
}
```

#### 类的成员

公共属性和方法：小驼峰

私有属性和方法：前缀为\_(下划线)，后面小驼峰

```js
class Persion {
    constructor(options) }{
        this.name = options.name
        this._sex = options.sex
    }

	_full() {
        return `姓名：${this.name} 性别：${this._sex}`
    }

	sayName() {
        console.log('你好', this.name)
    }
}
```

附常用的动词列表：

| get 获取      | set 设置          | add 增加       | remove 删除     |
| ------------- | ----------------- | -------------- | --------------- |
| create 创建   | destroy 移除      | start 启动     | stop 停止       |
| open 打开     | close 关闭        | read 读取      | write 写入      |
| load 载入     | save 保存         | begin 开始     | end 结束        |
| backup 备份   | restore 恢复      | import 导入    | export 导出     |
| split 分割    | merge 合并        | inject 注入    | delete 移除     |
| add 加入      | append 添加       | clean 清理     | clear 清除      |
| index 索引    | sort 排序         | find 查找      | search 搜索     |
| increase 增加 | decrease 减少     | play 播放      | pause 暂停      |
| launch 启动   | run 运行          | compile 编译   | execute 执行    |
| debug 调试    | trace 跟踪        | observe 观察   | listen 监听     |
| build 构建    | publish 发布      | input 输入     | output 输出     |
| encode 编码   | decode 解码       | encrypt 加密   | decrypt 解密    |
| compress 压缩 | decompress 解压缩 | pack 打包      | unpack 解包     |
| parse 解析    | emit 生成         | connect 连接   | disconnect 断开 |
| send 发送     | receive 接收      | download 下载  | upload 上传     |
| refresh 刷新  | sync 同步         | update 更新    | revert 复原     |
| lock 锁定     | unlock 解锁       | check out 签出 | check in 签入   |
| submit 提交   | commit 交付       | push 推        | pull 拉         |
| expand 展开   | collapse 折叠     | begin 起始     | end 结束        |
| start 开始    | finish 完成       | enter 进入     | exit 退出       |
| abort 放弃    | quit 离开         | obsolete 废弃  | depreciate 废旧 |
| collect 收集  | collection 合集   |                |                 |
