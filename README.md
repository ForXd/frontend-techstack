# Stack Atlas · 开源前端技术栈图谱

**按开发生命周期查询技术，按真实使用场景选择开源实现。**

[访问网站](https://forxd.github.io/frontend-techstack/) · [Agent Skill](skills/frontend-stack-advisor/SKILL.md) · [贡献指南](CONTRIBUTING.md)

首版覆盖 **101 项开源技术、31 个场景、12 个生命周期阶段**。提供中文全文搜索、生态与阶段筛选、三项技术比较、条件化推荐、Markdown 导出和可离线使用的 agent skill。

## 内容组织

生命周期：需求与工程基础 → 框架与渲染 → 样式与组件 → 状态与数据 → 编译与转换 → 构建与打包 → 规范与质量 → 测试与验证 → 性能与体验 → 发布与交付 → 观测与反馈 → 协作与演进。

一项技术可以关联多个阶段；阶段数字是关联条目数，不能相加作为技术总量。

| 场景类别 | 覆盖方向 |
| --- | --- |
| 产品与工程 | 静态站与内容文档、业务后台、电商、SaaS、组件库与 SDK、多应用协作 |
| 协作与通信 | 协同文档、多人白板、IM、实时音视频、AI 对话 |
| 编辑与数据 | 富文本、代码编辑、节点流程、图表、地图、复杂表单、文件上传、Canvas 编辑 |
| 动效与媒体 | UI 微动效、滚动叙事、2D 游戏、3D 展示、音视频播放 |
| 跨端与架构 | 移动跨端、桌面应用、PWA 离线、浏览器扩展、微前端、国际化、无障碍组件 |

每个方向有明确的场景首选、推荐组合、选择理由、替代条件和实现边界。目录与场景支持综合热度、GitHub Stars、npm 周下载量排序；卡片、详情、比较与 Markdown 导出展示指标及来源。生态与托管约束会调整组合。推荐不等于通用“最佳”；实时系统的后端职责、原生分发流程和框架兼容需要具体评估。

## 只收录开源实现

每个条目附官方资料、源码仓库、已核对的许可证文件和整理日期。免费商业产品、非 OSI 的 source-available 产品和闭源托管平台不进入目录。对带商业业务的项目，只收录开源库本身，例如 Actions Runner、Moby 和 Sentry Browser SDK；不把整个托管服务宣称为开源。

许可证字段描述核心实现；依赖、插件、字体、地图或媒体数据应按实际发行版本复核。特别注意 copyleft 义务，以及 SDK 与服务端的独立许可。目录最近整理：**2026-11-07**。

本站按项目要求发布在 GitHub Pages。Pages 是本站的基础设施，并不因此被收录为开源技术。所有搜索和规则推荐在浏览器本地执行，无登录、后端或模型 API key。

## 社区指标与排序

已接入 101 个仓库的 GitHub Stars 与 97 个代表 npm 包的周下载量。npm 下载量是采用规模参考，**不是真实用户数**；源码复制型组件、SDK 与服务端项目的分发方式不同，不能跨职责推断用户规模。

默认综合热度对两项指标各给 50% 权重并使用对数刻度；缺失值不记零。场景先检查职责与生态兼容，再在可比较候选中选首选。数据保留采集时间、统一统计周期和官方来源；过期快照会提示。详见 [排序方法](docs/ranking.md)。

运行 `npm run update:metrics` 可更新官方指标并同步 skill，需已登录 GitHub CLI。API 失败会保留旧快照；没有设置定时刷新任务。

## Agent Skill

从 [网站下载完整 ZIP](https://forxd.github.io/frontend-techstack/frontend-stack-advisor.zip)，或使用仓库中的 `skills/frontend-stack-advisor` 文件夹。保留内部相对路径，将整份文件夹放入 agent 支持的 skills 目录。例如 Codex：

```sh
git clone https://github.com/ForXd/frontend-techstack.git
mkdir -p ~/.codex/skills
cp -R frontend-techstack/skills/frontend-stack-advisor ~/.codex/skills/
```

如目标目录已存在，先比较本地修改后再更新。

示例请求：

> 使用 $frontend-stack-advisor，给多人协同编辑器推荐开源技术栈。团队熟悉 Vue，要求离线修改、冲突合并、自托管。说明前端、同步、鉴权与持久化边界，并给出替代方案。

无依赖命令行（Node.js 22+）：

```sh
node skills/frontend-stack-advisor/scripts/recommend.mjs --list
node skills/frontend-stack-advisor/scripts/recommend.mjs --scenario game-2d --json
node skills/frontend-stack-advisor/scripts/recommend.mjs --scenario code-editor --ranking stars
node skills/frontend-stack-advisor/scripts/recommend.mjs --scenario collaborative-editing --ecosystem Vue --hosting static
node skills/frontend-stack-advisor/scripts/recommend.mjs --search 协同
```

机器可读资源：[catalog.json](https://forxd.github.io/frontend-techstack/catalog.json)、[scenarios.json](https://forxd.github.io/frontend-techstack/scenarios.json)、[metrics.json](https://forxd.github.io/frontend-techstack/metrics.json)、[llms.txt](https://forxd.github.io/frontend-techstack/llms.txt)。网站和 CLI 使用同一套规则，不调用大模型，结果可复现。Agent 需要结合项目额外约束判断，不能把规则结果当成完整架构审批。

## 本地开发

要求 Node.js 22+、npm、系统 `zip` 命令（macOS / Linux / GitHub Actions 已提供；Windows 可使用 WSL）。

```sh
npm ci
npm run sync
npm run dev
```

打开终端输出的 `/frontend-techstack/` 地址。

```sh
npm run check   # TypeScript、目录/引用/许可证/同步校验、规则与CLI测试
npm run build   # 同步skill及公开数据、类型检查、Vite生产构建
npm run preview
```

实现：React + TypeScript + Vite，原生 CSS，Lucide 图标。没有外部字体、付费 API 或运行时 CDN 依赖。站内 hash 路由兼容 Pages 子路径，筛选和场景约束通过 URL 可分享。

## 维护与发布

- `src/data/catalog.json`：唯一技术目录源。
- `src/data/scenarios.json`：唯一场景配方源。
- `src/data/metrics.json` 与 `metrics-sources.json`：指标快照及代表 npm 包映射。
- `src/engine.mjs`：网站与 portable CLI 共用的检索和选型逻辑。
- `skills/frontend-stack-advisor/SKILL.md`：Agent 决策流程。
- `npm run sync`：生成 skill 的目录、场景索引和规则副本，同时生成 public JSON、llms.txt 和 ZIP。
- `.github/workflows/deploy.yml`：main 推送后检查、构建并发布 GitHub Pages。

不要手动修改生成副本；提交数据或规则修改时同时运行 sync 并提交 skill 的更新。公开数据与 ZIP 在构建时生成。

Fork 后修改 `vite.config.ts` 的 base、README / App / sync 中的仓库与站点地址，在仓库 Settings → Pages 选择 GitHub Actions。

## 许可证

本站代码、原创说明与 skill 使用 [MIT](LICENSE)。第三方技术各自遵守其链接的许可证；收录不代表关联、背书或商标授权。
