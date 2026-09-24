# Publications 文献整合记录

> 本文件记录最初 PDF 导入阶段。后续 DOI 核验、旧站合并和页面删减的当前结果见 [PUBLICATIONS_LINK_UPDATE_LOG.md](PUBLICATIONS_LINK_UPDATE_LOG.md)；以下 263 条、空链接和审计信息展示描述仅代表最初阶段。

日期：2026-09-24。仅修改本地源码；本次未提交、推送或发布。

## 项目检查与实施范围

- 当前项目是 Hugo 源码，主题为 blist，现有视觉使用自定义 `assets/css/lab.css`、Hugo partials 和原生 JavaScript；没有重建网站或引入前端框架。
- 原论文列表由中英文 `content/*/papers/` 的 8 篇 Markdown 驱动，支持年份/方向筛选，没有完整文献数据、关键词搜索或分页。
- 本次仅将完整文献列表改为独立 JSON 驱动。保留 `/zh/papers/`、`/en/papers/`、全部原论文详情路由、首页精选模块、研究页相关论文及已有图片。
- 未修改 `hugo.toml`、`/wilna-site/` 基础路径、GitHub Pages 配置或工作流。来源 PDF 未复制到公开网站。

## 数据来源与处理

- 来源：`LeiWang-publications-with-corr-4.pdf`，19 页，编号 [1]–[263]。
- 独立数据文件：`data/publications.json`。保留原始编号、标题、完整作者、年份、期刊/会议、卷、期、页码、文章号、预印本编号、文献类型、编者身份、来源页码、原始断行引用和清理后的完整引用。
- `source.sha256` 记录原 PDF 指纹；`raw_reference` 保留 PDF 提取原文，`citation` 用于页面展示。
- 使用 pdfplumber 的文字及斜体信息区分标题与出版物名；使用 pypdf 独立提取结果逐条核对全部编号、文字及年份。
- 人工复核行尾断词清单，恢复 algorithm、shipping、Zhenggang、Zhongwei、INFOCOM 等；保留 edge-enabled、motif-guided、Yu-Kwong 等真实连字符。
- 恢复 Noël、Télécommunications 等重音字符，处理 PDF 连字；确保 `Md. Jalil Piran` 和 `Md. Ershadul Haque` 不被误当作作者/标题分界。
- 标题、作者及缩写大小写沿用 PDF，不改写为推测的品牌拼法或标题式大小写。文件名的 “corr” 不足以推断通讯作者，未添加通讯作者身份。
- PDF 不含 DOI、网址或链接注释：所有记录的 `doi`、`url` 留空，`link_verified=false`。没有从旧站不一致的引用中自动迁移 DOI，也没有生成猜测链接。
- 不删除疑似重复；版本关联为待核实的候选关系，不代表已经确认是扩展版。

## 各年份数量

| 年份 | 数量 | 原编号 |
| --- | ---: | --- |
| 2026 | 25 | 1–25 |
| 2025 | 14 | 26–39 |
| 2024 | 23 | 40–62 |
| 2023 | 25 | 63–87 |
| 2022 | 23 | 88–110 |
| 2021 | 20 | 111–130 |
| 2020 | 12 | 131–142 |
| 2019 | 16 | 143–158 |
| 2018 | 23 | 159–181 |
| 2017 | 11 | 182–192 |
| 2016 | 6 | 193–198 |
| 2015 | 14 | 199–212 |
| 2014 | 7 | 213–219 |
| 2013 | 7 | 220–226 |
| 2012 | 6 | 227–232 |
| 2011 | 14 | 233–246 |
| 2010 | 10 | 247–256 |
| 2009 | 5 | 257–261 |
| 2008 | 2 | 262–263 |
| **合计** | **263** | **1–263，无缺号** |

类型：期刊论文 133、会议论文 108、海报 8、海报/演示 3、预印本 3、编者按/致辞 3、编著论文集 4、书籍章节 1。类别均根据原引用判断，短篇论文不自动断言为海报。

## 页面功能

- 年份倒序，同年按原编号升序；默认每页 20 条，共 14 页，末页 3 条。
- 支持标题、完整作者、期刊/会议关键词组合搜索，忽略大小写、常见标点和重音差异。
- 年份和文献类型可组合筛选，显示结果总数、当前范围、空结果状态及清除筛选。
- 支持上一页、下一页和页码选择；筛选条件变化后回到第一页。
- URL 保留搜索、年份、类型、页码；刷新和中英文切换不会丢失筛选。
- 每条可展开原始引用并查看 PDF 页码；相关版本链接会打开对应分页并聚焦条目。
- 模板静态输出全部 263 条，脚本只控制可见条目，不重复插入 DOM；无 JavaScript 时仍可阅读全部文献。
- 保留旧站详情链接，单独放入“原站论文详情”折叠区，不叠加为 8 条额外书目。

## 待人工核实

1. **实验室归属 [15]–[20]**：作者列表没有 Lei Wang，保留并逐条标记。其他条目出现 Lei Wang 也不意味着所有作者或成果均已确认归属于实验室。
2. **细分类别**：[84]、[103]、[104]、[173]、[176]、[177]、[179]、[242]–[245]、[255]、[260]、[261] 篇幅较短，PDF 未明确它们是海报、演示或短论文；暂按会议论文保留。[128]、[157]、[158] 来自 Posters and Demos 合集，具体是哪一种也需核实。
3. **原文拼写 [184]**：PDF 本身写作 “Gatewaying thewireless sensor networks”，保留并标记；未经授权没有把源文献错误静默改为另一标题。
4. **同名不等于重复**：[233]、[234] 都是 Guest editorial，但期次与页码不同；[108]–[110] 是三个不同分册，均保留。
5. **旧站与 PDF 元数据差异**：Adapblinker、Wimti 在 PDF 为 2026，旧站为 2025；Aquakey 在 PDF 为 2024，旧站页面日期为 2025；Autodlar 在 PDF 为 ACM Trans. Sens. Networks 20(4)，旧站 BibTeX/DOI 存在不一致。新完整列表以 PDF 为准，旧详情与首页精选内容暂未擅改，需进一步核实出版商记录。
6. **外链**：未来提供并核实 DOI 或出版商地址后再补充；当前新目录没有外部论文链接。

### 候选版本关联（19 组）

| 原编号 | 关联依据，均待核实 |
| --- | --- |
| 78 / 87 | Dbfed，会议与 CoRR 同名 |
| 173 / 181 | Load-balancing，会议与 CoRR 同名 |
| 147 / 192 | Traffic flow，期刊与 CoRR 题名相近 |
| 55 / 102 | Precise wireless charging，期刊与会议同名 |
| 99 / 136 | Trading off charging and sensing，期刊与会议同名 |
| 221 / 226 | Overlapping clustering，同名但作者列表不同 |
| 262 / 263 | Nettopo，题名仅大小写不同 |
| 184 / 225 | Gatewaying，题名空格不同、作者不同 |
| 72 / 151 | 3-D charging schedule，题名及作者相近 |
| 75 / 155 | Period-area coverage，题名及作者相近 |
| 120 / 154 | Directional charging delay，题名及作者相近 |
| 53 / 139 | Fresnel diffraction charging，题名及作者相近 |
| 50 / 156 | Fresnel zones charging，主题及作者相近 |
| 195 / 209 | Acoustic localization，海报与会议论文可能相关 |
| 231 / 237 | Heating system，海报与会议论文可能相关 |
| 228 / 253 / 259 | Proportional fairness backoff，题名及作者相近 |
| 164 / 191 | Multiple-AP association，题名及作者相近 |
| 215 / 245 | Sleep scheduling / geographic routing，题名及作者相近 |
| 220 / 260 | Contention-resolution backoff，题名及作者相近 |

## 修改文件

| 文件 | 用途 |
| --- | --- |
| `data/publications.json` | 263 条完整结构化记录 |
| `data/publication-overrides.json` | 可追溯的断词处理、特殊标记及版本关系 |
| `data/publication_ui.json` | 中英文界面和类型标签 |
| `layouts/partials/papers-overview.html` | 数据驱动列表、搜索筛选、分页控件 |
| `layouts/partials/publication-item.html` | 文献、完整作者、标记、引用及关联链接 |
| `assets/js/publications.js` | 检索、分页、URL 状态、语言切换与锚点 |
| `assets/css/lab.css` | 延用设计系统的响应式文献样式 |
| `content/en/papers/_index.md` | 英文独立页面描述 |
| `content/zh/papers/_index.md` | 中文独立页面描述 |
| `scripts/import-publications.py` | 可重复运行的 PDF 数据导入 |
| `scripts/check-publication-data.py` | 编号、年份、字段及源 PDF 交叉验证 |
| `scripts/check-publications.mjs` | 文献页面浏览器测试 |
| `scripts/check-site.mjs` | 原站回归检查接入新文献测试 |
| `PUBLICATIONS_IMPORT_LOG.md` | 本记录与维护/部署说明 |

## 验证与复现

- Hugo 构建成功；147 个 HTML、197 个内部链接/资源目标静态检查通过。
- 263 个原编号及各年份数量通过；独立 PDF 提取器逐条原文比对通过。
- 现有全站 66 组页面检查及 15 组边界宽度检查通过，无 JavaScript 报错或本地资源 404。
- 新增中英文文献专项测试通过：全部标题/完整作者与 JSON 一致，14 页合计 263 个唯一编号，无遗漏或重复渲染。
- 全部 19 个年份和 8 类文献筛选、标题/作者/会议搜索、重音搜索、组合筛选、空结果、重置、翻页、异常 URL 页码、刷新、中英文保留条件、相关条目跳转与键盘操作通过。
- 中英文 320px、390px、768px、1440px 布局检查通过；已人工检查桌面与手机截图。
- 无 JavaScript 时 263 条记录仍全部可见。新目录未渲染任何未核实的外部论文链接。
- 本地 Hugo 预览已重启，`/wilna-site/zh/papers/` 返回 200，HTML 含 263 条记录及新脚本。
- `git diff --check` 通过。截图及浏览器报告位于 `/private/tmp/wilna-publications/qa/`。

```bash
python3 scripts/check-publication-data.py
HUGO_RESOURCEDIR=/private/tmp/wilna-redesign/resources HUGO_BUILD_WRITESTATS=false hugo --minify --buildFuture --destination /private/tmp/wilna-publications/public --cacheDir /private/tmp/wilna-redesign/cache --noBuildLock --cleanDestinationDir --printPathWarnings
python3 scripts/audit-links.py /private/tmp/wilna-publications/public
PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node scripts/check-site.mjs /private/tmp/wilna-publications/public /private/tmp/wilna-publications/qa
git diff --check
```

PDF 交叉验证需要 pypdf；重新导入需要 pdfplumber。正常 Hugo 构建不需要 Python 或 PDF，也不依赖用户电脑中的源文件路径。

```bash
python3 scripts/check-publication-data.py --pdf /path/to/LeiWang-publications-with-corr-4.pdf
python3 scripts/import-publications.py /path/to/LeiWang-publications-with-corr-4.pdf
```

## 后续维护与部署

1. 日常新增文献直接编辑 `data/publications.json` 的 `publications` 数组，为新记录分配新的唯一编号，填写原始信息，不改动原 [1]–[263]。沿用已有记录字段，不知道的字符串留空、列表留空数组。
2. 只有在核实外链后填写 `doi`（不含 URL 前缀）或 HTTPS `url`，并设 `link_verified=true`。标题不会在没有已验证出版商 URL 时生成猜测链接。
3. PDF 导入脚本是本批数据的重建工具，会覆盖输出数据；新增手工记录后不要直接对正式 JSON 重跑导入，应使用 `--output /private/tmp/reimport.json` 比对。新增条目后同步扩展数量验收，不要删除原始来源的编号检查。
4. 本地 `hugo server --baseURL http://127.0.0.1:1313/wilna-site/` 可预览 `/zh/papers/` 与 `/en/papers/`。生产构建继续沿用仓库 `baseURL`。
5. 当前源码在 `codex/github-pages-source`。发布前提交数据、模板、脚本、样式和日志，再推送源码分支。
6. 源码分支推送本身不等于线上发布。现有工作流自动触发分支为 `main` 和 `codex/github-pages-fix`；此前部署使用静态发布分支。应沿用已确认的部署方式，把生产构建输出部署到现有 Pages 目标，不能把本地预览地址的构建产物发布，也不要直接把源码覆盖到静态分支。
7. 本次没有修改部署设置或推送任何分支。实际发布前需检查 GitHub 上当前 Pages 来源，发布后验证 `/wilna-site/zh/papers/`、`/wilna-site/en/papers/` 及对应 CSS/JS 返回 200。
