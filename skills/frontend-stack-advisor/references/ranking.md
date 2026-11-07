# 社区指标与推荐排序

网站和 agent CLI 使用同一份指标快照与同一套排序规则。热度是采用规模的参考；场景需求、开源许可、兼容性与运行条件仍是先决条件。

## 指标口径

- **Stars**：GitHub 官方仓库 API 的 `stargazers_count`，对应整个源码仓库。多包仓库中的多个库可能共享同一份 Stars，不视为独立用户。
- **采用规模参考**：npm 官方下载 API 给出的一个完整周的下载次数。每个技术选择一个明确的代表 npm 包，保留包名、周期和来源链接。不累加子包，不合并新旧包名。
- **真实用户数**：没有统一、公开、可比的去重统计，因此不展示或编造。下载包含重复安装、CI、间接依赖；Stars 是收藏关注，不是活跃用户。
- CLI（如 shadcn）、框架、组件、浏览器 SDK 与服务端软件的分发方式不同。代表包只用于可复核的参考，不能据此宣称整个项目拥有多少用户。非 npm 分发的 Node.js、Moby、Actions Runner、nginx 标记 npm 未提供。
- LiveKit、mediasoup、Socket.IO 的 npm 指标选浏览器客户端；Stars 为目录所列主项目仓库。TanStack Query/Form 选 React 适配包；Radix 选 Dialog；Spectrum Web Components 选 Button；这些都不是整套生态的总下载量。

官方定义：[GitHub 仓库 API](https://docs.github.com/en/rest/repos/repos#get-a-repository)、[npm 下载 API](https://github.com/npm/registry/blob/main/docs/download-counts.md)。

CodeMirror 的 view 源码已从 GitHub 迁移至 [维护者的新仓库](https://code.haverbeke.berlin/codemirror/view)，依据 [原仓库迁移公告](https://github.com/codemirror/view#readme) 与 npm 包 repository 字段核对。目录使用新源码及许可证地址；GitHub Stars 明确保留为旧镜像的历史关注数，不合并旧版 CodeMirror 5 的 Stars。经人工核验迁移的项目可继续参与推荐，普通归档项目仍排除。`activeUpstream` 必须指向已核对的新仓库，不能仅因希望保留排名而设置。

## 排序算法

默认采用综合热度，也支持单独按 Stars 或 npm 周下载量降序。

```text
综合分 = 50 × min(1, log10(1 + Stars) / 6)
       + 50 × min(1, log10(1 + npm 周下载量) / 9)
```

两项各占 50%，对数刻度减少数量级差异。Stars 在 100 万、周下载在 10 亿附近达到各项上限。权重与上限是本项目的公开编辑规则，不是第三方权威评分。显示保留一位小数，实际排序使用未舍入值。

任何指标缺失时不计零：综合分不计算，有完整数据的项目排前；单项排序也将该项未知值排后。同值或均缺失时按 Stars 降序，再按稳定技术 ID 升序。全目录跨职责的排序是浏览入口，不能视为跨职责替换建议。

## 场景推荐

每个场景在 `rankingPeers` 中明确哪些技术承担可比较的核心职责；先应用用户的生态、部署和目标平台约束，再按选定指标排序。生成完整组合时一并调整生态相关依赖，移除不兼容的适配器。普通归档项目不参与自动首选；有已核验的新维护仓库时，明确标注旧 GitHub 镜像后可保留。

例如：CodeMirror 与 Monaco 可以竞争代码编辑器首选；Socket.IO 是通信传输层，不能凭 Stars 多替换 Matrix 完整 IM 协议客户端；PixiJS 渲染器也不能凭热度替换 Phaser 游戏引擎。只有一个合格候选时不编造排名竞争。跨层方案保留在“什么时候换一种选择”中，说明改变目标的条件。

对已经指定的框架生态，沿用现有框架匹配规则，热度不会将 Vue 产品改为 React。静态部署仍提示完整 IM、协同系统等所需的独立后端。

## 数据刷新

在项目根目录运行（Node.js 22+、已登录的 `gh` CLI）：

```sh
npm run update:metrics
npm run check
npm run build
```

`src/data/metrics-sources.json` 管理代表 npm 包；GitHub 仓库沿用技术目录。更新脚本读取官方 API，统一周下载周期，限制请求频率并缓存成功响应一小时；API 失败则保留此前发布的整份快照。原始数量与逐项采集时间保存在 `src/data/metrics.json`，不改变能力与许可证的核验日期。

`npm run sync` 同步网站公开 JSON、skill 离线快照和 ZIP。构建不依赖外部 API。超过 30 天的快照在网站提示未更新，skill 同样要求说明时效性。本项目没有设置周期刷新任务；运行更新脚本、审核数据并推送 main 后自动部署。
