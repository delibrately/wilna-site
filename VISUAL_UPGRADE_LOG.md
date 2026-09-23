# Wilna 官网视觉与交互升级记录

日期：2026-09-23

## 修改范围与现状

- 在现有 Hugo 源码分支 `codex/github-pages-source` 上增量修改，没有新建站点或改用其他框架。
- 保留 `baseURL = "https://delibrately.github.io/wilna-site/"`、默认中文子目录、`/zh/` 和 `/en/` 页面路由。
- 未提交 Git commit、未推送任何远程分支、未部署，本次改版尚未改变线上网站。
- 当前源码包含 `content/`、`layouts/`、`assets/`、`themes/blist/` 和 Hugo 配置；不是只有静态产物的仓库。
- 按已有部署记录，GitHub Pages 使用 `codex/github-pages-fix` 分支中的静态文件，`main` 是静态文件副本，源码单独保存于当前分支。本次未更改此发布方式。
- `.github/workflows/hugo.yaml` 是历史 Hugo Actions 配置，仍监听 `main` 和 `codex/github-pages-fix`。未来发布前需复核 Pages 设置，避免历史 Actions 与分支发布互相覆盖。本次没有执行这两个流程，也没有修改该工作流。

## 检查发现

1. 首页把只有论文标题和作者的 news 条目作为“最新成果”展示，没有区分论文与真实实验室事件。
2. 研究简介直接展示整段长文，横向小图又将 16:9 研究示意图大幅裁切。
3. 导航缺少首页、动态、加入我们，当前页状态不明确，语言切换总回首页。
4. 教师列表图片占据整张卡片，详情照片宽达 330px；手机端比例不协调。
5. 所有 43 位非教师成员都被旧字段 `alumni=true` 标记，原章节标题又称其为学生。用户已明确确认他们全部是在读学生。
6. 论文列表没有年份和方向筛选；加入页面正文为空，英文页标题为中文。
7. 首页轮播没有显式暂停按钮；原暂停状态会被部分事件重启。键盘菜单缺少 Escape 和焦点返回。
8. 原始 Logo 最大为 5000×5000px，研究图约 1.6–1.8MB，未针对实际显示尺寸输出。
9. 原有颜色样式受博客主题的全局链接样式影响，按钮颜色存在被覆盖的风险。

## 设计变化

### 全站

- 最大内容宽度 1220px，统一字号、留白、边框和 4–6px 圆角。
- 保留 Wilna 和大连理工大学 Logo；保留深蓝文字 `#17212B`、学术蓝 `#0077B6`、青绿 `#087F8C`、浅灰 `#F5F8FA`。
- 青绿在浅灰底上的普通文字对比度原为 4.45:1，文字使用加深色 `#076B76`；辅助线仍保留原青绿。
- 网站模板仅加载已有项目级 `lab.css`，移除对无实际用途的主题 PostCSS 样式输出的依赖。主题源码和 npm 依赖未删除。
- 新增跳转到主内容链接、当前导航状态、键盘焦点边框、页面 canonical、对应语言 hreflang、页面独立描述。
- 使用既有 Hugo 菜单配置提供六个栏目入口。对应页有翻译时直接切换到翻译页，没有翻译时回退至相应语言栏目。

### 首页

- 保留 `3.jpg → 1.jpg → 2.jpg` 三张团队合影，每 6 秒切换。
- 使用固定尺寸图片容器、渐隐切换和局部遮罩；照片没有缩放动画。
- 保留三张图片选择及当前序号；按后续反馈移除暂停/播放按钮和查看完整合影入口。
- 按后续反馈改为持续自动循环，悬停和键盘焦点进入不会暂停；系统减少动态效果时取消过渡动画，但仍自动切图。标签页隐藏时停止计时，返回后自动恢复。
- 两张研究方向卡片完整展示现有 `5.png`、`6.png`，配有短简介和详情链接。
- 增加 WiMTI、PowerNetMax 两个代表性项目。研究问题和方法仅依据原有论文摘要整理，没有新增实验结论或指标。
- 两个项目没有独立实验图，使用明确的“实验配图待补充”占位，未借用研究方向示意图冒充实验图。
- 精选 AdapBlinker、WiMTI、PowerNetMax 三篇原有论文，展示原始作者、期刊、日期年份及 DOI。
- 动态单独成区；由于现有记录缺少真实事件内容，展示整理中状态，并保留历史条目入口。

### 二级页面

- 研究详情：大幅完整示意图、短导言、研究问题、技术方案、相关项目、相关论文。原始长文完整保留在可展开的背景介绍中。
- 团队：三位指导教师采用横向图文布局；列表照片约 104–112px 宽，详情照片桌面 190px、手机 140px。
- 43 位非教师成员全部列为在读学生；没有实际校友数据时只显示资料待补充。
- 为 92 份中英文人物文件新增 `member_status`，使用 `faculty`、`student` 或未来可用的 `alumni` 值。旧 `alumni` 字段保留兼容，不再作为新版页面的分组依据。
- 缺少学生头像时展示统一的姓名首字占位，存在真实头像时优先读取。
- 论文按年份分组，提供年份与研究方向筛选、结果数量、无结果状态和重置；无 JavaScript 时仍展示全部论文。
- 新闻保留全部八条旧记录及原有 URL，列入“历史记录”，不把原始统一日期冒充已确认事件日期。今后经确认的事件在 front matter 中添加 `confirmed_event = true` 才进入动态流。
- 加入页面补充研究入口、原有联系邮箱和交流/申请说明，没有编造名额、资助、录取条件。

## 主要修改文件

| 范围 | 文件 |
| --- | --- |
| 设计系统 | `assets/css/lab.css` |
| 交互 | `assets/js/lab.js` |
| 菜单 | `hugo.toml`、`layouts/partials/header.html` |
| 页面框架及 SEO | `layouts/_default/baseof.html`、`layouts/partials/head.html`、`layouts/partials/footer.html` |
| 首页 | `layouts/index.html` |
| 图片与共享卡片 | `layouts/partials/image.html`、`research-card.html`、`project-card.html`、`paper-item.html`、`member-card.html` |
| 研究页面 | `layouts/partials/research-overview.html`、`layouts/research/research.html` |
| 成员页面 | `layouts/partials/people-overview.html`、`layouts/people/mentor.html`、`layouts/people/people.html` |
| 论文页面 | `layouts/partials/papers-overview.html` |
| 新闻页面 | `layouts/news/overview.html`、`layouts/partials/news-feed.html`、`layouts/partials/news-detail.html`、`content/{zh,en}/news/_index.md` |
| 加入页面 | `layouts/joinus/joinus.html`、`content/en/joinus.md` |
| 展示数据 | `data/ui.json`、`data/research.json`、`data/featured_research.json`、`data/paper_topics.json` |
| 人员身份 | `content/{zh,en}/people/*.md` 中 92 个资料文件 |
| 中文栏目标题 | `content/zh/{research,people,papers}/_index.md` |
| 其他列表语义 | `layouts/_default/list.html` |
| 验收脚本 | `scripts/audit-links.py`、`scripts/check-site.mjs` |

## 图片与性能

- Hugo 自动生成 WebP 和响应式 srcset，保留所有原图，不改写原始图片。
- 首屏首张照片优先加载；手机首屏选用足够覆盖纵向容器的资源宽度，避免小图放大模糊。
- 首屏以下图片默认懒加载，使用明确的 width/height 和固定比例减少布局跳动。
- 研究图 5 的原文件为 1,585,008 字节，800px WebP 约 28,744 字节；图 6 原文件为 1,767,975 字节，800px WebP 约 28,538 字节。
- 大学 Logo 原文件约 2.18MB，导航使用的 WebP 约 6.97KB。
- 原 `/intro/1.jpg`、`/intro/2.jpg`、`/intro/3.jpg`、`/research/5.png`、`/research/6.png`、`/Dut.png`、`/logo1.png` 链接仍在构建产物中保留。
- 未引入网站运行时框架、轮播插件或其他重型前端依赖。

## 验证结果

- Hugo 0.157.0 构建成功：中文 84 页、英文 82 页（Hugo 统计包含 XML/JSON 等输出）。
- 生成的 147 个 HTML 文件及 196 个站内链接/资源目标检查通过：无缺失文件、无错误基础路径、无无效锚点。
- 中英文首页、研究列表、两个研究详情、团队、教师详情、论文列表、论文详情、新闻列表、新闻详情、加入页面，在 390px、768px、1440px 下完成 66 组浏览器页面检查。
- 额外在 320px、1080px、1200px 下检查首页、团队和论文，共 15 组边界宽度检查。
- 检查图片加载、唯一 H1、页面描述、对应页语言切换、资源前缀和页面宽度：未发现异常。
- 键盘菜单展开、Tab 进入、Escape 收起与焦点返回通过。
- 轮播验收更新为三图选择、移除完整合影及播放控件、6 秒持续循环、悬停/焦点不中断，以及减少动态效果时无过渡动画。
- 年份与方向交叉筛选、空结果状态、清除筛选通过；无 JavaScript 时导航和论文仍可用。
- 3 位教师、43 位在读学生、0 个虚构校友的页面数量检查通过。
- 92 份人物资料结构化比对通过：原始 front matter 字段及正文内容未改变，仅新增身份字段；部分文件的行尾/结尾换行被编辑器标准化。
- 常规正文/背景对比度：深蓝/白 16.29:1、灰文字/白 6.37:1、灰文字/浅灰 5.97:1、白文字/学术蓝 4.87:1、深蓝链接/浅灰 6.45:1。加深青绿已用于浅灰底小字。
- 另进行了人工截图检查；这不等同于完整的 WCAG 认证。
- 后续按用户要求移除轮播暂停机制，持续自动切换；这项取舍不满足 WCAG 对自动更新内容提供暂停/停止控制的要求。
- `git diff --check` 通过。
- 外部 DOI 未改写。网络工具无法打开抽查的四个 DOI，因此不能把外部出版站可访问性声明为已全部通过。

### 复现命令

构建到临时目录，避免污染已追踪的生成缓存：

```bash
HUGO_RESOURCEDIR=/private/tmp/wilna-redesign/resources HUGO_BUILD_WRITESTATS=false hugo --minify --buildFuture --destination /private/tmp/wilna-redesign/public --cacheDir /private/tmp/wilna-redesign/cache --noBuildLock --cleanDestinationDir --printPathWarnings
python3 scripts/audit-links.py /private/tmp/wilna-redesign/public
```

浏览器检查需要 Playwright 和 Chrome；可通过 `PLAYWRIGHT_MODULE` 指向已有 Playwright 入口，通过 `CHROME_PATH` 指定 Chrome：

```bash
PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node scripts/check-site.mjs /private/tmp/wilna-redesign/public /private/tmp/wilna-redesign/qa
```

本地预览：

```bash
HUGO_RESOURCEDIR=/private/tmp/wilna-redesign/resources HUGO_BUILD_WRITESTATS=false hugo server --bind 127.0.0.1 --port 1313 --baseURL http://127.0.0.1:1313/wilna-site/ --buildFuture --disableFastRender
```

截图和浏览器报告保存在 `/private/tmp/wilna-redesign/qa/`。

## 待补充或核实的真实资料

1. WiMTI、PowerNetMax 项目的已授权系统/实验照片或论文配图，以及图片说明。当前占位会在提供真实资源后替换。
2. 43 位学生的真实头像；尚未提供时保留姓名占位。
3. 声学方向的具体项目、已发表论文和成果链接。现有研究介绍不足以确认该方向的独立成果，未强行归类。
4. 实验室真实学术活动、论文录用和团队消息，需要事件日期、标题及内容；旧 news 数据不足以确认这些事实。
5. AutoDLAR 原始记录中的期刊字段为 ACM Transactions on Sensor Networks，而 BibTeX 写为 Sensors，DOI 为 `10.3390/s24041234`。原始数据未修改，需提供正确书目信息后再更正。
6. AquaKey 页面日期为 2025-03-06，BibTeX 年份为 2024。论文页目前沿用原日期分组，需确认应使用的发表年份。
7. Deeploc 原始记录没有 DOI；原始新闻与论文中的个别作者拼写也不一致。均未擅自改写。

## 设计参考

参考以下站点的栏目组织、研究项目与论文分离、简洁导航及学术图文层级，没有复制代码或外部实验室素材：

- [MIT Signal Kinetics](https://www.media.mit.edu/groups/signal-kinetics/overview/)
- [CMU Future Interfaces Group](https://www.futureinterfaces.com/)
- [CMU WiTech Lab](https://www.witechlab.com/)
