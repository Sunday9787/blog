import { defineConfig } from 'vitepress'
import { defineTeekConfig } from 'vitepress-theme-teek/config'
import { groupIconMdPlugin, groupIconVitePlugin } from 'vitepress-plugin-group-icons'
import { vitepressPluginLegend } from 'vitepress-plugin-legend'
import { RssPlugin } from 'vitepress-plugin-rss'
import llmstxt from 'vitepress-plugin-llms'
import { containerPreview, componentPreview } from '@vitepress-demo-preview/plugin'
import { VueReplMdPlugin } from 'vitepress-plugin-repl'
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs'

export default defineConfig({
  extends: defineTeekConfig({
    blogger: {
      name: '机车靓仔',
      avatar: 'https://static-1256180570.cos.ap-nanjing.myqcloud.com/image/20500528.jpg',
      slogan: '群居不倚 独立不惧',
      shape: 'circle'
    },
    comment: {
      provider: 'giscus',
      options: {
        repo: 'Sunday9787/blog',
        repoId: 'R_kgDOK6A5zg',
        category: 'Announcements',
        categoryId: 'DIC_kwDOK6A5zs4Cb2DM',
        mapping: 'pathname',
        inputPosition: 'bottom'
      }
    },
    social: [{ name: 'GitHub', icon: 'github', link: 'https://github.com/Sunday9787' }],
    // 文章摘要 & 封面配置
    post: {
      showCapture: true,
      excerptPosition: 'bottom',
      coverImgMode: 'small'
    },
    // 首页 Banner（映射原 VuePress BlogHome 的 bgImage + tagline）
    banner: {
      bgStyle: 'fullImg',
      imgSrc:
        'https://static-1256180570.cos.ap-nanjing.myqcloud.com/image%2F2023-12-15-01-52-47-2017_yamaha_mt_10_4k.jpg',
      description:
        '人生有振作奋斗的时刻，也有必须接受现实的时候。现在木已成舟，只有傻子才会去钻牛角尖。但事实上，我一直都是个傻子。',
      descStyle: 'types',
      mask: true
    },
    // 右侧卡片
    homeCardSort: ['topArticle', 'category', 'tag', 'friendLink', 'docAnalysis'],
    topArticle: { limit: 5 },
    category: { limit: 8 },
    tag: { limit: 21 },
    friendLink: {
      list: [
        {
          name: '楼教主',
          link: 'https://www.52cik.com/'
        },
        {
          name: '红发',
          link: 'https://www.xlcool.cn/'
        }
      ]
    },
    // 关闭自动侧边栏生成（已手动配置 sidebar）
    vitePlugins: {
      sidebar: false,
      docAnalysisOption: {
        ignoreList: ['login.md', 'pages']
      }
    }
  }),
  markdown: {
    config(md) {
      vitepressPluginLegend(md)
      md.use(groupIconMdPlugin)
      md.use(VueReplMdPlugin)
      md.use(tabsMarkdownPlugin)
      md.use(containerPreview)
      md.use(componentPreview)
    }
  },
  vite: {
    plugins: [
      groupIconVitePlugin(),
      llmstxt(),
      RssPlugin({
        title: '机车靓仔的博客',
        baseUrl: 'https://sunday90.com',
        copyright: 'Copyright (c) 2023-present, 机车靓仔',
        author: {
          name: '机车靓仔',
          link: 'https://github.com/Sunday9787'
        },
        icon: true,
        filename: 'feed.rss',
        ignoreHome: true,
        log: true
      })
    ]
  },

  title: '机车靓仔的博客',
  description: '机车靓仔的博客 - 群居不倚 独立不惧',
  lang: 'zh-CN',
  head: [
    [
      'link',
      {
        rel: 'shortcut icon',
        href: 'https://static-1256180570.cos.ap-nanjing.myqcloud.com/favicon.ico'
      }
    ],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }]
  ],
  cleanUrls: true,
  srcDir: './docs',
  outDir: './dist',

  themeConfig: {
    nav: [
      { text: '主页', link: '/', activeMatch: '^/$' },
      { text: '存档', link: '/archives/', activeMatch: '^/archives/$' },
      { text: '日志', link: '/log/', activeMatch: '^/log' },
      { text: '摄影', link: '/photography/', activeMatch: '^/photography/$' },
      { text: '友链', link: '/friends/', activeMatch: '^/friends/$' },
      { text: '关于', link: '/about/', activeMatch: '^/about/$' }
    ],

    sidebar: {
      '/log/': [
        {
          text: 'JavaScript',
          collapsed: true,
          items: [
            { text: 'JavaScript 技巧', link: '/log/javascript/tips' },
            { text: 'Word Puzzle', link: '/log/javascript/word-puzzle' }
          ]
        },
        {
          text: 'Typescript',
          collapsed: true,
          items: [
            { text: 'Decorator', link: '/log/typescript/decorator' },
            { text: 'Design', link: '/log/typescript/design' },
            { text: 'Reset Data', link: '/log/typescript/reset_data' }
          ]
        },
        {
          text: 'Web 安全',
          collapsed: true,
          items: [{ text: 'target=_blank', link: '/log/security/target=_blank' }]
        },
        {
          text: '开发规范',
          collapsed: true,
          items: [{ text: '代码规范', link: '/log/specification/code-style' }]
        },
        {
          text: 'Vscode',
          collapsed: true,
          items: [
            {
              text: 'ESLint + Prettier + Stylelint + Commitlint',
              link: '/log/vscode/eslint-prettier-stylelint-commitlint'
            },
            { text: 'VSCode 插件推荐', link: '/log/vscode/vscode-plugin' }
          ]
        },
        {
          text: 'Vue',
          collapsed: true,
          items: [
            { text: 'Demo Preview', link: '/log/vue/demo-preview' },
            { text: '数据权限模块设计', link: '/log/vue/data-permission' },
            { text: 'Element Form', link: '/log/vue/element-form' },
            { text: '权限管理', link: '/log/vue/permission' },
            { text: '模板编辑器', link: '/log/vue/template_editor' },
            { text: '模板编辑器区域', link: '/log/vue/template_editor_area' },
            {
              text: '模板编辑器组件',
              link: '/log/vue/template_editor_component'
            },
            {
              text: '模板编辑器控制',
              link: '/log/vue/template_editor_control'
            },
            { text: '模板编辑器指南', link: '/log/vue/template_editor_guide' },
            {
              text: '模板编辑器标线',
              link: '/log/vue/template_editor_markline'
            },
            { text: '模板记录', link: '/log/vue/template_record' },
            { text: '模板舞台', link: '/log/vue/template_stage' },
            { text: '模板 Store', link: '/log/vue/template_store' },
            { text: '虚拟列表', link: '/log/vue/virtual_list' }
          ]
        },
        {
          text: 'Webpack',
          collapsed: true,
          items: [
            {
              text: 'Webpack + TS + ES6 + Vue',
              link: '/log/webpack/webpack-ts-es6-vue'
            }
          ]
        },
        {
          text: 'Devops',
          collapsed: true,
          items: [
            {
              text: '阿里云 Pipeline 构建失败',
              link: '/log/devops/aliyun-pipeline-pnpm-build-failure'
            }
          ]
        }
      ]
    },

    search: { provider: 'local' },
    outline: { level: [2, 3], label: '页面导航' },
    docFooter: { prev: '上一页', next: '下一页' },
    lastUpdated: { text: '最后更新于' },
    socialLinks: [{ icon: 'github', link: 'https://github.com/Sunday9787' }]
  }
})
