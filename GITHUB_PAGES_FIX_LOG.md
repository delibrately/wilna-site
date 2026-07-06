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
