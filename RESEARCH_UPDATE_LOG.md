# WiLNA 研究方向与首页修改记录

日期：2026-09-28

## 修改依据

- 《副本Wilna实验室主页修改报告_副本.docx》。
- 用户提供的“研究方向配图”目录中的四张原图。
- 用户确认正式名称为 WiLNA，全称为 Wireless Lab of Network and Application。

## 已完成

1. 首页及研究方向页统一为四个方向，顺序为多模态感知、通信与网络、协同边缘智能、物理AI系统。
2. 每个方向采用报告指定的一句话说明和具体研究主题；中英文共新增八个详情页面。
3. 声学与无线感知归入多模态感知入口，原详情页及原链接继续有效。
4. 首页更新为“感知 · 连接 · 决策 · 交互”及报告指定简介，显示正式英文全称。
5. 网站文本、页面标题、页脚和无障碍标签中的实验室名称统一为 WiLNA；原 Logo 图形保留。
6. 加入我们页面同步四个方向；配图统一为完整的 4:3 展示，沿用 Hugo 响应式 WebP 和懒加载。
7. 按后续要求，移除新旧研究方向详情页的图片图注文字，保留并恢复卡片及详情页中的示意图；首页全称移至 WiLNA 标题下方，并统一品牌缩写显示为 WiLNA。
8. 按确认的中文详情文案为四个新方向增加“研究目标、具体课题、代表成果”区域，并同步英文内容；成果关联现有项目和 DOI 已核验的论文。
9. 物理 AI 系统代表论文调整为多潜器协同护航、无人机周期覆盖、机械臂手眼与机器人世界坐标联合标定三篇，保持原论文列表布局。
8. 按确认的中文详情文案为四个新方向增加“研究目标、具体课题、代表成果”区域，并同步英文内容；成果关联现有项目和 DOI 已核验的论文。
10. 按最新确认的四方向映射，将首页和对应详情页的代表项目改为 UWBeacon、AquaLink、工业物联网自适应任务卸载、多潜器协同护航；每个方向仅展示对应代表论文。保留既有卡片版式，并将卡片论文入口连接到已核验 DOI。
11. 逐篇检索出版商、作者主页和论文索引，未能访问到这四篇论文的可下载全文或可供选用的原文配图；未用其他论文或示意图替代。待取得 PDF / 作者授权配图后再生成候选图供审核。
12. 本轮 Hugo 构建通过，内部链接审计检查 155 个 HTML 页面与 221 个站内目标且无问题；本机预览中逐页核验中英文首页和四个研究方向的项目名称、对应论文及 DOI。当前 shell 环境缺少 Playwright，完整自动浏览器测试未运行。

## 文件清单

- `hugo.toml`：名称、全称、中英文首页和研究方向简介。
- `data/research.json`：四个方向的中英文内容和研究主题。
- `content/{zh,en}/research/{multimodal-sensing,communications-networks,collaborative-edge-intelligence,physical-ai}.md`：八个新页面。
- `assets/research/`：对应四张 PNG 原图，文件名与上述路由一致。
- `layouts/research/area.html`：新方向详情模板。
- `layouts/index.html`、`layouts/partials/research-card.html`、`layouts/partials/research-overview.html`、`layouts/joinus/joinus.html`：首页与研究入口。
- `assets/css/lab.css`：全称、配图比例、主题列表及详情布局。
- `layouts/partials/{head,header,footer,people-overview}.html`、`layouts/_default/{list,single}.html`、`content/{zh,en}/news/_index.md`：名称统一。
- `scripts/check-site.mjs`：增加四方向顺序、主题、链接、全称和多尺寸回归检查。

## 验证

- Hugo 生产构建通过，中英文页面正常生成。
- 内部链接审计：155 个 HTML 页面、221 个内部目标，零问题。
- 浏览器回归覆盖 90 项页面检查，以及搜索、筛选、分页、语言切换、导航、教师顺序和轮播功能。
- 新研究页面检查 320、390、768、1440px 宽度；检查中英文首页与研究方向截图。
- 本轮已重新核验四篇代表论文的名称、刊物/年份和 DOI；论文库原始条目未修改，仅增加首页与研究方向卡片的关联。

## 发布边界

保持 `/wilna-site/` 基础路径、GitHub Pages 配置及现有中英文路由。本次仅完成本地修改和验证，未推送远程仓库。
