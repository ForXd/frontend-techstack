/** Shared deterministic rules. Used by the website, tests and portable skill CLI. */
export const rankingModes = {
  popularity: "综合热度",
  stars: "GitHub Stars",
  downloads: "npm 周下载量",
};
// Fixed log scales prevent a very large package from overwhelming the other signal.
export function popularityScore(metric) {
  if (
    !Number.isFinite(metric?.stars) ||
    !Number.isFinite(metric?.npm?.downloads)
  )
    return null;
  return (
    50 * Math.min(1, Math.log10(1 + metric.stars) / 6) +
    50 * Math.min(1, Math.log10(1 + metric.npm.downloads) / 9)
  );
}
export function sortTechnologies(items, metrics, mode = "popularity") {
  if (!Object.hasOwn(rankingModes, mode))
    throw new Error("Unknown ranking mode");
  const value = (t) => {
    const m = metrics.entries[t.id];
    return mode === "stars"
      ? m?.stars
      : mode === "downloads"
        ? m?.npm?.downloads
        : popularityScore(m);
  };
  return [...items].sort((a, b) => {
    const av = value(a),
      bv = value(b);
    const aKnown = Number.isFinite(av),
      bKnown = Number.isFinite(bv);
    if (aKnown !== bKnown) return aKnown ? -1 : 1;
    if (aKnown && av !== bv) return bv - av;
    return (
      (metrics.entries[b.id]?.stars ?? -1) -
        (metrics.entries[a.id]?.stars ?? -1) || a.id.localeCompare(b.id, "en")
    );
  });
}

/** Rank complete scenario plans only after role and ecosystem constraints. */
export function recommendRanked(scenarios, options, catalog, metrics) {
  const mode = options.ranking || "popularity";
  const base = recommend(scenarios, options);
  const recipe = scenarios.find((s) => s.id === base.id);
  const lookup = (id) => catalog.technologies.find((t) => t.id === id);
  const ecosystem = options.ecosystem || "any";
  const peerIds = [
    ...new Set([base.primary, ...(recipe.rankingPeers || [recipe.primary])]),
  ];
  const eligible = peerIds
    .map(lookup)
    .filter(
      (t) =>
        t &&
        (!metrics.entries[t.id]?.archived ||
          metrics.entries[t.id]?.activeUpstream) &&
        (ecosystem === "any" ||
          t.ecosystem === "通用" ||
          t.ecosystem === ecosystem) &&
        !(
          ecosystem !== "any" &&
          ["content", "dashboard", "commerce", "saas"].includes(base.id) &&
          t.id !== base.primary
        ) &&
        !(
          base.id === "library" &&
          ecosystem === "Angular" &&
          t.id !== "angular"
        ),
    );
  const ordered = sortTechnologies(eligible, metrics, mode);
  const winner = ordered[0]?.id || base.primary;
  let result = base;
  if (winner !== base.primary) {
    const selected = lookup(winner);
    const candidate = {
      ...recipe,
      primary: winner,
      tools: recipe.tools
        .map((id) => (id === recipe.primary ? winner : id))
        .filter(
          (id) => !(winner === "babylonjs" && id === "react-three-fiber"),
        ),
      reason: `${selected.name} 在符合本场景职责与生态约束的候选中按${rankingModes[mode]}优先。采用条件：${recipe.alternativeReasons[winner] || selected.bestFor}`,
      alternatives: [
        ...new Set([recipe.primary, ...recipe.alternatives]),
      ].filter((id) => id !== winner),
      alternativeReasons: {
        ...recipe.alternativeReasons,
        [recipe.primary]: recipe.reason,
      },
      tradeoff: recipe.tradeoff,
    };
    const frameworkEcosystems = {
      react: "React",
      vue: "Vue",
      angular: "Angular",
      svelte: "Svelte",
      nextjs: "React",
      nuxt: "Vue",
      sveltekit: "Svelte",
    };
    result = recommend(
      scenarios.map((s) => (s.id === recipe.id ? candidate : s)),
      {
        ...options,
        ecosystem:
          ecosystem === "any"
            ? frameworkEcosystems[winner] || "any"
            : ecosystem,
      },
    );
    result.constraints = base.constraints;
  }
  const candidates = ordered.map((t) => {
    const m = metrics.entries[t.id];
    return {
      id: t.id,
      score: popularityScore(m),
      stars: m?.stars ?? null,
      downloads: m?.npm?.downloads ?? null,
      npmPackage: m?.npm?.package ?? null,
      archived: m?.archived ?? false,
      activeUpstream: m?.activeUpstream ?? null,
      starsSourceUrl: m?.starsSourceUrl ?? null,
      downloadsSourceUrl: m?.npm?.sourceUrl ?? null,
    };
  });
  result.ranking = {
    mode,
    updatedAt: metrics.updatedAt,
    period: metrics.period,
    candidates,
    fitPrimary: base.primary,
  };
  result.notes.push(
    `先检查职责与生态，再按${rankingModes[mode]}排序；${ordered.length} 个可比较候选。`,
  );
  for (const candidate of candidates) {
    if (candidate.archived && candidate.activeUpstream)
      result.notes.push(
        `${lookup(candidate.id).name} 已迁移至 ${candidate.activeUpstream}；Stars 是已归档 GitHub 镜像的历史关注数，不能反映迁移后的完整社区规模。`,
      );
  }
  if (!ordered.length)
    result.warnings.push(
      "没有未归档的兼容候选；保留原场景方案供评估，不能视为当前社区推荐。",
    );
  result.alternatives = sortTechnologies(
    result.alternatives.map(lookup),
    metrics,
    mode,
  ).map((t) => t.id);
  result.confidence =
    "采用前用真实项目验证性能、兼容性与维护成本；热度不能代替这些判断。";
  return result;
}
export function filterCatalog(
  catalog,
  { query = "", stage = "all", ecosystem = "all" } = {},
) {
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return catalog.technologies.filter((item) => {
    const stages = [item.stage, ...(item.relatedStages || [])];
    const haystack = [
      item.name,
      item.description,
      item.bestFor,
      item.kind,
      item.ecosystem,
      ...item.tags,
      ...stages.map(
        (id) => catalog.stages.find((s) => s.id === id)?.name || "",
      ),
    ]
      .join(" ")
      .toLocaleLowerCase();
    return (
      (stage === "all" || stages.includes(stage)) &&
      (ecosystem === "all" ||
        item.ecosystem === ecosystem ||
        item.ecosystem === "通用") &&
      terms.every((term) => haystack.includes(term))
    );
  });
}
export function recommend(
  scenarios,
  { scenario = "content", ecosystem = "any", hosting = "any" } = {},
) {
  const recipe = scenarios.find((s) => s.id === scenario);
  if (!recipe) throw new Error(`Unknown scenario: ${scenario}`);
  if (!["any", "React", "Vue", "Svelte", "Angular"].includes(ecosystem))
    throw new Error("Unknown ecosystem");
  if (!["any", "static", "server"].includes(hosting))
    throw new Error("Unknown hosting");
  let tools = [...recipe.tools];
  let primary = recipe.primary;
  const notes = [recipe.reason];
  const warnings = [recipe.tradeoff];
  const native = [
    "mobile-cross-platform",
    "desktop-app",
    "browser-extension",
  ].includes(scenario);
  const framework = {
    React: "react",
    Vue: "vue",
    Svelte: "svelte",
    Angular: "angular",
  }[ecosystem];
  const fullstack = {
    React: "nextjs",
    Vue: "nuxt",
    Svelte: "sveltekit",
    Angular: "angular",
  }[ecosystem];
  if (ecosystem !== "any") {
    if (["content", "commerce", "saas"].includes(scenario)) {
      tools = tools.filter(
        (t) =>
          ![
            "react",
            "vue",
            "svelte",
            "angular",
            "astro",
            "nextjs",
            "nuxt",
            "sveltekit",
          ].includes(t),
      );
      primary = fullstack;
      tools.splice(1, 0, fullstack);
    } else if (tools.includes("react") && ecosystem !== "React") {
      tools = tools.filter((t) => t !== "react");
      tools.splice(1, 0, framework);
      if (primary === "react") primary = framework;
    }
    if (ecosystem !== "React") {
      const replacements = {
        antd: ecosystem === "Vue" ? "element-plus" : "css-modules",
        shadcn: "css-modules",
        zustand: ecosystem === "Vue" ? "pinia" : null,
        "react-hook-form": "tanstack-form",
        "react-flow": "antv-x6",
        "assistant-ui": "ai-sdk",
        "react-three-fiber": null,
        formatjs: "i18next",
        "react-aria":
          ecosystem === "Vue" ? "reka-ui" : "spectrum-web-components",
        radix: ecosystem === "Vue" ? "reka-ui" : "spectrum-web-components",
        excalidraw: null,
      };
      tools = tools
        .map((t) => (Object.hasOwn(replacements, t) ? replacements[t] : t))
        .filter(Boolean);
      if (Object.hasOwn(replacements, primary)) primary = replacements[primary];
      if (scenario === "mobile-cross-platform") {
        tools = tools.filter((t) => !["expo", "react-native"].includes(t));
        tools.push("capacitor");
        primary = "capacitor";
        warnings.push(
          "当前生态采用 Capacitor 复用 Web UI，运行在 WebView；它与 Expo / React Native 的原生 UI 路线不同。如原生 UI 是硬要求，需要重新评估团队生态约束。",
        );
      }
      if (scenario === "accessible-components" && ecosystem !== "Vue")
        warnings.push(
          "当前组合使用开源 Web Components。需验证与目标框架的事件绑定、服务端渲染和交互语义，简单控件仍优先原生 HTML。",
        );
    }
    if (ecosystem === "Angular") {
      tools = tools.filter(
        (t) =>
          ![
            "vite",
            "rollup",
            "testing-library",
            "tanstack-query",
            "vite-pwa",
          ].includes(t),
      );
      warnings.push(
        "Angular 应用优先沿用 CLI 的构建、数据与测试集成；库工程使用 Angular 的库构建流程。第三方 UI / 表单库需核对适配器。",
      );
      if (scenario === "library") {
        primary = "angular";
        tools.push("angular");
      }
      if (scenario === "pwa-offline") {
        primary = "workbox";
        warnings.push(
          "使用 Angular 内置 PWA 能力或自定义 Workbox 二选一，避免注册两套互相竞争的 Service Worker。",
        );
      }
    }
    notes.push(
      `以 ${ecosystem} 作为集成约束；通用引擎仍保留，框架专属组件换成可适配方案。`,
    );
  }
  if (hosting === "static") {
    tools = tools.filter((t) => !["docker", "nginx"].includes(t));

    notes.push(
      native
        ? "静态托管只能用于网站或文档，不能代替原生应用 / 扩展的构建、签名和分发。"
        : "网页交付限定为静态资源；nginx 是开源自托管选项，也可部署到既有静态宿主，服务端能力需独立提供。",
    );
    if (
      [
        "commerce",
        "saas",
        "collaborative-editing",
        "collaborative-whiteboard",
        "instant-messaging",
        "realtime-conferencing",
        "ai-chat",
        "file-upload",
      ].includes(scenario)
    )
      warnings.push(
        "静态托管无法运行本场景所需的服务端能力。同步、鉴权、消息、模型调用或上传签名等必须连接独立后端；若禁止任何后端服务，当前目标不能完整实现。",
      );
    if (tools.some((t) => ["nextjs", "nuxt", "sveltekit", "astro"].includes(t)))
      warnings.push(
        "启用静态生成 / 导出并验证所有路由；SSR、动态服务端 API 与服务端会话不能放在静态托管中。",
      );
  }
  if (hosting === "server" && !native && scenario !== "library") {
    tools = tools.filter((t) => t !== "nginx");
    if (!tools.some((t) => ["docker", "nodejs"].includes(t)))
      tools.push("docker");
    notes.push(
      "服务端可用不代表必须 SSR；先根据内容与数据需求选择。自托管还需健康检查、配置和回滚。",
    );
  }
  if (native)
    warnings.push(
      "网页测试不覆盖全部原生能力或扩展 API；最终交付需要对应目标的真实运行环境。",
    );
  if (
    scenario === "library" &&
    ecosystem !== "any" &&
    !tools.includes(framework)
  )
    tools.push(framework);
  if (scenario === "library")
    notes.push(
      "库包与示例站分开交付：明确包格式、类型声明、peer dependencies 和发布兼容范围。",
    );
  if (
    tools.some((t) =>
      [
        "nextjs",
        "nuxt",
        "sveltekit",
        "astro",
        "angular",
        "expo",
        "wxt",
        "plasmo",
      ].includes(t),
    )
  )
    tools = tools.filter((t) => t !== "vite");
  else if (
    scenario !== "library" &&
    tools.some((t) => ["react", "vue", "svelte"].includes(t)) &&
    !tools.includes("rollup")
  )
    tools.push("vite");
  tools = [...new Set(tools)];
  if (!tools.includes(primary)) tools.unshift(primary);
  const alternatives = recipe.alternatives.filter((id) => id !== primary);
  const alternativeReasons = { ...recipe.alternativeReasons };
  if (primary !== recipe.primary) {
    if (!alternatives.includes(recipe.primary))
      alternatives.unshift(recipe.primary);
    const names = {
      react: "React",
      vue: "Vue",
      svelte: "Svelte",
      angular: "Angular",
      nextjs: "Next.js",
      nuxt: "Nuxt",
      sveltekit: "SvelteKit",
      "antv-x6": "AntV X6",
      "tanstack-form": "TanStack Form",
      "ai-sdk": "AI SDK",
      capacitor: "Capacitor",
      "reka-ui": "Reka UI",
      "spectrum-web-components": "Spectrum Web Components",
      workbox: "Workbox",
    };
    notes[0] = `根据团队熟悉的 ${ecosystem} 生态，当前首选 ${names[primary] || primary}，服务于“${recipe.goal}”。框架专属能力使用相应适配器，避免引入不匹配的 UI 依赖。`;
    alternativeReasons[recipe.primary] =
      `只有愿意放宽当前 ${ecosystem} 生态约束，并接受相关学习或集成成本时，才回到原始场景首选。原始理由：${recipe.reason}`;
  }
  return {
    ...recipe,
    primary,
    alternatives,
    alternativeReasons,
    tools,
    notes,
    warnings,
    constraints: { ecosystem, hosting },
    confidence:
      "这些是场景条件下的编辑推荐，不是通用排名。采用前核对版本、许可、适配器与真实业务样本。",
  };
}
export function recommendationMarkdown(result, catalog) {
  const lookup = (id) => catalog.technologies.find((t) => t.id === id);
  const ranking = result.ranking;
  const evidence = ranking
    ? `## 社区指标与排序\n\n排序：${rankingModes[ranking.mode]}；快照：${ranking.updatedAt}；npm 周期：${ranking.period.start} 至 ${ranking.period.end}。下载次数不等于真实用户数。综合分 = 50 × min(1, log10(1 + stars) / 6) + 50 × min(1, log10(1 + 周下载) / 9)；缺失指标不计零，完整数据优先。\n\n${ranking.candidates.map((m, i) => `${i + 1}. ${lookup(m.id).name} — [${m.stars ?? "未知"} stars](${m.starsSourceUrl || lookup(m.id).repository})；${m.downloads === null ? "npm 未提供" : `[${m.downloads} 次/周](${m.downloadsSourceUrl})（${m.npmPackage}）`}；综合分 ${m.score === null ? "未计算" : m.score.toFixed(1)}`).join("\n")}\n\n仅同职责、兼容候选参与首选竞争；跨层方案仍需单独评估。\n\n`
    : "";
  return `# ${result.name} · 技术选型建议\n\n目标：${result.goal}\n\n约束：生态 ${result.constraints.ecosystem === "any" ? "不限" : result.constraints.ecosystem}；托管 ${{ any: "不限", static: "仅静态", server: "可运行服务端" }[result.constraints.hosting]}\n\n${evidence}## 推荐组合\n\n${result.tools
    .map((id) => {
      const t = lookup(id);
      return `- [${t.name}](${t.url})：${t.kind} — ${t.bestFor}；[源码](${t.repository}) · [${t.license}](${t.licenseUrl})`;
    })
    .join(
      "\n",
    )}\n\n## 理由\n\n${result.notes.map((n) => `- ${n}`).join("\n")}\n\n## 限制与待验证\n\n${result.warnings.map((n) => `- ${n}`).join("\n")}\n\n## 可评估替代\n\n${result.alternatives
    .map((id) => {
      const t = lookup(id);
      return `- [${t.name}](${t.url})：${result.alternativeReasons[id] || t.tradeoff}`;
    })
    .join(
      "\n",
    )}\n\n${result.confidence}\n\n目录核对日期：${catalog.updatedAt}\n`;
}
