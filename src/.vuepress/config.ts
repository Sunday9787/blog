import { registerComponentsPlugin } from "@vuepress/plugin-register-components";
import { getDirname, path } from "@vuepress/utils";
import { defineUserConfig } from "vuepress";
import { hopeTheme } from "vuepress-theme-hope";
import { searchProPlugin } from "vuepress-plugin-search-pro";
import navbar from "./navbar";
import sidebar from "./sidebar";

const __dirname = getDirname(import.meta.url);

export default defineUserConfig({
  title: "机车靓仔的博客",
  port: 7077,
  public: path.join(process.cwd(), "public"),
  dest: path.join(process.cwd(), "dist"),
  head: [
    ["link", { rel: "shortcut icon", href: "https://static-1256180570.cos.ap-nanjing.myqcloud.com/favicon.ico" }],
    ["meta", { name: "apple-mobile-web-app-capable", content: "yes" }],
    ["meta", { name: "apple-mobile-web-app-status-bar-style", content: "black" }],
  ],
  pagePatterns: ["**/*.md", "!**/*.snippet.md", "!.vuepress", "!node_modules"],
  theme: hopeTheme({
    iconAssets: "fontawesome",
    footer: "Made by docs with ❤️",
    displayFooter: true,
    themeColor: true,
    navbar,
    sidebar,
    blog: {
      roundAvatar: true,
      avatar: "https://static-1256180570.cos.ap-nanjing.myqcloud.com/image/20500528.jpg",
      name: "机车靓仔",
      description: "群居不倚 独立不惧",
      medias: {
        github: "https://github.com/Sunday9787",
        "163Music": "https://music.163.com/#/user/home?id=72183681",
      },
    },
    plugins: {
      components: {
        components: ["VPCard", "VPBanner", "Badge", "CodePen", "SiteInfo"],
      },
      comment: {
        provider: "Giscus",
        repo: "Sunday9787/sunday90.com",
        repoId: "R_kgDOJI8Lww",
        category: "Announcements",
        categoryId: "DIC_kwDOJI8Lw84Cb2De",
        mapping: "pathname",
        strict: false,
        reactionsEnabled: true,
        inputPosition: "bottom",
      },
      blog: {
        filter(item) {
          return item.slug !== "README";
        },
      },
      prismjs: {
        light: "one-light",
        dark: "one-dark",
      },
      mdEnhance: {
        tasklist: true,
        include: true,
        vuePlayground: true,
        playground: {
          presets: ["ts", "vue", "unocss"],
        },
        component: true,
        demo: true,
        tabs: true,
        codetabs: true,
        echarts: true,
        sub: true,
        sup: true,
        alert: true,
        // 启用 figure
        figure: true,
        // 启用图片懒加载
        imgLazyload: true,
        // 启用图片标记
        imgMark: true,
        // 启用图片大小
        imgSize: true,
        // 流程图
        flowchart: true,
        mark: true,
        footnote: true,
        align: true,
      },
    },
  }),
  plugins: [
    registerComponentsPlugin({
      componentsDir: path.resolve(__dirname, "./components"),
    }),
    searchProPlugin({
      locales: {
        "/": {
          autocomplete: "ctrl + k 搜索",
          emptyResult: "暂无记录",
          emptyHistory: "暂无搜索历史",
        },
      },
      hotKeys: [{ key: "k", ctrl: true }],
    }),
  ],
});
