import { navbar } from "vuepress-theme-hope";

export default navbar([
  {
    text: "主页",
    link: "/",
    icon: "compass",
    activeMatch: "^/$",
  },
  {
    text: "存档",
    link: "/article/README.md",
    icon: "newspaper",
    activeMatch: "^/article/$",
  },
  {
    text: "日志",
    icon: "book",
    link: "/log/README.md",
    activeMatch: "^/log",
  },
  {
    text: "摄影",
    link: "/photography/README.md",
    icon: "image",
    activeMatch: "^/photography/$",
  },
  {
    text: "友链",
    link: "/friends/README.md",
    icon: "user-group",
    activeMatch: "^/friends/$",
  },
  {
    text: "关于",
    link: "/about/README.md",
    icon: "address-card",
    activeMatch: "^/about/$",
  },
]);
