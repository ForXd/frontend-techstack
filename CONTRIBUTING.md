# 贡献指南

欢迎通过 Pull Request 增补开源技术、场景配方和已有内容的纠错。

## 收录原则

1. 只收录明确开源的实现。免费、自定义商业许可、source-available 或源码可见不自动等于开源。
2. 附维护者官方文档、源码仓库和 LICENSE 链接。多个包或开源核心/商业服务混合时，限定条目的具体范围。
3. 写清职责、适用条件和限制；推荐理由为编辑判断。不要使用无来源的“最快”“最流行”等结论或捏造性能数据。
4. 限制说明需要能影响决策，例如静态部署限制、移动端支持、适配器、后端责任或许可证边界。
5. 使用 `reviewedAt` 记录实际核对日期；不要批量刷新日期来冒充重新核验。

## 修改流程

编辑 `src/data/catalog.json` 或 `src/data/scenarios.json`。技术 ID 保持稳定；场景引用已有技术 ID。新增开源许可证若不在校验白名单内，先核对官方条款，再更新 `scripts/validate.mjs`。

运行：

```sh
npm ci
npm run sync
npm run check
npm run build
```

数据/规则改动时，将生成的 `skills/frontend-stack-advisor/references/` 与 `scripts/engine.mjs` 一起提交。不要提交 node_modules、dist、凭据或 `.oil-ui` 过程资料。

对改变选型结论的规则增加行为测试，例如部署约束、生态兼容或开源范围。界面变化请在桌面和手机验证搜索、详情、比较、推荐与导出。

PR 说明修改的事实或决策、来源链接、核对日期与完成的验证。维护者可以根据场景覆盖和证据充分度调整推荐；星数和推广请求不能代替依据。
