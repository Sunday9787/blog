---
title: webpack+ts+es6+vue 配置教程
date: 2020-07-17 22:46:52
tags: [webpack, ts, vue]
categories: [webpack]
---

![webpack](https://static-1256180570.cos.ap-nanjing.myqcloud.com/image/2023-03-08-18-04-41-2023-02-28-02-00-30-20230228020028.png)

之前一直搞不懂webpack，也排斥学习 总是觉得太难了 配置太复杂。。。

最近一段时间没事写写轮播图玩，传统dom形式是写通了，我想拿到vue, react用呢？

<!-- more -->

理解webpack如何配置？

打造自己的组件库？

那么现在开始吧

------

# Webpack 的四大核心

- entry 入口源文件
- output 生成文件出口
- loader 进行文件处理
- plugins 插件，比 loader 更强大，能使用更多 webpack 的 api

下面配置一个 vue + ts + tsx webpack配置【基于v4】

## 第一步 配置 入口出口模块

先把入口出口模块配置

```js
module.exports = {
  mode: process.env.NODE_ENV,  // 启用不同类型的 mode 得到的优化效果不一样
  devtool: 'source-map',  // webpack serve 运行的时候 添加 source-map
  entry: util.resolve('src/components/main.ts'),   // 入口文件
  output: {
    filename: 'index.js',  // 打包后的文件名
    path: util.resolve('dist'),   // 输出的目录
    publicPath: '/',  // 结合 HtmlWebpackPlugin 使用，定义资源基准地址
    // chunkFilename: '[id].js',    // 哈希name
    libraryTarget: 'umd',  // 打包成什么类型模块 如果打包成 common 模块推荐 commonjs2
    library: 'swiper',  // 对外暴露的模块名称
    umdNamedDefine: true,  // 如果设置了 libraryTarget： 'umd' 则 需要设置 umdNamedDefine: true
  },
  // ...more
}
```

## 第二步 配置可以被解析的文件

配置 可以被解析的文件

因为我们要支持ts和vue打包，所以 extensions 要加 `.vue` `.ts`

再配置一个别名 方便我们 在项目中 import 例如 `import xxx form '@/xxxx'`

```js
module.exports = {
  // ...more
  resolve: {
    extensions: ['.js', '.vue', '.json', '.ts'],  // 可以被解析的文件
    alias: {
      '@': util.resolve('src'), // 别名 tsconfig 也同样需要配置一份  详见  tsconfig `paths`选项
    },
  },
}
```

## 第三步 配置外部资源

配置 外部资源，这些资源不需要被打包在一起

```js
module.exports = {
  // ...more
  externals: [{ vue: 'Vue' }],  // 外部已经有的依赖模块 至于为何是 数组 或者对象 字符串 还是自己百度一下实际测试，我说的可能不太对，总的来说是 模块对外暴露的名称 和 模块 名称
}
```

## 第四步 配置 module

配置 module

我们想 打包一个vue + ts/tsx scss 需要用到什么loader？

- vue 肯定要 vue-loader
- ts ts-loader
- scss sass-loader

*loader 的执行顺序是 从 `右` 到 `左` 切记 loader顺序错误依然不会正确打包*

- 解析 `.ts` 首先要通过ts-loader 检查ts类型校验 然后 被编译成esnext 模块，babel-loader 再编译成浏览器能处理的js模块和js版本

```js
module.exports = {
  // ...more
  module: {
    rules: [
      // ...more
      {
        test: /\.ts$/i,
        loader: 'babel-loader!ts-loader',   // 处理ts文件 loader 传递loader的名称 ! 代表 多个loader分隔符 简写【猜的。。。】
      },
    ],
  }
}
```

- 解析 `.tsx`

```js
module.exports = {
  // ...more
  module: {
    rules: [
      // ...more
      {
        test: /\.tsx$/i,
        use: [
          { loader: 'babel-loader' },  // ts 处理完后 交给 babel 编译成 普通 js文件 es5版本(根据babel配置)
          {
            loader: 'ts-loader',
            options: {
              appendTsSuffixTo: [/\.vue$/], // 让 ts 支持 .vue 文件处理 敲黑板 这一步不要忘记  场景 .tsx 文件中去引入 .vue组件 引用链接 https://segmentfault.com/a/1190000012024858
            },
          },
        ],
        exclude: util.resolve('node_modules'),  // 不处理的目录
      },
    ],
  }
}
```

- 解析 `.scss`
  这一步需要先配置 sass-loader 然后
  交给 postcss-loader 自动添加浏览器前缀
  再交给 css-loader
  再 交给 MiniCssExtractPlugin.loader 导出.css 文件

```js
module.exports = {
  // ...more
  module: {
    // ...more
    rules: [
      {
        test: /\.s[ac]ss$/i,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,  // 导出为.css
            options: {
              publicPath: '/',
              hmr: process.env.NODE_ENV === 'development',  // css 热更新
            },
          },
          'css-loader',
          'postcss-loader',   // 帮助自动添加浏览器后缀
          {
            loader: 'sass-loader',
            options: {
              implementation: require('dart-sass'),   // 默认使用的是 node-sass node-sass 下载巨慢。。。 推荐 dart-sass 下载速度还快 
            },
          },
        ],
      },
    ]
  }
}
```

## 最后奉上 最终配置

```js
const VueLoaderPlugin = require('vue-loader/lib/plugin');    // vue-loader 的所有插件 处理template .vue专用 插件
const HtmlWebpackPlugin = require('html-webpack-plugin');    // webpack 加载一个 html 作为 结果展示页
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');   // 压缩js
const MiniCssExtractPlugin = require('mini-css-extract-plugin');  // 把 css 文件导出到本地

const util = require('./util');   // 工具包

/**
 * @type {import('webpack').Configuration}
 */
module.exports = {
  mode: process.env.NODE_ENV,  // 启用不同类型的 mode 得到的优化效果不一样
  devtool: 'source-map',  // webpack serve 运行的时候 添加 source-map
  entry: util.resolve('src/components/main.ts'),   // 入口文件
  output: {
    filename: 'index.js',  // 打包后的文件名
    path: util.resolve('dist'),   // 输出的目录
    publicPath: '/',  // 结合 HtmlWebpackPlugin 使用，定义资源基准地址
    // chunkFilename: '[id].js',    // 哈希name
    libraryTarget: 'umd',  // 打包成什么类型模块 如果打包成 common 模块推荐 commonjs2
    library: 'swiper',  // 对外暴露的模块名称
    umdNamedDefine: true,  // 如果设置了 libraryTarget： 'umd' 则 需要设置 umdNamedDefine: true
  },
  resolve: {
    extensions: ['.js', '.vue', '.json', '.ts'],  // 可以被解析的文件
    alias: {
      '@': util.resolve('src'), // 别名 tsconfig 也同样需要配置一份  详见  tsconfig `paths`选项
    },
  },
  externals: [{ vue: 'Vue' }],  // 外部已经有的依赖模块
  module: {   // loader 执行顺序是 从 右 到 左
    rules: [
      {
        test: /\.ts$/i,
        loader: 'babel-loader!ts-loader',   // 处理ts文件 loader 传递loader的名称 ! 代表 多个loader分隔符 简写【猜的。。。】
      },
      {
        test: /\.tsx$/i,
        use: [
          { loader: 'babel-loader' },
          {
            loader: 'ts-loader',
            options: {
              appendTsSuffixTo: [/\.vue$/], // 让 ts 支持 .vue 文件处理
            },
          },
        ],
        exclude: util.resolve('node_modules'),  // 不处理的目录
      },
      {
        test: /\.(es6|js|mjs)$/i,
        include: util.resolve('src'),  // 可以被处理的目录
        exclude: util.resolve('node_modules'),
        use: [
          {
            loader: 'babel-loader',
          },
        ],
      },
      {
        test: /\.vue$/i,
        loader: 'vue-loader',     // .vue 文件 vue-loader 会把他们处理成 .js .css,
        options: {                // 所以 对 于 这种类型文件 需要 再配置 loader
          loaders: {
            js: 'babel-loader',
            ts: 'babel-loader!ts-loader',
            tsx: 'babel-loader!ts-loader',   // 好像这个不需要。。。我没试过  .vue || tsx 只能选一个
          },
          compilerOptions: {
            preserveWhitespace: false, // 放弃模板标签之间的空格 详看 https://vue-loader.vuejs.org/zh/options.html#compiler
          },
        },
      },
      {
        test: /\.css$/,
        use: ['css-loader'],
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,  // 导出为.css
            options: {
              publicPath: '/',
              hmr: process.env.NODE_ENV === 'development',  // css 热更新
            },
          },
          'css-loader',
          'postcss-loader',   // 帮助自动添加浏览器后缀
          {
            loader: 'sass-loader',
            options: {
              implementation: require('dart-sass'),   // 默认使用的是 node-sass node-sass 下载巨慢。。。 推荐 dart-sass 下载速度还快 
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new VueLoaderPlugin(),
    new MiniCssExtractPlugin({
      // filename: '[name].[chunkhash:8].css',     // 哈希name `chunkhash` 打包为库之类的不需要哈希，只有实际业务开发打包的文件最好加哈希
      // chunkFilename: '[id].[chunkhash:8].css',
    }),
    new HtmlWebpackPlugin({
      title: 'My App',
      filename: 'index.html',
      template: util.resolve('public/index.html'),
      // inject: 'head',    // 把打包后的资源链接 插入到 HTML那个位置
    }),
  ],
  stats: 'normal',    // 打包控制台输出的信息 类别
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        cache: util.resolve('.cache'),
        parallel: true,
        sourceMap: true,
      }),
    ],
  },
};
```

那么有什么问题 可以留言，请多多指教
