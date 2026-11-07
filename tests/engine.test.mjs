import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import {
  recommend,
  filterCatalog,
  recommendationMarkdown,
} from "../src/engine.mjs";
const c = JSON.parse(
  readFileSync(new URL("../src/data/catalog.json", import.meta.url)),
);
const s = JSON.parse(
  readFileSync(new URL("../src/data/scenarios.json", import.meta.url)),
);
const ids = new Set(c.technologies.map((t) => t.id));
test("every scenario / ecosystem / deployment combination resolves to unique open-source entries", () => {
  for (const scenario of s)
    for (const ecosystem of ["any", "React", "Vue", "Svelte", "Angular"])
      for (const hosting of ["any", "static", "server"]) {
        const r = recommend(s, { scenario: scenario.id, ecosystem, hosting });
        assert.ok(r.tools.includes(r.primary), scenario.id);
        assert.equal(r.tools.length, new Set(r.tools).size);
        for (const id of [...r.tools, ...r.alternatives])
          assert.ok(ids.has(id), `${scenario.id}: ${id}`);
        if (ecosystem !== "any" && ecosystem !== "React")
          for (const id of r.tools)
            assert.notEqual(
              c.technologies.find((t) => t.id === id).ecosystem,
              "React",
              `${scenario.id} / ${ecosystem} incompatible ${id}`,
            );
        assert.ok(recommendationMarkdown(r, c).includes("https://"));
      }
});
test("static collaborative and IM recipes preserve the explicit backend boundary", () => {
  for (const scenario of [
    "collaborative-editing",
    "collaborative-whiteboard",
    "instant-messaging",
    "realtime-conferencing",
    "ai-chat",
  ]) {
    const r = recommend(s, { scenario, hosting: "static" });
    assert.ok(!r.tools.includes("docker"));
    assert.ok(r.warnings.some((w) => w.includes("独立后端")));
  }
});
test("whiteboards use a canvas without an unrelated rich-text editor", () => {
  for (const ecosystem of ["any", "React", "Vue", "Svelte", "Angular"]) {
    const r = recommend(s, {
      scenario: "collaborative-whiteboard",
      ecosystem,
      hosting: "static",
    });
    assert.ok(r.tools.includes("konva"));
    assert.ok(r.tools.includes("yjs"));
    assert.ok(!r.tools.includes("tiptap"));
    assert.ok(r.warnings.some((w) => w.includes("撤权无法追回")));
  }
});
test("Vue content uses Nuxt static export and Vue node editor replaces React Flow", () => {
  const r = recommend(s, {
    scenario: "content",
    ecosystem: "Vue",
    hosting: "static",
  });
  assert.equal(r.primary, "nuxt");
  assert.ok(r.warnings.some((w) => w.includes("静态生成")));
  const graph = recommend(s, { scenario: "node-editor", ecosystem: "Vue" });
  assert.equal(graph.primary, "antv-x6");
  assert.ok(!graph.tools.includes("react-flow"));
});
test("native targets do not become web deployments", () => {
  for (const scenario of [
    "mobile-cross-platform",
    "desktop-app",
    "browser-extension",
  ]) {
    const r = recommend(s, { scenario, hosting: "static" });
    assert.ok(!r.tools.includes("nginx"));
    assert.ok(r.warnings.some((w) => w.includes("原生")));
  }
});
test("open-source policy excludes proprietary platforms and non-OSI animation licenses", () => {
  for (const id of ["gsap", "vercel", "cloudflare", "github-pages"])
    assert.ok(!ids.has(id));
  assert.equal(recommend(s, { scenario: "scroll-story" }).primary, "animejs");
  for (const t of c.technologies) {
    assert.ok(t.repository);
    assert.ok(t.licenseUrl);
    assert.notEqual(t.license, "NOASSERTION");
  }
});
test("search handles Chinese, case, whitespace, secondary lifecycle and ecosystem", () => {
  assert.ok(
    filterCatalog(c, { query: "  ReAcT  " }).some((t) => t.id === "react"),
  );
  assert.ok(filterCatalog(c, { query: "协同" }).some((t) => t.id === "yjs"));
  assert.ok(
    filterCatalog(c, { stage: "quality" }).some((t) => t.id === "typescript"),
  );
  assert.ok(
    filterCatalog(c, { ecosystem: "Vue" }).every((t) =>
      ["Vue", "通用"].includes(t.ecosystem),
    ),
  );
  assert.equal(
    filterCatalog(c, { query: "nonexistent-technology-8973" }).length,
    0,
  );
});
test("portable CLI matches website results and rejects unknown options", () => {
  const result = JSON.parse(
    execFileSync(
      process.execPath,
      [
        "skills/frontend-stack-advisor/scripts/recommend.mjs",
        "--scenario",
        "game-2d",
        "--json",
      ],
      { encoding: "utf8" },
    ),
  );
  assert.deepEqual(result, recommend(s, { scenario: "game-2d" }));
  assert.notEqual(
    spawnSync(process.execPath, [
      "skills/frontend-stack-advisor/scripts/recommend.mjs",
      "--scenario",
      "wrong",
    ]).status,
    0,
  );
});
