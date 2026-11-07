# 开源前端场景索引

整理日期：2026-11-07。以下是能力匹配基线，尚未应用社区热度排序；当前首选请运行 scripts/recommend.mjs，结合 metrics.json 中的指标与约束判断。

## 静态站与内容文档 (content)

- 目标：静态内容优先、可索引、少量客户端交互
- 能力匹配基线（排序前）：[Astro](https://docs.astro.build/en/concepts/islands/)
- 理由：内容可以提前生成 HTML，用 islands 为需要的局部增加交互，部署为静态产物。
- 替代：Nuxt：团队以 Vue 为主，且需要文件路由或未来逐步加入服务端能力时选择；纯静态发布需预生成。；Next.js：已有 React 组件资产，且内容站会演进为复杂应用时选择；先核对静态导出限制。
- 限制：内容更新通常触发重新构建；登录态和实时内容需要独立 API 或服务端部署。

## 业务管理后台 (dashboard)

- 目标：交互效率、团队熟悉度与组件复用
- 能力匹配基线（排序前）：[React](https://react.dev/learn/creating-a-react-app)
- 理由：客户端应用配合独立 API，把服务端缓存交给 Query，把表格和表单交给成熟组件库。
- 替代：Vue：团队更熟悉 Vue 模板和响应式系统，或已有 Element Plus 业务组件资产时选择。；Angular：大型团队更重视统一 DI、路由、表单约定并愿意承担框架学习成本时选择。
- 限制：身份认证和权限判断必须由后端执行；纯 CSR 通常不适合作为公共内容的 SEO 方案。

## 电商与公共产品 (commerce)

- 目标：可索引页面、快速首屏和可靠交易路径
- 能力匹配基线（排序前）：[Next.js](https://nextjs.org/docs/app/guides/static-exports)
- 理由：按路由组合静态生成和服务端能力，为公开页面提供 HTML，为动态业务提供独立处理边界。
- 替代：Nuxt：电商团队和既有组件以 Vue 为主，需要服务端或混合渲染时选择。；SvelteKit：团队已掌握 Svelte，并确认支付、内容和埋点集成满足业务需求时选择。
- 限制：缓存与用户态要严格隔离；支付、库存和订单一致性需要后端系统，前端栈本身不能解决。

## SaaS 与 Web 应用 (saas)

- 目标：清晰的数据边界与稳定的产品交付
- 能力匹配基线（排序前）：[Next.js](https://nextjs.org/docs/app/guides/static-exports)
- 理由：框架统一路由与服务端入口，设计系统支持持续扩展，用运行时校验守住数据边界。
- 替代：Nuxt：已有 Vue 产品与组件资产，希望保留团队技术经验时选择。；SvelteKit：团队具备 Svelte 经验，且需要的第三方组件与部署适配均已验证时选择。
- 限制：租户隔离、授权和审计需要后端设计；静态托管时必须拆出独立 API。

## 组件库与 SDK (library)

- 目标：清晰的公共接口、兼容性和版本管理
- 能力匹配基线（排序前）：[Rollup](https://rollupjs.org/introduction/)
- 理由：以库产物和公共 API 为中心，结合组件状态文档、契约测试和语义化版本发布。
- 替代：Vite：组件库同时需要开发示例站，希望复用 Vite 的库模式与开发服务器时选择。；Rolldown：构建耗时是实测瓶颈，且已验证当前插件与多格式产物兼容时选择。
- 限制：先明确 ESM/CJS、类型声明、peer dependencies 和浏览器目标；仅通过应用构建不代表库产物正确。

## 多应用与团队协作 (monorepo)

- 目标：明确依赖边界、减少重复构建
- 能力匹配基线（排序前）：[Turborepo](https://turborepo.dev/docs)
- 理由：workspace 管理包，任务图管理执行顺序，缓存减少重复工作，变更记录协调共享包发布。
- 替代：Nx：需要更强项目图、生成器、模块边界与统一团队工程治理时选择。；pnpm：仓库规模较小，workspace 与简单脚本已足够，尚不需要任务缓存平台时选择。
- 限制：只有重复任务和跨包协作确实存在时才值得引入；必须正确声明缓存输入、环境变量和产物。

## 协同文档与编辑 (collaborative-editing)

- 目标：把协同数据模型与编辑交互分层
- 能力匹配基线（排序前）：[Yjs](https://docs.yjs.dev/)
- 理由：协同数据首选 Yjs，文档交互使用 Tiptap；共享模型、在线状态、同步传输和鉴权分别设计。强调本地历史与离线数据模型时考虑 Automerge。
- 替代：Automerge：更重视本地优先文档历史与数据同步模型，且可以自建编辑器集成时选择。
- 限制：需验证文档 schema、协同撤销与版本兼容；后端鉴权、共享持久化和同步服务必须设计。撤权无法追回已下载明文或阻止断网设备本地编辑，重连时必须重新鉴权。

## 多人协同白板 (collaborative-whiteboard)

- 目标：把图形交互、协同模型和权限边界分开
- 能力匹配基线（排序前）：[Yjs](https://docs.yjs.dev/)
- 理由：协同模型首选 Yjs，定制图形交互选择框架无关的 Konva；将图形对象、顺序和坐标映射到可合并文档，再设计广播与持久化。
- 替代：Automerge：更重视本地文档历史与离线数据模型，并愿意自建画布数据绑定时选择。；Excalidraw：希望快速嵌入完整手绘白板 UI 且接受 React 组件时选择；它与 Yjs 分属界面和数据层，协作服务仍需独立配置。
- 限制：该组合不是即插即用的多人白板；图形绑定、撤销、权限和同步服务需自行实现。只能静态托管且禁止后端时，应缩减为本地离线白板。撤权无法追回已下载明文。

## IM 与即时通信 (instant-messaging)

- 目标：先确定通信协议和消息可靠性边界
- 能力匹配基线（排序前）：[Matrix JS SDK](https://matrix-org.github.io/matrix-js-sdk/index.html)
- 理由：需要可自托管的完整聊天协议时首选 Matrix JS SDK，复用房间和同步模型；已有业务后端且只需实时事件时用 Socket.IO 自建协议。
- 替代：Socket.IO：已有业务后端，只需要实时事件并愿意自己设计消息协议、补发与去重时选择。
- 限制：必须配套服务端、数据库与设备密钥管理；前端库不能保证鉴权、持久化或可靠投递。Socket.IO 默认至多一次，需补发、去重及幂等；homeserver 许可证独立核对。

## 实时音视频会议 (realtime-conferencing)

- 目标：用现成房间和媒体轨道模型交付 RTC
- 能力匹配基线（排序前）：[LiveKit](https://docs.livekit.io/transport/self-hosting/local/)
- 理由：常规多人音视频首选 LiveKit，SDK 与 SFU 配套，避免从底层媒体信令开始；确需自定义信令和路由时选 mediasoup。
- 替代：mediasoup：需要自定义信令、房间模型与媒体路由，并拥有 RTC 运维经验时选择。
- 限制：开源自托管与 LiveKit Cloud 托管分开选择；生产需要 TURN、令牌鉴权、带宽规划、录制及弱网测试，浏览器模拟测试不能代替真实设备通话。

## 音视频播放 (media-playback)

- 目标：根据内容协议选择播放引擎与控件
- 能力匹配基线（排序前）：[Video.js](https://videojs.org/)
- 理由：通用网站播放器首选 Video.js，便于统一播放界面；DASH/HLS、DRM 与离线媒体要求更强时优先评估 Shaka Player。
- 替代：Shaka Player：明确需要 DASH/HLS、DRM 或离线媒体能力，并能提供许可服务器和内容管线时选择。
- 限制：普通文件可先用原生 audio/video；播放器不负责转码、存储、CDN 和 DRM 授权。Video.js v10 已重写，升级需核对插件；自动播放、编解码与移动设备必须实测。

## 富文本编辑器 (rich-text-editor)

- 目标：扩展文档模型，同时保留 UI 控制权
- 能力匹配基线（排序前）：[Tiptap](https://tiptap.dev/docs/editor/getting-started/overview)
- 理由：常规产品级富文本首选 Tiptap，ProseMirror 模型与扩展接口便于加入表格、提及和自定义块；需要自己组合 React 编辑基础时选择 Lexical。
- 替代：Lexical：团队偏好直接组合 React 编辑基础，愿意自行实现 UI 和复杂导入导出时选择。
- 限制：Tiptap MIT 核心与付费扩展、云服务分开核对；导入导出保真度、内容迁移、XSS 处理和中文输入法都要验证，编辑器不负责文件存储与协作鉴权。

## 代码与配置编辑 (code-editor)

- 目标：按嵌入编辑或完整 IDE 的需求取舍
- 能力匹配基线（排序前）：[CodeMirror](https://github.com/codemirror/dev)
- 理由：产品内嵌 SQL、JSON 和配置编辑首选 CodeMirror，按语言与交互组合扩展；桌面 Web IDE、语言服务和 diff 体验优先时选择 Monaco。
- 替代：Monaco Editor：目标是桌面 Web IDE，必须提供语言服务、diff 和接近 VS Code 的编辑体验时选择；不适用于要求移动支持的场景。
- 限制：编辑器不能安全执行用户代码，运行要隔离沙箱；Monaco 需配置 workers、不直接兼容 VS Code 扩展且官方不支持移动浏览器。

## 流程图与节点编辑器 (node-editor)

- 目标：把图交互与业务执行规则分开
- 能力匹配基线（排序前）：[React Flow](https://reactflow.dev/learn)
- 理由：React 产品首选 React Flow，节点直接复用业务组件并获得连线、缩放与选择交互；需要框架无关 SVG 图编辑和精细连接器时选 AntV X6。
- 替代：AntV X6：需要框架无关的 SVG 图编辑、更精细连接器或复杂业务图模型时选择。
- 限制：图编辑不提供真实工作流执行、权限或一致性；自动布局需另接算法，循环校验、撤销、版本迁移和大图性能要自己设计。React Flow Pro 示例与支持不等于核心库收费。

## 数据可视化与图表 (data-visualization)

- 目标：优先业务可读性，再决定定制深度
- 能力匹配基线（排序前）：[Apache ECharts](https://echarts.apache.org/en/index.html)
- 理由：常规业务图表首选 ECharts，用配置组合图型与交互、降低重复绘制成本；不规则视觉表达和高度定制的数据叙事选择 D3。
- 替代：D3：常规图表配置无法表达目标视觉，需要自己控制比例尺、布局与交互时选择。
- 限制：不要把数据量承诺当成性能结论；按真实数据测量、按需加载并销毁实例。Canvas 图表需补文本或数据表；D3 与框架要明确 DOM 管理边界。

## 地图与地理空间 (geospatial)

- 目标：先确定地图数据来源和坐标体系
- 能力匹配基线（排序前）：[MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/)
- 理由：可定制矢量地图首选 MapLibre GL JS，以开源渲染器独立选择瓦片来源；多投影、OGC 服务和专业 GIS 需求优先选 OpenLayers。
- 替代：OpenLayers：专业 GIS 需要多投影、OGC 地图服务或复杂空间数据格式时选择。
- 限制：渲染库开源不代表地图数据免费；瓦片、字体、地理编码和授权另行解决，不能把公共示例服务当生产承诺。坐标转换、弱设备 GPU 与区域数据适配需要验证。

## AI 对话界面 (ai-chat)

- 目标：将对话 UI、模型连接和工具授权分层
- 能力匹配基线（排序前）：[assistant-ui](https://www.assistant-ui.com/docs)
- 理由：React 对话产品首选 assistant-ui 处理消息与工具展示，配合 AI SDK 统一流式调用；已有自定义 UI 时只用 AI SDK 的对话状态和传输能力即可。
- 替代：AI SDK：已有定制对话 UI，只需流式传输、模型适配和状态管理时使用；也可与 assistant-ui 组合。
- 限制：两者是不同层的方案，也可组合使用；Assistant Cloud 可选，开源组件不等于托管持久化服务。模型密钥、会话授权、工具执行与计费必须在服务端控制。

## 复杂表单与动态字段 (complex-forms)

- 目标：明确字段生命周期和校验责任
- 能力匹配基线（排序前）：[React Hook Form](https://react-hook-form.com/get-started)
- 理由：React 业务表单首选 React Hook Form + Zod，字段数组、受控组件适配与 schema 校验可分别组织；重视跨框架和字段订阅模型时考虑 TanStack Form。
- 替代：TanStack Form：需要跨框架表单逻辑、类型推导与字段级订阅，并愿意自行组织 UI 时选择。
- 限制：前端校验只能改善体验，后端仍须验证和授权；动态字段隐藏后的保留规则、异步校验竞态、草稿恢复和键盘操作要显式设计。

## 文件上传与媒体附件 (file-upload)

- 目标：将上传交互与服务端存储协议对齐
- 能力匹配基线（排序前）：[Uppy](https://uppy.io/docs/)
- 理由：多来源、大文件和可恢复上传首选 Uppy，按后端选择 tus 或 S3 等插件；主要是表单附件和图片预览时选 FilePond。
- 替代：FilePond：主要是普通表单附件和图片预览，希望紧凑集成而非复杂多来源上传时选择。
- 限制：断点续传需要匹配后端；签名 URL、访问控制、服务端文件校验及对象生命周期必须单独实现。远程来源需 Companion；Transloadit 与 Pintura 是独立商业服务或产品。

## UI 交互与微动效 (ui-motion)

- 目标：动画直接跟随组件状态，保留可中断与减弱动态效果
- 能力匹配基线（排序前）：[Motion](https://motion.dev/docs/react)
- 理由：React 产品交互首选 Motion：布局、进出场与手势可直接关联组件状态；无框架的 SVG 与时间线编排可选 Anime.js。简单颜色和透明度过渡先用 CSS。
- 替代：Anime.js：主要需求是框架无关 SVG、对象属性和多段时间线，而非组件布局与手势时选择。
- 限制：动效不能阻塞操作，需支持 prefers-reduced-motion；核心 Motion 开源，Motion+ 付费内容另计。

## 滚动叙事与品牌动画 (scroll-story)

- 目标：精确编排滚动与多段时间线，同时保持内容可读
- 能力匹配基线（排序前）：[Anime.js](https://animejs.com/documentation/)
- 理由：只采用开源实现时，复杂 SVG 与多段时间线首选 Anime.js；用 onScroll 同步滚动进度，用 CSS sticky 组织固定章节。以组件布局和手势为主时选择 Motion。
- 替代：Motion：已有 React/Vue 组件，动画更依赖状态、布局和手势，而非复杂多段时间线时选择。
- 限制：固定章节、尺寸刷新、移动端滚动和减少动态效果需组合设计；动画不能妨碍阅读与键盘操作。

## H5 与 2D 游戏 (game-2d)

- 目标：统一场景、资源加载、输入和游戏循环
- 能力匹配基线（排序前）：[Phaser](https://docs.phaser.io/phaser/getting-started/what-is-phaser)
- 理由：需要完整 2D 游戏结构时首选 Phaser，将场景与游戏生命周期交给框架；仅需自定义精灵渲染而希望自行组织游戏逻辑时选 PixiJS。
- 替代：PixiJS：只需要高效精灵绘制，并愿意自己实现游戏循环、物理和关卡模型时选择。
- 限制：游戏运行状态不宜逐帧塞入 React；资源体积、音频解锁和低端设备要实测，3D 游戏不在 Phaser 的核心范围。

## 3D 展示与 WebGL (web-3d)

- 目标：可控的场景结构、资源预算和交互集成
- 能力匹配基线（排序前）：[Three.js](https://github.com/mrdoob/three.js)
- 理由：自定义 3D 展示首选 Three.js；已有 React 应用可加 React Three Fiber 组织场景组件。需要更多引擎级能力与配套工具时选择 Babylon.js。
- 替代：Babylon.js：需要更完整的引擎能力与配套调试工具，而非自由组合的图形库时选择。
- 限制：React Three Fiber 是可选适配层；模型压缩、纹理预算、GPU 资源释放和无 WebGL 时的替代内容仍需实现，不能仅凭库名保证帧率。

## Canvas 白板与图形编辑 (canvas-editor)

- 目标：以对象模型管理图形交互，分离文档数据和画布呈现
- 能力匹配基线（排序前）：[Konva](https://konvajs.org/docs/)
- 理由：自定义白板交互首选 Konva，图层、命中检测与变换能减少底层 Canvas 工作；重文字和对象式海报编辑可选 Fabric.js。
- 替代：Fabric.js：主要是海报、文字排版、对象选择和 SVG 编辑，重于自定义场景图时选择。
- 限制：两者都不自动提供完整协作白板；撤销重做、持久化、多人同步和键盘操作需建模，画布对象不能直接替代可访问 DOM。

## 移动原生与跨端应用 (mobile-cross-platform)

- 目标：以原生体验为目标复用 React / TypeScript 开发能力
- 能力匹配基线（排序前）：[Expo](https://docs.expo.dev/)
- 理由：新建 React Native 应用首选 Expo，将路由、设备 API 与开发构建组织起来；主要目标是复用现有 Web 页面时改用 Capacitor 的 WebView 容器。
- 替代：Capacitor：现有 Web 界面复用优先，接受 WebView 路线，原生 UI 并非硬要求时选择。
- 限制：原生 UI 与 WebView 路线不同；需真机测试、原生签名和商店分发。Expo 框架开源，云构建等 Expo Services（原 EAS）单独核算，静态托管只适用于 Web 产物。

## 跨平台桌面应用 (desktop-app)

- 目标：复用 Web UI，同时明确前端与系统权限边界
- 能力匹配基线（排序前）：[Tauri](https://v2.tauri.app/start/)
- 理由：接受 Rust 与系统 WebView 差异的桌面工具首选 Tauri，无需随应用捆绑完整 Chromium；必须统一 Chromium 或深度依赖 Node 生态时选 Electron。
- 替代：Electron：需要统一 Chromium 行为或深度依赖 Node 原生模块，接受更大运行时分发与维护成本时选择。
- 限制：Tauri 不是纯浏览器运行环境，系统调用需 capability 与命令约束；两种路线都要处理签名、安装包、更新与平台测试，网页静态部署不能替代桌面分发。

## PWA 与离线 Web 应用 (pwa-offline)

- 目标：明确缓存策略、更新提示和离线可用范围
- 能力匹配基线（排序前）：[Vite PWA](https://vite-pwa-org.netlify.app/guide/)
- 理由：Vite 工程首选 Vite PWA 集成 manifest 与 Service Worker；它使用 Workbox，非 Vite 或需要精细控制时直接用 Workbox 组织策略，而不是叠加两套生成流程。
- 替代：Workbox：不是 Vite 工程，或需要自行维护 Service Worker 和细粒度缓存策略时直接使用。
- 限制：可安装不等于所有功能离线可用；登录数据、缓存过期、更新时机和离线写入冲突需单独设计，浏览器支持也有差异。

## 浏览器扩展 (browser-extension)

- 目标：为多个浏览器生成正确的扩展入口和清单
- 能力匹配基线（排序前）：[WXT](https://wxt.dev/guide/introduction.html)
- 理由：跨框架扩展开发首选 WXT，Vite 集成与入口约定便于组织 popup、content script 和 background；偏好 React 与 Plasmo 约定的团队可选择 Plasmo。
- 替代：Plasmo：团队以 React 为主，并偏好 Plasmo 的内容脚本 UI、消息和存储约定时选择。
- 限制：扩展发布需要商店审核与权限说明；后台生命周期、消息边界、CSP 和各浏览器 API 要真实验证，普通网页 E2E 不能覆盖全部扩展行为。

## 微前端与独立发布 (microfrontends)

- 目标：让独立团队交付边界对应可独立发布的应用
- 能力匹配基线（排序前）：[single-spa](https://single-spa.js.org/docs/getting-started-overview/)
- 理由：需要跨框架应用挂载与路由编排时首选 single-spa；如果真正需求是运行时共享组件或模块，选择 Module Federation。两者职责不同，可以组合但不应默认叠加。
- 替代：Module Federation：真正需求是跨应用运行时共享组件或模块，而非顶层应用挂载编排时选择；两者可组合。
- 限制：没有独立团队与发布需求时先用普通模块或 monorepo；全局样式、共享依赖、远端失败、登录与回滚均需契约，微前端本身不是安全沙箱。

## 国际化与多语言产品 (internationalization)

- 目标：将消息内容和区域格式从业务组件中分离
- 能力匹配基线（排序前）：[i18next](https://www.i18next.com/overview/getting-started)
- 理由：多框架业务应用首选 i18next，语言回退、资源加载与适配生态便于逐步接入；重视 ICU 消息格式与静态提取流程时选择 FormatJS / React Intl。
- 替代：React Intl（FormatJS）：React 团队需要 ICU 消息规范、静态提取和 Intl 组件，愿意统一消息编写约定时选择。
- 限制：库不能替代翻译工作；还要验证长文案、RTL、时区、复数和服务端请求的语言隔离，公开多语言站点需额外设计 URL 与 SEO。

## 无障碍组件与设计系统 (accessible-components)

- 目标：在保留视觉定制的同时复用成熟的交互语义
- 能力匹配基线（排序前）：[React Aria](https://react-aria.adobe.com/)
- 理由：React 中需要复杂交互和国际化行为时首选 React Aria，组件与 hooks 提供可定制的语义和焦点行为；按需引入对话框、菜单等基础原语可选 Radix。
- 替代：Radix Primitives：需要逐步引入弹窗、菜单等基础原语，并已有自己的样式与设计系统时选择。
- 限制：原语不会自动保证整站无障碍；业务组合、标签、对比度和错误提示仍由团队负责，axe 自动检查之外必须做键盘与读屏验证。
