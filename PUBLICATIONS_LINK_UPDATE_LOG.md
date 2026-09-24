# 论文链接核验与页面精简记录

日期：2026-09-24。当前修改仅在本地，未提交、推送或发布。本文是后续调整记录，优先于初次导入日志中的页面展示与链接状态描述。

## 完成内容

- 中英文论文页删除标题下简介、PDF 来源免责声明、原始引用展开区、PDF 页码、版本关联与待核实标记。来源与核验信息仍保存在独立数据文件中，不在页面显示。
- 核对旧站 8 篇正式论文：AdapBlinker [5]、AquaKey [43]、AutoDLAR [56]、Minimizing Age of Information [83]、PowerNetMax [26]、Reliable Data Delivery [81]、WiMTI [6] 已收录；补入 Deeploc [264]。删除“原站论文详情”列表，保留原详情路由以免旧链接失效。
- 新闻页删除“历史记录”区域，并删除首页及新闻空状态中指向该区域的入口。
- 中英文指导教师顺序统一为王雷、覃振权、池建成。
- 所有原始 PDF 编号 [1]–[263] 均保留，加上旧站缺失论文，共 264 条。搜索、年份/类型筛选及每页 20 条分页不变。
- 核实并加入 261 个 DOI 地址、2 个官方论文入口；1 条因引用信息冲突暂不链接。标题可点击，DOI 另外明确列出。
- 修正中英文 AutoDLAR 详情及英文旧草稿中的错误 DOI，改为 `10.1145/3607254`。没有改写原有作者信息。

## 核验与去重

使用 Crossref 出版商登记元数据、DataCite、出版社页面、作者论文及会议官方全文核验。自动候选同时比较题名、作者、年份、类型及已有卷期；特殊元数据差异单独复核，证据记录在 `link_verification` 和 `data/publication-link-overrides.json`。

去重规则为“规范化题名相同，而且已核实的规范链接相同”。本轮找到符合条件的重复项 **0 条**，因此未删除任何原始条目。题名相同但 DOI 不同的会议、期刊、预印本版本仍保留。旧站已存在的 7 篇没有再次加入总表，草稿副本不导入。

链接核验不等同于所有出版社全文均可免费访问，也不保证外部网站永久可用。没有使用示例 DOI 给不相关论文套链接。

## 需要确认

1. **[213] 题名冲突，暂不链接**：PDF 题名为 `Connectivity properties of real bittorrent swarms`，作者和卷页却是 Bingxian Lu 等、2014、8(4):1324–1343。[作者官网](https://lubingxian.cn/)将这些作者与卷页列为 `Priority-based Differentiated Service in Spectrum Mobility Game`；[出版社登记元数据](https://api.crossref.org/works/10.3837%2Ftiis.2014.04.010)也确认后一题名及卷页。同名 BitTorrent 论文属于其他作者、2013、7(9):2246–2267。等待确认后再更正题名和添加 DOI，当前保留 PDF 原文。
2. **[33] 作者差异**：题名、期刊、卷期页码与 DOI 对应，但原 PDF 的两位合作者姓名和出版商记录不同；保留原作者，核验理由留档。
3. **[222] 年份差异**：CWSN 会议为 2013，Springer 论文集发表于 2014。沿用原引用的 2013，不静默改年。
4. **[142]、[227]**：未找到可确认 DOI，分别使用 IFIP 官方全文、Old City Publishing 文章页面。
5. 初次导入日志中实验室归属、原文拼写与候选版本等待核实事项仍保留，移除页面标记不意味着已确认这些事实。

## 年份数量

| 年份 | 数量 | 年份 | 数量 |
| --- | ---: | --- | ---: |
| 2026 | 25 | 2016 | 6 |
| 2025 | 15 | 2015 | 14 |
| 2024 | 23 | 2014 | 7 |
| 2023 | 25 | 2013 | 7 |
| 2022 | 23 | 2012 | 6 |
| 2021 | 20 | 2011 | 14 |
| 2020 | 12 | 2010 | 10 |
| 2019 | 16 | 2009 | 5 |
| 2018 | 23 | 2008 | 2 |
| 2017 | 11 | **总计** | **264** |

## 修改文件

- 数据：`data/publications.json`、`data/publication-link-overrides.json`。
- 列表模板：`layouts/partials/papers-overview.html`、`layouts/partials/publication-item.html`。
- 新闻模板：`layouts/news/overview.html`、`layouts/partials/news-feed.html`。
- 教师模板与排序：`layouts/partials/people-overview.html`，`content/zh/people/` 与 `content/en/people/` 下的 `LeiWang.md`、`ZhenquanQin.md`、`JianchengChi.md`。
- 旧 DOI 修复：`content/zh/papers/AutoDLAR.md`、`content/en/papers/AutoDLAR.md`、`content/en/papers/1.md`。
- 样式：`assets/css/lab.css`。
- 核验与测试：`scripts/enrich-publications.py`、`scripts/finalize-publication-links.py`、`scripts/check-publication-data.py`、`scripts/check-publications.mjs`、`scripts/check-site.mjs`。
- 文档：本文件与 `PUBLICATIONS_IMPORT_LOG.md`。初次导入新增文件详见后者。

## 验证结果

- Hugo 0.157.0 正式构建通过；生成 147 个 HTML 页面。
- 静态路径审计通过：197 个内部目标，没有失效路径、缺失锚点或重复 ID。
- 独立 pypdf 校验通过：PDF 指纹、263 个原始编号、原文及原始年份全部一致；追加条目单独标记来源。
- 浏览器 66 次页面检查通过，覆盖中英文首页、研究、教师/成员、论文、新闻、加入页面。
- 核对全部 264 个标题与作者、所有已验证链接、14 页逐页完整性，没有重复渲染。
- 标题/作者/期刊搜索、各年份/类型及组合筛选、空结果、重置、URL 状态、中英文切换、深链接和键盘测试通过。
- 320/390/768/1440px 论文布局与额外 1080/1200px 断点测试通过；无 JavaScript 时全部文献仍可阅读。
- 教师中英文顺序、新闻历史区移除和现有轮播回归测试通过。检查了手机论文页及桌面教师页截图。
- `git diff --check` 通过。测试截图与报告在 `/private/tmp/wilna-publications/qa/`。

## 复现与部署

在项目根目录运行，Python 需有 pypdf（PDF 核对）与 pdfplumber（重新导入）：

```sh
python3 scripts/enrich-publications.py
python3 scripts/finalize-publication-links.py
python3 scripts/check-publication-data.py
hugo --minify --buildFuture --destination /private/tmp/wilna-publications/public
python3 scripts/audit-links.py /private/tmp/wilna-publications/public
PLAYWRIGHT_MODULE=/Users/gugu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs node scripts/check-site.mjs /private/tmp/wilna-publications/public /private/tmp/wilna-publications/qa
```

首次核验需要联网；缓存默认在 `/private/tmp/wilna-doi-cache/`。最终校正脚本必须在联网候选核验之后运行，以应用人工复核与去重规则。不要仅重新运行最初 PDF 导入脚本后就发布，否则会覆盖后续链接数据。

保留现有 Hugo 和 GitHub Pages 工作流、`/wilna-site/` 基础路径及中英文路由。用户确认后再提交源码并按现有工作流发布，本轮没有推送远程仓库。本地预览：`http://127.0.0.1:1313/wilna-site/zh/papers/`。
