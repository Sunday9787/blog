---
alwaysApply: true
scene: git_message
---

# Git 提交信息规则

本项目为个人技术博客（VitePress），提交信息遵循 **Conventional Commits** 规范，统一使用中文描述。结合仓库历史习惯：**`doc` 类型最常用（文章提交占绝对多数），emoji 置于最前**。

## 格式

```
<emoji> <type>(<scope>): <subject>
```

- `emoji`：提交类型图标（必填，见下表）
- `type`：提交类型（必填）
- `scope`：影响范围（可选，模块名，小写）
- `subject`：中文简要描述（必填）

## 提交类型

| emoji | type       | 适用场景                                                                      |
| ----- | ---------- | ----------------------------------------------------------------------------- |
| 📝    | `doc`      | **新增或更新博客文章**（本项目最高频类型，优先使用 `doc` 而非 `docs`）        |
| ✨    | `feat`     | 新功能、新页面、新栏目、主题/配置升级                                         |
| 🐛    | `fix`      | 修复 Bug                                                                      |
| 👷    | `ci`       | CI/CD 配置（GitHub Actions、部署工作流），常带 scope，如 `ci(github actions)` |
| 🔧    | `chore`    | 依赖、工程配置、工具链、git hooks                                             |
| ♻️    | `refactor` | 重构，不改变外部行为                                                          |
| 🎨    | `style`    | 代码格式调整（不影响逻辑）                                                    |
| ⚡️    | `perf`     | 性能优化                                                                      |
| ✅    | `test`     | 新增或修改测试                                                                |
| 📦    | `build`    | 构建配置（webpack、vite 等）                                                  |
| ⏪    | `revert`   | 回滚提交                                                                      |

## 规范要求

1. **subject 使用中文**，动词开头、语句通顺，不带句号结尾。
   - 正确：`✨ feat: 迁移归档页并调整目录结构`
   - 错误：`✨ feat: 迁移归档页并调整目录结构。`
2. **subject 简洁明确**，控制在 20 字以内，能一句话说清做了什么。
3. **格式严格**：`emoji 与 type 间一个空格`，`type:` 后跟一个空格再接描述。
   - 正确：`👷 ci(github actions): 更新部署工作流配置`
4. **scope 使用小写**，表示影响的模块（如 `workflow`、`theme`、`config`），无明确模块时省略。
5. **一条提交只做一件事**，描述与改动内容保持一致。
6. **禁止模糊描述**，仓库历史中的 `update` 类提交已弃用。
   - 错误：`update`、`fix bug`、`修改`、`更新`
7. **新增/修改文章**优先使用 `doc` 类型，并写明文章主题（可用文章标题或主题词）。
   - 正确：`📝 doc: 新增数据权限模块设计实践`
   - 正确：`📝 doc: virtual_list`
8. **类型归属**：工程配置类（依赖、工具链、hooks）用 `chore`；CI/CD 类用 `ci`；站点功能/迁移类用 `feat`。
9. **补充说明（可选）**：当存在破坏性变更（breaking change）或需要说明原因时，在正文中添加：
   ```
   📦 build: 升级构建配置

   说明：破坏性变更，需重新安装依赖
   ```

## 示例

```text
📝 doc: 新增 antd DatePicker 面板英文排查笔记
📝 doc: virtual_list
✨ feat: 从 VuePress 迁移到 VitePress + Teek 主题
🔧 chore: 更新依赖版本并配置git hooks
👷 ci(github actions): 更新部署工作流配置
🐛 fix(theme): 修复首页 Banner 在移动端显示异常
```
