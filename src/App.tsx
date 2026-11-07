import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Code2,
  Copy,
  Download,
  ExternalLink,
  GitCompareArrows,
  GitBranch as Github,
  Layers3,
  Menu,
  Search,
  SlidersHorizontal,
  Sparkles,
  Terminal,
  X,
  Compass,
  CircleHelp,
  Network,
  Package,
  LayoutDashboard,
  Store,
  CheckCheck,
} from "lucide-react";
import catalog from "./data/catalog.json";
import scenarios from "./data/scenarios.json";
import { filterCatalog, recommend, recommendationMarkdown } from "./engine.mjs";

type Tech = (typeof catalog.technologies)[number];
type View = "catalog" | "scenarios" | "skill";
const repo = "https://github.com/ForXd/frontend-techstack";
const base = import.meta.env.BASE_URL;
const byId = (id: string) => catalog.technologies.find((t) => t.id === id)!;
const stageName = (id: string) =>
  catalog.stages.find((s) => s.id === id)?.name || id;
const colors = [
  "#387eb2",
  "#227458",
  "#a36b35",
  "#695cb2",
  "#a75668",
  "#227c83",
];
const favorites = ["react", "vue", "nextjs", "astro", "vite", "typescript"];
function download(name: string, content: string) {
  const url = URL.createObjectURL(
    new Blob([content], { type: "text/markdown;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Mark({ tech, small = false }: { tech: Tech; small?: boolean }) {
  const i = catalog.stages.findIndex((s) => s.id === tech.stage);
  const labels: Record<string, string> = {
    react: "⚛",
    vue: "V",
    nextjs: "N",
    astro: "A",
    vite: "ϟ",
    typescript: "TS",
    angular: "A",
    svelte: "S",
    pnpm: "pn",
    webpack: "W",
  };
  return (
    <span
      aria-hidden="true"
      className={`tech-mark ${small ? "small" : ""}`}
      style={
        {
          "--mark-color": colors[(i + tech.name.length) % colors.length],
        } as React.CSSProperties
      }
    >
      {labels[tech.id] || tech.name.replace(/[^a-zA-Z]/g, "").slice(0, 2)}
    </span>
  );
}
function Modal({
  title,
  children,
  close,
  wide = false,
  message,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
  wide?: boolean;
  message?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current!;
    el.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      el.close();
      document.body.style.overflow = old;
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "wide" : ""}`}
      aria-label={title}
      onCancel={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="modal-content">
        <div className="modal-top">
          <span className="eyebrow">STACK ATLAS / {title}</span>
          <button
            className="icon-button"
            onClick={close}
            aria-label="关闭弹窗"
            autoFocus
          >
            <X size={20} />
          </button>
        </div>
        {children}
        {message && (
          <p className="modal-status" role="status">
            {message}
          </p>
        )}
      </div>
    </dialog>
  );
}

export default function App() {
  const getView = (): View =>
    ["catalog", "scenarios", "skill"].includes(location.hash.slice(1))
      ? (location.hash.slice(1) as View)
      : "catalog";
  const params = new URLSearchParams(location.search);
  const [view, setView] = useState<View>(getView);
  const [query, setQuery] = useState(params.get("q") || "");
  const [stage, setStage] = useState(
    catalog.stages.some((s) => s.id === params.get("stage"))
      ? params.get("stage")!
      : "all",
  );
  const [eco, setEco] = useState(
    ["all", "React", "Vue", "Svelte", "Angular"].includes(
      params.get("eco") || "",
    )
      ? params.get("eco")!
      : "all",
  );
  const [compare, setCompare] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);
  const [detail, setDetail] = useState<Tech | null>(
    catalog.technologies.find((t) => t.id === params.get("tech")) || null,
  );
  const [toast, setToast] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [scenario, setScenario] = useState(
    scenarios.some((s) => s.id === params.get("scenario"))
      ? params.get("scenario")!
      : "content",
  );
  const [preference, setPreference] = useState(
    ["any", "React", "Vue", "Svelte", "Angular"].includes(
      params.get("preference") || "",
    )
      ? params.get("preference")!
      : "any",
  );
  const [hosting, setHosting] = useState(
    ["any", "static", "server"].includes(params.get("hosting") || "")
      ? params.get("hosting")!
      : "any",
  );
  const [scenarioQuery, setScenarioQuery] = useState("");
  const [scenarioGroup, setScenarioGroup] = useState("all");
  const [limit, setLimit] = useState(24);
  useEffect(() => setLimit(24), [query, stage, eco]);
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onHash = () => {
      setView(getView());
      setMobileNav(false);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        location.hash = "catalog";
        setTimeout(() => searchRef.current?.focus(), 0);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    const p = new URLSearchParams();
    if (query) p.set("q", query);
    if (stage !== "all") p.set("stage", stage);
    if (eco !== "all") p.set("eco", eco);
    if (detail) p.set("tech", detail.id);
    if (view === "scenarios") {
      p.set("scenario", scenario);
      if (preference !== "any") p.set("preference", preference);
      if (hosting !== "any") p.set("hosting", hosting);
    }
    history.replaceState(
      null,
      "",
      `${location.pathname}${p.size ? "?" + p : ""}#${view}`,
    );
  }, [query, stage, eco, detail, view, scenario, preference, hosting]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);
  const currentStage = catalog.stages.find((s) => s.id === stage);
  const results = useMemo(() => {
    const data = filterCatalog(catalog, {
      query,
      stage,
      ecosystem: eco,
    }) as Tech[];
    return stage === "all" && !query
      ? data.sort(
          (a, b) =>
            (favorites.includes(a.id) ? favorites.indexOf(a.id) : 99) -
            (favorites.includes(b.id) ? favorites.indexOf(b.id) : 99),
        )
      : data;
  }, [query, stage, eco]);
  const recommendation = useMemo(
    () => recommend(scenarios, { scenario, ecosystem: preference, hosting }),
    [scenario, preference, hosting],
  );
  const prerequisite =
    hosting === "static"
      ? recommendation.warnings.find((w: string) =>
          w.includes("静态托管无法"),
        ) ||
        recommendation.notes.find((w: string) => w.includes("不能代替原生")) ||
        recommendation.warnings.find((w: string) => w.includes("静态生成"))
      : undefined;
  function toggleCompare(id: string) {
    setCompare((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) {
        setToast("最多比较 3 项，请先移除一项。");
        return prev;
      }
      return [...prev, id];
    });
  }
  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setToast(`已复制${label}`);
    } catch {
      setToast("复制未完成，请使用下载按钮或手动选择文本。");
    }
  }
  function selectStage(id: string) {
    setStage(id);
    setMobileNav(false);
    location.hash = "catalog";
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  const countStage = (id: string) =>
    catalog.technologies.filter(
      (t) => t.stage === id || t.relatedStages.includes(id),
    ).length;
  const selectedTechs = compare.map(byId);
  const card = (tech: Tech) => (
    <article className="tech-card" key={tech.id}>
      <div className="card-heading">
        <Mark tech={tech} />
        <div>
          <button className="tech-title" onClick={() => setDetail(tech)}>
            {tech.name}
            <ArrowUpRight size={16} />
          </button>
          <span className="kind">
            {tech.kind}{" "}
            <a
              className="license-link"
              href={tech.licenseUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`${tech.name} 许可证 ${tech.license}`}
            >
              {tech.license}
            </a>
          </span>
        </div>
        <span className="eco-label">{tech.ecosystem}</span>
      </div>
      <p className="card-description">{tech.description}</p>
      <div className="fit-line">
        <span>适合</span>
        <p>{tech.bestFor}</p>
      </div>
      <div className="card-bottom">
        <button className="stage-tag" onClick={() => selectStage(tech.stage)}>
          {stageName(tech.stage)}
        </button>
        <button
          className={`compare-button ${compare.includes(tech.id) ? "selected" : ""}`}
          aria-pressed={compare.includes(tech.id)}
          aria-label={`${compare.includes(tech.id) ? "移除" : "加入"} ${tech.name} 比较`}
          onClick={() => toggleCompare(tech.id)}
        >
          {compare.includes(tech.id) ? (
            <Check size={14} />
          ) : (
            <GitCompareArrows size={14} />
          )}{" "}
          {compare.includes(tech.id) ? "已加入" : "比较"}
        </button>
      </div>
    </article>
  );
  return (
    <>
      <a
        href="#main"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        跳到主要内容
      </a>
      <header className="topbar">
        <a className="brand" href="#catalog">
          <span className="brand-icon">
            <Layers3 size={22} />
          </span>
          <span>
            Stack Atlas<span className="brand-sub">前端技术栈图谱</span>
          </span>
        </a>
        <nav aria-label="主导航">
          {(
            [
              ["catalog", "技术目录"],
              ["scenarios", "场景选型"],
              ["skill", "Agent Skill"],
            ] as const
          ).map(([id, label]) => (
            <a key={id} className={view === id ? "active" : ""} href={`#${id}`}>
              {label}
              {id === "skill" && <span className="nav-badge">SKILL</span>}
            </a>
          ))}
        </nav>
        <a className="github-link" href={repo} target="_blank" rel="noreferrer">
          <Github size={18} />
          <span>GitHub</span>
          <ArrowUpRight size={14} />
        </a>
      </header>
      <div className="app-shell">
        <aside
          className={`sidebar ${mobileNav ? "open" : ""}`}
          aria-label="生命周期导航"
        >
          <div className="sidebar-label">
            探索技术栈 <span>EXPLORE</span>
          </div>
          <button
            className={`all-stages ${stage === "all" && view === "catalog" ? "active" : ""}`}
            onClick={() => selectStage("all")}
          >
            <Compass size={17} />
            全部技术<span>{catalog.technologies.length}</span>
          </button>
          <div className="sidebar-label phase-label">
            开发生命周期 <span>12 STAGES</span>
          </div>
          <div className="stages">
            {catalog.stages.map((s, i) => (
              <button
                key={s.id}
                className={`stage-nav ${stage === s.id && view === "catalog" ? "active" : ""}`}
                onClick={() => selectStage(s.id)}
              >
                <span className="stage-number">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{s.name}</span>
                <span className="stage-count">{countStage(s.id)}</span>
              </button>
            ))}
          </div>
          <div className="sidebar-bottom">
            <span className="live-dot" />
            开放知识，持续演进<p>为开发者，也为 AI Agent。</p>
            <a
              href={`${repo}/blob/main/CONTRIBUTING.md`}
              target="_blank"
              rel="noreferrer"
            >
              参与共建 <ArrowUpRight size={14} />
            </a>
          </div>
        </aside>
        <main id="main" tabIndex={-1} className="main">
          <div className="mobile-toolbar">
            <button
              onClick={() => setMobileNav(!mobileNav)}
              aria-expanded={mobileNav}
            >
              <Menu size={17} /> {currentStage?.name || "全部生命周期"}
            </button>
            <span>{catalog.technologies.length} 项技术</span>
          </div>
          {view === "catalog" && (
            <>
              <div className="breadcrumb">
                知识库 <ChevronRight size={13} />{" "}
                {currentStage?.name || "技术目录"}
                <span className="updated">
                  <span className="live-dot" />
                  最近整理 {catalog.updatedAt}
                </span>
              </div>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">FRONTEND TECHNOLOGY ATLAS</div>
                  <h1>{currentStage?.name || "找到适合下一步的技术。"}</h1>
                  <p>
                    {currentStage?.subtitle ||
                      "从需求到上线，沿着开发生命周期探索、比较与选择。"}
                  </p>
                </div>
                <a className="text-link heading-cta" href="#scenarios">
                  按场景选型 <ArrowRight size={17} />
                </a>
              </div>
              <div className="catalog-layout">
                <section className="catalog-main" aria-label="技术目录">
                  <div className="search-box">
                    <Search size={20} />
                    <input
                      ref={searchRef}
                      aria-label="搜索技术"
                      placeholder="搜索技术、用途或关键词…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    {query ? (
                      <button
                        aria-label="清空搜索"
                        onClick={() => setQuery("")}
                      >
                        <X size={17} />
                      </button>
                    ) : (
                      <kbd>⌘ K</kbd>
                    )}
                  </div>
                  <div className="catalog-policy">
                    <Check size={13} />
                    只收录开源实现 · 每项附源码与许可证
                  </div>
                  <div className="filters">
                    <div className="ecosystems" aria-label="生态筛选">
                      {["all", "React", "Vue", "Svelte", "Angular"].map((e) => (
                        <button
                          key={e}
                          aria-pressed={eco === e}
                          className={eco === e ? "active" : ""}
                          onClick={() => setEco(e)}
                        >
                          {e === "all" ? "全部生态" : e}
                        </button>
                      ))}
                    </div>
                    <span className="result-count" role="status">
                      {results.length} 项技术
                    </span>
                  </div>
                  {(stage !== "all" || query || eco !== "all") && (
                    <div className="filter-summary">
                      <SlidersHorizontal size={13} />
                      <span>
                        {stage === "all" ? "全部阶段" : stageName(stage)} ·{" "}
                        {eco === "all" ? "全部生态" : `${eco} 及通用技术`}
                      </span>
                      <button
                        onClick={() => {
                          setStage("all");
                          setQuery("");
                          setEco("all");
                        }}
                      >
                        重置筛选 <X size={12} />
                      </button>
                    </div>
                  )}
                  {results.length ? (
                    <div className="tech-grid">
                      {results.slice(0, limit).map(card)}
                    </div>
                  ) : (
                    <div className="empty">
                      <Search size={32} />
                      <h2>没有找到匹配的技术</h2>
                      <p>试试更短的关键词，或清除阶段和生态筛选。</p>
                      <button
                        className="primary-button"
                        onClick={() => {
                          setQuery("");
                          setStage("all");
                          setEco("all");
                        }}
                      >
                        显示全部技术
                      </button>
                    </div>
                  )}
                  {results.length > limit && (
                    <div className="load-more">
                      <button
                        className="secondary-button"
                        onClick={() => setLimit(limit + 24)}
                      >
                        加载更多 · 还有 {results.length - limit} 项{" "}
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  )}
                </section>
                <aside className="reading-rail">
                  <div className="guide-panel">
                    <div className="rail-label">
                      <Network size={17} />
                      {currentStage ? "阶段指南" : "从一条完整链路开始"}
                    </div>
                    <h2>
                      {currentStage?.subtitle || (
                        <>
                          技术各有分工，
                          <br />
                          选型需要上下文。
                        </>
                      )}
                    </h2>
                    <p>
                      {currentStage?.description ||
                        "先明确产品场景，再确定渲染方式、数据边界和交付环境。每一项选择，都应服务于下一步。"}
                    </p>
                    <div className="flow">
                      {(
                        currentStage?.flow ||
                        "明确需求 → 选择与实现 → 验证与交付"
                      )
                        .split(" → ")
                        .map((text, i) => (
                          <div key={text}>
                            <span>{i + 1}</span>
                            {text}
                            {i < 2 && <div className="flow-line" />}
                          </div>
                        ))}
                    </div>
                    <a href="#scenarios">
                      查看场景推荐 <ArrowRight size={16} />
                    </a>
                  </div>
                  <div className="agent-promo">
                    <span className="terminal-icon">
                      <Terminal size={18} />
                    </span>
                    <span className="eyebrow">BUILT FOR AGENTS</span>
                    <h3>让 Agent 也选对技术。</h3>
                    <p>把选型规则、技术目录和决策模板，带进你的开发工作流。</p>
                    <a href="#skill">
                      获取开源 Skill <ArrowUpRight size={15} />
                    </a>
                    <div className="code-mini">
                      <span>$</span> frontend-stack-advisor
                    </div>
                  </div>
                  <div className="note">
                    <BookOpen size={16} />
                    <p>
                      技术能力附官方来源；推荐是基于约束的编辑判断，不是热度排名。
                    </p>
                  </div>
                </aside>
              </div>
            </>
          )}
          {view === "scenarios" && (
            <>
              <div className="breadcrumb">
                知识库 <ChevronRight size={13} /> 场景选型
                <span className="updated">
                  {scenarios.length} 个场景 · 可解释推荐
                </span>
              </div>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">START WITH YOUR USE CASE</div>
                  <h1>从你要做的事开始。</h1>
                  <p>每个方向给出明确首选，再用项目约束校准实现方式。</p>
                </div>
                <Compass className="heading-symbol" size={48} />
              </div>
              <div className="scenario-layout">
                <section className="scenario-picker" aria-label="选择应用场景">
                  <div className="search-box compact">
                    <Search size={17} />
                    <input
                      aria-label="搜索场景"
                      value={scenarioQuery}
                      onChange={(e) => setScenarioQuery(e.target.value)}
                      placeholder="搜索场景，如 IM、游戏、协同…"
                    />
                  </div>
                  <select
                    className="scenario-group"
                    aria-label="场景分类"
                    value={scenarioGroup}
                    onChange={(e) => setScenarioGroup(e.target.value)}
                  >
                    <option value="all">
                      全部场景 · {scenarios.length} 个方向
                    </option>
                    {[...new Set(scenarios.map((s) => s.group))].map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                  <div className="scenario-list">
                    {scenarios
                      .filter(
                        (s) =>
                          (scenarioGroup === "all" ||
                            s.group === scenarioGroup) &&
                          `${s.name} ${s.description} ${s.goal} ${s.group}`
                            .toLowerCase()
                            .includes(scenarioQuery.toLowerCase()),
                      )
                      .map((s, i) => (
                        <button
                          className={`scenario-option ${scenario === s.id ? "active" : ""}`}
                          key={s.id}
                          onClick={() => setScenario(s.id)}
                        >
                          <span className="scenario-index">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span>
                            <strong>{s.name}</strong>
                            <small>{s.description}</small>
                          </span>
                          <ChevronRight size={16} />
                        </button>
                      ))}
                    {!scenarios.some(
                      (s) =>
                        (scenarioGroup === "all" ||
                          s.group === scenarioGroup) &&
                        `${s.name} ${s.description} ${s.goal} ${s.group}`
                          .toLowerCase()
                          .includes(scenarioQuery.toLowerCase()),
                    ) && (
                      <div className="empty small-empty">
                        没有匹配的场景
                        <button
                          onClick={() => {
                            setScenarioQuery("");
                            setScenarioGroup("all");
                          }}
                        >
                          清空搜索
                        </button>
                      </div>
                    )}
                  </div>
                </section>
                <section className="recommendation" aria-live="polite">
                  <div className="recommendation-top">
                    <span className="pill">
                      <Sparkles size={13} /> 场景推荐
                    </span>
                    <span className="eyebrow">规则透明 · 无需 API KEY</span>
                  </div>
                  <h2>{recommendation.name}</h2>
                  <p className="goal">{recommendation.goal}</p>
                  <div className="constraint-fields">
                    <label>
                      团队熟悉的生态
                      <select
                        value={preference}
                        onChange={(e) => setPreference(e.target.value)}
                      >
                        {["any", "React", "Vue", "Svelte", "Angular"].map(
                          (x) => (
                            <option key={x} value={x}>
                              {x === "any" ? "不限，按场景推荐" : x}
                            </option>
                          ),
                        )}
                      </select>
                    </label>
                    <label>
                      部署条件
                      <select
                        value={hosting}
                        onChange={(e) => setHosting(e.target.value)}
                      >
                        <option value="any">不限，按场景推荐</option>
                        <option value="static">仅静态托管</option>
                        <option value="server">可运行服务端</option>
                      </select>
                    </label>
                  </div>
                  {prerequisite && (
                    <div className="prerequisite" role="note">
                      <CircleHelp size={17} />
                      <p>
                        <strong>方案成立的前提</strong>
                        {prerequisite}
                      </p>
                    </div>
                  )}
                  <div className="best-choice">
                    <div className="section-label">
                      当前约束下的首选 <span>开源实现</span>
                    </div>
                    <button
                      onClick={() => setDetail(byId(recommendation.primary))}
                    >
                      <Mark tech={byId(recommendation.primary)} />
                      <div>
                        <h3>{byId(recommendation.primary).name}</h3>
                        <p>{byId(recommendation.primary).kind}</p>
                      </div>
                      <ArrowUpRight size={18} />
                    </button>
                  </div>
                  <div className="section-label">
                    建议组合{" "}
                    <span>{recommendation.tools.length} 项 · 按需采用</span>
                  </div>
                  <div className="stack-chips">
                    {recommendation.tools.map((id: string) => (
                      <button key={id} onClick={() => setDetail(byId(id))}>
                        <Mark tech={byId(id)} small />
                        {byId(id).name}
                        <ArrowUpRight size={12} />
                      </button>
                    ))}
                  </div>
                  <div className="reason-list">
                    <h3>
                      <CheckCheck size={17} /> 为什么这样选
                    </h3>
                    {recommendation.notes.map((n: string) => (
                      <p key={n}>{n}</p>
                    ))}
                  </div>
                  <div className="tradeoff-box">
                    <h3>
                      <CircleHelp size={17} /> 取舍与实现边界
                    </h3>
                    <ul>
                      {recommendation.warnings
                        .filter((w: string) => w !== prerequisite)
                        .map((w: string) => (
                          <li key={w}>{w}</li>
                        ))}
                    </ul>
                  </div>
                  <div className="alternatives">
                    <h3>什么时候换一种选择</h3>
                    {recommendation.alternatives.map((id: string) => (
                      <button key={id} onClick={() => setDetail(byId(id))}>
                        <strong>
                          {byId(id).name}
                          <ArrowUpRight size={13} />
                        </strong>
                        <span>
                          {recommendation.alternativeReasons[id] ||
                            byId(id).bestFor}
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="fine-print">{recommendation.confidence}</p>
                  <div className="export-actions">
                    <button
                      className="primary-button"
                      onClick={() => {
                        download(
                          `${scenario}-stack.md`,
                          recommendationMarkdown(recommendation, catalog),
                        );
                        setToast(
                          `已生成 ${scenario}-stack.md，请查看浏览器下载。`,
                        );
                      }}
                    >
                      <Download size={16} />
                      导出选型建议
                    </button>
                    <button
                      className="secondary-button"
                      onClick={() =>
                        copy(
                          recommendationMarkdown(recommendation, catalog),
                          "选型建议",
                        )
                      }
                    >
                      <Copy size={15} />
                      复制 Markdown
                    </button>
                    <button
                      className="icon-button"
                      aria-label="复制当前场景链接"
                      onClick={() => copy(location.href, "场景链接")}
                    >
                      <ExternalLink size={17} />
                    </button>
                  </div>
                </section>
              </div>
            </>
          )}
          {view === "skill" && (
            <>
              <div className="breadcrumb">
                知识库 <ChevronRight size={13} /> Agent Skill
                <span className="updated">MIT LICENSE · OPEN SOURCE</span>
              </div>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">KNOWLEDGE, READY FOR YOUR AGENT</div>
                  <h1>把选型能力带进工作流。</h1>
                  <p>
                    同一份技术目录，一套可追溯的决策方法。网站与 Skill
                    同步更新。
                  </p>
                </div>
                <Terminal size={48} className="heading-symbol" />
              </div>
              <div className="skill-grid">
                <section className="skill-main">
                  <div className="skill-banner">
                    <div className="skill-window-dots">
                      <i />
                      <i />
                      <i />
                      <span>frontend-stack-advisor / SKILL.md</span>
                    </div>
                    <div className="skill-banner-content">
                      <span className="code-accent">name:</span>{" "}
                      frontend-stack-advisor
                      <br />
                      <span className="code-accent">purpose:</span>{" "}
                      从使用场景与硬约束出发
                      <br />
                      <span className="code-accent">output:</span> 首选组合 +
                      替代方案 + 决策依据
                      <br />
                      <span className="code-accent">sources:</span>{" "}
                      {catalog.technologies.length} 项技术 / {scenarios.length}{" "}
                      个场景 / 官方文档
                    </div>
                  </div>
                  <div className="skill-actions">
                    <a
                      className="primary-button"
                      href={`${base}frontend-stack-advisor.zip`}
                      download
                    >
                      <Download size={16} />
                      下载完整 Skill
                    </a>
                    <a
                      className="secondary-button"
                      href={`${repo}/tree/main/skills/frontend-stack-advisor`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Github size={16} />
                      查看源码
                    </a>
                  </div>
                  <h2>接入你的 Agent</h2>
                  <ol className="install-steps">
                    <li>
                      <span>01</span>
                      <div>
                        <h3>下载并解压完整 Skill</h3>
                        <p>
                          保留 SKILL.md、references 和 scripts 的相对目录。无需
                          API key。
                        </p>
                      </div>
                    </li>
                    <li>
                      <span>02</span>
                      <div>
                        <h3>放入 Agent 支持的 skills 目录</h3>
                        <p>
                          Codex 使用{" "}
                          <code>~/.codex/skills/frontend-stack-advisor/</code>
                          ；其他 Agent 按其 skill 加载方式配置。
                        </p>
                      </div>
                    </li>
                    <li>
                      <span>03</span>
                      <div>
                        <h3>给出场景与约束</h3>
                        <p>
                          让 Agent
                          检查已有项目，识别运行环境、团队经验和必须满足的功能，再形成选型建议。
                        </p>
                      </div>
                    </li>
                  </ol>
                  <div className="prompt-example">
                    <div>
                      <span>试试这样提问</span>
                      <button
                        onClick={() =>
                          copy(
                            "使用 $frontend-stack-advisor：我要做多人协同编辑器，团队熟悉 React，需要离线编辑和冲突合并。请推荐最小可行技术栈，说明同步、鉴权、持久化边界和替代方案。",
                            "示例提示词",
                          )
                        }
                        aria-label="复制示例提示词"
                      >
                        <Copy size={15} />
                      </button>
                    </div>
                    <p>
                      使用
                      $frontend-stack-advisor：我要做多人协同编辑器，团队熟悉
                      React，需要离线编辑和冲突合并。请推荐最小可行技术栈，说明同步、鉴权、持久化边界和替代方案。
                    </p>
                  </div>
                </section>
                <aside className="skill-side">
                  <h3>这个 Skill 会做什么</h3>
                  {[
                    [
                      "01",
                      "先识别约束",
                      "检查现有技术、部署环境与非功能需求。",
                    ],
                    ["02", "再推荐组合", "明确每一层的职责，避免重复引入。"],
                    ["03", "给出证据", "引用官方资料，解释首选和替代条件。"],
                    [
                      "04",
                      "留下决策",
                      "输出可实施的方案、待验证项与最小验证路径。",
                    ],
                  ].map(([n, t, d]) => (
                    <div className="skill-feature" key={n}>
                      <span>{n}</span>
                      <div>
                        <h4>{t}</h4>
                        <p>{d}</p>
                      </div>
                    </div>
                  ))}
                  <div className="machine-data">
                    <Code2 size={21} />
                    <h3>也可以直接读取数据</h3>
                    <p>JSON 目录和 llms.txt 面向自动化与其他工具开放。</p>
                    <a
                      href={`${base}catalog.json`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      catalog.json <ArrowUpRight size={14} />
                    </a>
                    <a
                      href={`${base}scenarios.json`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      scenarios.json <ArrowUpRight size={14} />
                    </a>
                    <a
                      href={`${base}llms.txt`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      llms.txt <ArrowUpRight size={14} />
                    </a>
                  </div>
                </aside>
              </div>
            </>
          )}
          <footer>
            <span>
              <Layers3 size={14} /> Stack Atlas · 让每一次选型都有依据
            </span>
            <div>
              <a
                href={`${repo}/blob/main/CONTRIBUTING.md`}
                target="_blank"
                rel="noreferrer"
              >
                贡献指南 <ArrowUpRight size={12} />
              </a>
              <a
                href={`${repo}/blob/main/LICENSE`}
                target="_blank"
                rel="noreferrer"
              >
                MIT License
              </a>
            </div>
          </footer>
        </main>
      </div>
      {compare.length > 0 && (
        <div className="compare-tray">
          <span>
            <GitCompareArrows size={18} />
            已选 {compare.length}/3
          </span>
          <div className="tray-items">
            {selectedTechs.map((t) => (
              <button
                key={t.id}
                onClick={() => toggleCompare(t.id)}
                aria-label={`从比较移除 ${t.name}`}
              >
                {t.name}
                <X size={12} />
              </button>
            ))}
          </div>
          <button className="tray-clear" onClick={() => setCompare([])}>
            清空
          </button>
          <button
            className="primary-button"
            disabled={compare.length < 2}
            onClick={() => setComparing(true)}
          >
            开始比较 <ArrowRight size={15} />
          </button>
        </div>
      )}
      {detail && (
        <Modal title="技术详情" message={toast} close={() => setDetail(null)}>
          <div className="detail-title">
            <Mark tech={detail} />
            <div>
              <h2>{detail.name}</h2>
              <p>
                {detail.kind} · {detail.ecosystem}
              </p>
            </div>
          </div>
          <p className="detail-description">{detail.description}</p>
          <div className="detail-section">
            <h3>适合什么场景</h3>
            <p>{detail.bestFor}</p>
          </div>
          <div className="tradeoff-box">
            <h3>主要取舍</h3>
            <p>{detail.tradeoff}</p>
          </div>
          <div className="detail-section">
            <h3>生命周期位置</h3>
            <div className="detail-tags">
              {[detail.stage, ...detail.relatedStages].map((id) => (
                <button
                  key={id}
                  onClick={() => {
                    selectStage(id);
                    setDetail(null);
                  }}
                >
                  {stageName(id)}
                  <ArrowRight size={12} />
                </button>
              ))}
            </div>
          </div>
          <div className="detail-section">
            <h3>相关方案</h3>
            <div className="detail-tags">
              {catalog.technologies
                .filter((t) => t.stage === detail.stage && t.id !== detail.id)
                .slice(0, 4)
                .map((t) => (
                  <button key={t.id} onClick={() => setDetail(t)}>
                    {t.name}
                    <ArrowUpRight size={12} />
                  </button>
                ))}
            </div>
            <p className="fine-print">
              同阶段技术可能承担不同职责，请结合能力边界比较。
            </p>
          </div>
          <div className="detail-source">
            <BookOpen size={17} />
            <div>
              <a href={detail.url} target="_blank" rel="noreferrer">
                官方文档 / 项目来源 <ExternalLink size={13} />
              </a>
              <small>整理日期 {detail.reviewedAt} · 采用前核对具体版本</small>
              <div className="source-actions">
                <a href={detail.repository} target="_blank" rel="noreferrer">
                  源码仓库 <Github size={13} />
                </a>
                <a href={detail.licenseUrl} target="_blank" rel="noreferrer">
                  {detail.license} 许可证 <ExternalLink size={13} />
                </a>
              </div>
            </div>
          </div>
          <div className="export-actions">
            <button
              className="primary-button"
              onClick={() => toggleCompare(detail.id)}
            >
              {compare.includes(detail.id) ? (
                <Check size={16} />
              ) : (
                <GitCompareArrows size={16} />
              )}{" "}
              {compare.includes(detail.id) ? "从比较中移除" : "加入比较"}
            </button>
            <button
              className="secondary-button"
              onClick={() => copy(location.href, "技术链接")}
            >
              <Copy size={15} />
              复制链接
            </button>
          </div>
        </Modal>
      )}
      {comparing && (
        <Modal title="技术比较" close={() => setComparing(false)} wide>
          <h2>把取舍放在一起看。</h2>
          <p className="muted">
            比较职责和适用条件，先确认它们是否处于同一层。
          </p>
          <div className="compare-table-wrap">
            <table className="compare-table">
              <thead>
                <tr>
                  <th>比较维度</th>
                  {selectedTechs.map((t) => (
                    <th key={t.id}>
                      <Mark tech={t} small />
                      {t.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["kind", "技术角色"],
                  ["description", "解决什么"],
                  ["bestFor", "适合场景"],
                  ["tradeoff", "主要限制"],
                  ["license", "开源许可证"],
                ].map(([field, label]) => (
                  <tr key={field}>
                    <th>{label}</th>
                    {selectedTechs.map((t) => (
                      <td key={t.id}>{t[field as keyof Tech]}</td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <th>官方资料</th>
                  {selectedTechs.map((t) => (
                    <td key={t.id}>
                      <a href={t.url} target="_blank" rel="noreferrer">
                        阅读文档 <ArrowUpRight size={13} />
                      </a>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </Modal>
      )}
      <div className={`toast ${toast ? "visible" : ""}`} role="status">
        {toast && (
          <>
            <Check size={17} />
            {toast}
          </>
        )}
      </div>
    </>
  );
}
