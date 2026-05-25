import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/log/": [
    {
      text: "JavaScript",
      icon: "code",
      collapsible: true,
      prefix: "javascript",
      children: "structure",
    },
    {
      text: "Typescript",
      icon: "code",
      collapsible: true,
      prefix: "typescript",
      children: "structure",
    },
    {
      text: "Web 安全",
      icon: "shield-halved",
      collapsible: true,
      prefix: "security",
      children: "structure",
    },
    {
      text: "开发规范",
      icon: "file-lines",
      collapsible: true,
      prefix: "specification",
      children: "structure",
    },
    {
      text: "Vscode",
      icon: "paper-plane",
      collapsible: true,
      prefix: "vscode",
      children: "structure",
    },
    {
      text: "Vue",
      icon: "v",
      collapsible: true,
      prefix: "vue",
      children: "structure",
    },
    {
      text: "Webpack",
      collapsible: true,
      icon: "signs-post",
      prefix: "webpack",
      children: "structure",
    },
    {
      text: "Devops",
      collapsible: true,
      icon: "tools",
      prefix: "devops",
      children: [
        {
          text: "阿里云 Pipeline 构建失败",
          link: "/log/devops/aliyun-pipeline-pnpm-build-failure.md",
        }
      ]
    }
  ],
});
