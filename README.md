# PROJECTS / 系统索引

线上地址：<https://zhanhe187.github.io/home/>

一个纯静态的项目导航页：玻璃质感、冷光背景、两张 WebGL 动效，页面上只有**项目名称、简介和跳转地址**。

不包含姓名、照片、学校、电话、邮箱、简历或任何联系方式，也不加载统计脚本与第三方字体。

## 页面内容

| 页面区块 | 内容 |
| --- | --- |
| Hero | 项目索引标题 + 三个项目的快捷入口 |
| 项目 | 3 张可交互的液态玻璃卡：在线平台、两套企业系统 |
| 在线体验 | 指向非遗文化知识图谱平台的液体玻璃 CTA |
| 页脚 | 建站说明与 LeiBox 动效署名 |

项目地址：

- 非遗文化知识图谱平台：<http://124.222.198.58>
- IT 服务交付系统：<https://github.com/zhanhe187/feic/tree/main/servicedesk>
- 员工全周期治理系统：<https://github.com/zhanhe187/feic/tree/main/workforce>
- 非遗项目源码：<https://github.com/zhanhe187/Fire_tree>

## 本地预览

直接双击 `index.html`，或：

```bash
cd personal-site
python -m http.server 8080
# http://localhost:8080
```

## 部署到 GitHub Pages

当前仓库为 `zhanhe187/home`，Pages 已开启，地址是 <https://zhanhe187.github.io/home/>。

重新部署或迁移时：

1. 新建一个仓库（建议 `home`、`projects` 或 `zhanhe187.github.io`）。
2. 推送本目录：

```bash
cd personal-site
git remote add origin https://github.com/<用户名>/<仓库名>.git
git push -u origin main
```

3. 仓库 **Settings → Pages → Deploy from a branch → main / (root)**。

- 仓库名为 `<用户名>.github.io` 时，地址是 `https://<用户名>.github.io/`
- 其他仓库名时，地址是 `https://<用户名>.github.io/<仓库名>/`
- 换仓库名后，把 `index.html` 里的 canonical / `og:url` / `og:image` 与 `twitter:image` 改成新的完整地址

## 维护

| 想改什么 | 改哪里 |
| --- | --- |
| 快捷入口 | `index.html` 中 `.portal__row` 三行 |
| 项目卡片 | `index.html` 中 `.lc` 三张卡（`data-colors` 控制液体配色） |
| 在线 CTA | `index.html` 中 `.live` 区块 |
| 页面文案 | `index.html` 的 `<title>`、`<meta name="description">` 与正文 |
| 玻璃/配色 | `assets/css/site.css` 顶部的 CSS 变量（`--glass`、`--accent` 等） |
| 液态卡片动效 | `assets/js/liquid-cards.js`（默认悬停触发） |
| 在线区液体玻璃 | `assets/js/liquid-glass.js` |

项目链接都直接写在 HTML 里，替换 `href` 即可；卡片里的技术栈是普通 `<li>`，可自由增删。

## 实现说明

- 无框架、无构建步骤，只有 HTML / CSS / 原生 JS。
- 液态卡片改造自 LeiBox `shader-flood`（设计参考：Ashish Gogula / Planes），保留署名。
- 在线区液体玻璃改造自 LeiBox `blue-fluted-glass`（设计参考：sasha birukoff），保留署名。
- 系统字体：Inter / SF Pro / PingFang SC / Microsoft YaHei 等，不请求外部字体。
- 支持深浅色主题（跟随系统 + 手动切换 + 记忆）、键盘焦点、减少动效；WebGL 不可用时自动降级为静态玻璃卡。

## 隐私说明

站内不包含个人身份与联系方式。项目卡片链接到公开仓库与已上线的演示站；如果某个项目不再希望被公开索引，删除对应卡片或替换链接即可。

旧版简历式主页、证件照与简历 PDF 已移出站点目录，并在重建 Git 历史时排除，不会随本仓库发布。
