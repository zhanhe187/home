# 项目汇总主页 / PERSONAL PROJECTS

线上地址：<https://zhanhe187.github.io/home/>

一个纯静态的个人项目汇总页：一张固定的天空 / 海边列车背景图，深色玻璃卡片，项目名称、简短说明和跳转地址。页面不包含姓名、照片、学校、电话、邮箱、简历或任何联系方式，也不加载统计脚本与第三方字体。

## 页面内容

| 区块 | 内容 |
| --- | --- |
| Hero | “做过的一些项目。” + 一句话概述 + 查看项目 |
| 项目 | 3 张深色玻璃卡：非遗文化知识图谱平台 / IT 服务交付系统 / 员工全周期治理系统 |
| 页脚 | 建站说明与 LeiBox 动效署名 |

项目地址：

- 非遗文化知识图谱平台：<http://124.222.198.58>
- 非遗项目源码：<https://github.com/zhanhe187/Fire_tree>
- IT 服务交付系统：<https://github.com/zhanhe187/feic/tree/main/servicedesk>
- 员工全周期治理系统：<https://github.com/zhanhe187/feic/tree/main/workforce>

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

1. 新建仓库（`home`、`projects` 或 `<用户名>.github.io`）。
2. 推送本目录：

```bash
cd personal-site
git remote add origin https://github.com/<用户名>/<仓库名>.git
git push -u origin main
```

3. 仓库 **Settings → Pages → Deploy from a branch → main / (root)**。

- 仓库名为 `<用户名>.github.io` 时，地址是 `https://<用户名>.github.io/`
- 其他仓库名时，地址是 `https://<用户名>.github.io/<仓库名>/`
- 换仓库名后，把 `index.html` 里的 canonical / `og:url` / `og:image` / `twitter:image` 改成新的完整地址

## 维护

| 想改什么 | 改哪里 |
| --- | --- |
| 背景图 | `assets/img/background.jpg`；位置在 `site.css` 的 `.bg__photo` |
| 项目卡片 | `index.html` 里三张 `.lc`（`data-colors` 控制液体三色） |
| 项目链接 | 卡片内 `.lc__go` / `.lc__mini` 的 `href` |
| 页面文案 | `index.html` 的 `<title>`、`<meta name="description">` 与正文 |
| 玻璃 / 文字颜色 | `site.css` 顶部的 CSS 变量（`--glass`、`--ink`、`--accent` 等） |
| 液态卡片 | `assets/js/liquid-cards.js`（悬停或键盘聚焦触发） |
| 光标搭建动效 | `assets/js/cursor-build.js`（滚动到项目区播放一次，右上角按钮重播） |
| 社交预览图 | `assets/img/og.jpg`（1200×630） |

## 实现说明

- 无框架、无构建步骤，只有 HTML / CSS / 原生 JS。
- 液态卡片改造自 LeiBox `shader-flood`（设计参考：Ashish Gogula / Planes），保留署名。
- 光标与选框的节奏改造自 LeiBox `multi-cursor-builder`；原组件是完整英文 demo，这里只保留光标、选框和搭建节奏，没有引入原包。
- 背景图固定在视口，滚动时只有内容移动。
- 支持键盘焦点、`prefers-reduced-motion`（关闭漂移、揭示和光标动画）；WebGL 不可用时卡片退化为静态玻璃卡。
- 系统字体：Inter / SF Pro / PingFang SC / Microsoft YaHei 等，不请求外部字体。

## 隐私说明

站内不包含个人身份与联系方式。项目卡片链接到公开仓库与已上线的演示站；如果某个项目不再希望被公开索引，删除对应卡片或替换链接即可。

旧版简历式主页、证件照与简历 PDF 已移出站点目录，并在重建 Git 历史时排除，不会随本仓库发布。
