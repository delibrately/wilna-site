# GitHub Pages 修复记录

日期：2026-07-06

## 问题原因

1. `hugo.toml` 中把 `[params]` 改成了 `[[params]]`，导致 Hugo 报错 `key table already exists as a params`，站点无法构建。
2. 站点部署在 GitHub Pages 项目路径 `/wilna-site/` 下，但模板和内容中存在 `/zh/`、`/people/...`、`/Dut.png` 等根路径引用。上线后浏览器会请求 `https://delibrately.github.io/...` 根目录，绕过 `/wilna-site/`，因此出现 404 和图片不显示。
3. `canonifyURLs = true` 会把部分资源生成为绝对 URL，不适合当前需要兼容项目子路径的部署方式。
4. `defaultContentLanguage`、`defaultContentLanguageInSubdir` 等站点级配置被放在 `[params]` 内，Hugo 不会按预期识别。
5. `Dut.png`、`logo1.png`、`intro/*.jpg` 位于 `assets/`，不能像 `static/` 文件一样直接用 `/文件名` 访问，必须通过 Hugo Pipes 发布。
6. 英文 `LeiWang.md` 引用 `LeiWang.jpg`，但实际文件名是 `Leiwang.jpg`。GitHub Pages 大小写敏感，因此线上会 404。
7. 中文研究页引用 `/research/Simulation.png`，仓库中没有这个静态文件。
8. 仓库中追踪了旧的 `public/` 构建产物，而 Hugo 默认不会删除旧输出；GitHub Actions 上传整个 `public/` 时，旧页面也可能被一起发布。
9. 主题 CSS 中字体路径写成 `url("/fonts/...")`，在 GitHub Pages 项目路径下会请求到域名根目录。

## 修改内容

1. 修复 `hugo.toml`：
   - 使用标准 `baseURL`。
   - 恢复合法的 `[params]` 配置。
   - 将语言、emoji、robots、CJK 等站点级配置移到顶层。
   - 设置 `canonifyURLs = false`、`relativeURLs = false`，由 `baseURL` 和 Hugo 的 `relURL`/`RelPermalink` 负责生成带 `/wilna-site/` 的链接。
   - 将 `params.logo` 从数组表改为普通表，便于模板读取。
2. 修复主题模板：
   - 页头首页链接改为 `.Site.Home.RelPermalink`。
   - 语言切换链接改为 `relURL`，避免写死 `/zh/`、`/en/`。
   - CSS、搜索脚本、翻译链接、404 返回首页链接改为相对站点 permalink。
   - 首页 intro 图片优先读取 `params.introImages`，并通过 `resources.Get` 发布 `assets/intro/*.jpg`。
   - 站点 logo 优先通过 `resources.Get` 发布 `assets/Dut.png`。
   - 缩略图模板支持远程图片、`assets/` 图片和 `static/` 图片。
   - Markdown 内部链接经过 `relURL` 处理。
3. 修复内容图片路径：
   - 删除人物页图片路径开头的 `/`。
   - 将英文 Lei Wang 图片修正为 `people/Leiwang.jpg`。
   - 将中文研究页不存在的 `research/Simulation.png` 改为现有的 `intro/1.jpg`、`intro/2.jpg`。
4. 新增 `static/.nojekyll`，避免 GitHub Pages 对 Hugo 输出进行 Jekyll 处理。
5. 更新 GitHub Actions 构建命令为 `hugo --minify --cleanDestinationDir`，确保每次部署前清理旧的 `public/` 输出。
6. 将主题字体路径改为 `../fonts/...`，让字体相对 CSS 文件加载。
7. 让列表卡片和详情页同时支持 `thumbnail`、`image`、`img` 三种图片字段，并统一修正本地图片 URL。

## 验证方式

本地执行：

```bash
hugo --minify --buildFuture --cleanDestinationDir
```

然后检查 `public/` 中生成的 HTML，确认站内资源路径应带有 `/wilna-site/` 前缀，例如：

```html
/wilna-site/css/...
/wilna-site/zh/
/wilna-site/people/...
```

GitHub Actions 使用 `.github/workflows/hugo.yaml` 构建并上传 `public/`，修复后应不再因为 Hugo 配置错误中断构建。

---

## 2026-07-10 线上排版与内容重构

### 本轮发现的问题

1. 首页 Hero 的标题和说明读取了未配置的参数，因此线上只显示背景图，左侧出现大块空白。
2. 团队、研究和论文章节声明了 `peopleList`、`researchList`、`paperList` 等旧布局，但仓库缺少匹配模板；Hugo 回退到博客主题的通用页面，造成内容缺失、错误年份和异常留白。
3. Hugo 0.146 之后重构了模板查找系统，同名的内容类型和详情布局会互相抢占；章节页可能错误套用人物或论文详情模板。
4. 原页头只突出单个小图标，没有完整展示大连理工大学和 Wilna Lab 标识；手机端导航也缺少完整交互。
5. 首页研究、成果、联系入口缺少稳定的内容层级和响应式卡片，桌面端过于空旷，手机端曾出现裁切和横向溢出。
6. 中英文加入页面引用了仓库中不存在的 `ANTS-20240524-v3.pdf`，必然产生 404。
7. 三篇论文仅填写 DOI 编号，没有 `https://doi.org/` 前缀，浏览器将其识别为站内相对链接并返回 404。
8. favicon、空链接、图片替代文本和 GitHub Pages 子路径需要统一检查。

### 本轮修改内容

1. 新增项目级 `baseof`、页头、页脚、首页、404、新闻、团队、研究、论文和加入页面模板，不再依赖主题的博客回退样式。
2. 新增 `assets/css/lab.css`，建立统一的蓝绿品牌色、排版、按钮、卡片、详情页和响应式规则。
3. 首页改为完整的实验室工作界面：
   - 使用真实团队合影作为全宽 Hero 背景。
   - 增加中英文实验室介绍和研究/团队入口。
   - 展示两项研究方向、六条最新成果和联系合作区域。
4. 页头同时展示大连理工大学与 Wilna Lab 标识；手机端增加可点击的折叠菜单。
5. 为团队章节增加导师照片卡片和学生/校友网格；为研究章节增加真实图片卡片；为论文章节增加年份、作者、期刊和 CCF 等级列表。
6. 章节页统一使用独立的 `overview` 布局，避免 Hugo 新模板系统将章节页误识别为详情页。
7. DOI 链接在模板中自动补全 `https://doi.org/`；缺失的招生 PDF 入口替换为实验室联系邮箱。
8. 补充中英文界面参数、SEO 描述、favicon、可访问图片文本和 404 返回入口。

### 本轮验证结果

1. `hugo --minify --buildFuture --cleanDestinationDir` 构建成功，中英文页面均正常生成。
2. 自动审计 sitemap 中 144 个页面，以及页面引用的图片、CSS、脚本和站内链接。
3. 对首页、团队、导师详情、研究、研究详情、论文、论文详情、新闻和加入页面执行桌面与手机宽度检查。
4. 手机端菜单可展开，包含研究、团队、论文和语言切换四个入口。
5. 验证目标为：无站内 404、无缺图、无空链接、无错误根路径、无横向溢出。
