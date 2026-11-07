import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import {
  recommendRanked,
  sortTechnologies,
  popularityScore,
  recommendationMarkdown,
} from "../src/engine.mjs";
const read = (name) =>
  JSON.parse(
    readFileSync(new URL(`../src/data/${name}.json`, import.meta.url)),
  );
const c = read("catalog"),
  s = read("scenarios"),
  m = read("metrics");
test("ranked plans keep all 1,395 combinations compatible and the winner consistent", () => {
  for (const scenario of s)
    for (const ecosystem of ["any", "React", "Vue", "Svelte", "Angular"])
      for (const hosting of ["any", "static", "server"])
        for (const ranking of ["popularity", "stars", "downloads"]) {
          const r = recommendRanked(
            s,
            { scenario: scenario.id, ecosystem, hosting, ranking },
            c,
            m,
          );
          assert.equal(
            r.primary,
            r.ranking.candidates[0].id,
            `${scenario.id}/${ecosystem}/${ranking}`,
          );
          assert.ok(r.tools.includes(r.primary));
          assert.equal(r.tools.length, new Set(r.tools).size);
          for (const id of r.tools) {
            const tech = c.technologies.find((t) => t.id === id);
            assert.ok(tech);
            if (ecosystem !== "any")
              assert.ok(
                ["通用", ecosystem].includes(tech.ecosystem),
                `${scenario.id} / ${ecosystem}: ${id}`,
              );
          }
          if (hosting === "static") assert.ok(!r.tools.includes("docker"));
          if (ecosystem === "Angular") assert.ok(!r.tools.includes("vite"));
        }
});
test("null is unknown, genuine zero is ranked, ties and input order are stable", () => {
  const data = {
    entries: {
      a: { stars: 9, npm: { downloads: 0 } },
      b: { stars: 100000, npm: null },
      c: { stars: 9, npm: { downloads: 0 } },
    },
  };
  const items = [{ id: "c" }, { id: "b" }, { id: "a" }];
  assert.deepEqual(
    sortTechnologies(items, data).map((t) => t.id),
    ["a", "c", "b"],
  );
  assert.deepEqual(
    sortTechnologies(items, data, "downloads").map((t) => t.id),
    ["a", "c", "b"],
  );
  assert.deepEqual(
    sortTechnologies(items, data, "stars").map((t) => t.id),
    ["b", "a", "c"],
  );
  assert.equal(popularityScore(data.entries.b), null);
  assert.deepEqual(
    items.map((t) => t.id),
    ["c", "b", "a"],
  );
  assert.throws(() => sortTechnologies(items, data, "wrong"));
});
test("changing community evidence changes the preferred editor and preserves explanation", () => {
  const fake = structuredClone(m);
  fake.entries.monaco.stars = 1000000;
  fake.entries.codemirror.stars = 1;
  const r = recommendRanked(
    s,
    { scenario: "code-editor", ranking: "stars" },
    c,
    fake,
  );
  assert.equal(r.primary, "monaco");
  assert.ok(!r.tools.includes("codemirror"));
  assert.ok(r.alternatives.includes("codemirror"));
  assert.ok(r.notes.join(" ").includes("Monaco"));
  fake.entries.monaco.archived = true;
  assert.equal(
    recommendRanked(s, { scenario: "code-editor", ranking: "stars" }, c, fake)
      .primary,
    "codemirror",
  );
});
test("high stars cannot replace the product target or force an incompatible ecosystem", () => {
  const fake = structuredClone(m);
  for (const id of ["socket-io", "pixijs", "excalidraw", "react"])
    fake.entries[id].stars = 999999999;
  for (const [scenario, primary] of [
    ["instant-messaging", "matrix-js-sdk"],
    ["game-2d", "phaser"],
  ]) {
    assert.equal(
      recommendRanked(s, { scenario, ranking: "stars" }, c, fake).primary,
      primary,
    );
  }
  assert.ok(
    !recommendRanked(
      s,
      { scenario: "collaborative-whiteboard", ranking: "stars" },
      c,
      fake,
    ).ranking.candidates.some((t) => t.id === "excalidraw"),
  );
  assert.equal(
    recommendRanked(
      s,
      { scenario: "dashboard", ecosystem: "Vue", ranking: "stars" },
      c,
      fake,
    ).primary,
    "vue",
  );
});
test("every declared alternative can form a coherent winning plan", () => {
  for (const scenario of s)
    for (const id of scenario.rankingPeers) {
      const fake = structuredClone(m);
      for (const entry of Object.values(fake.entries)) entry.stars = 1;
      fake.entries[id].stars = 1000000;
      const r = recommendRanked(
        s,
        { scenario: scenario.id, ranking: "stars" },
        c,
        fake,
      );
      assert.equal(r.primary, id, scenario.id);
      assert.ok(r.tools.includes(id));
      if (id === "babylonjs") assert.ok(!r.tools.includes("react-three-fiber"));
      if (["nuxt", "sveltekit", "angular", "vue"].includes(id))
        assert.ok(!r.tools.includes("react"));
      if (id === "plasmo") assert.ok(!r.tools.includes("vite"));
    }
});
test("portable CLI and markdown carry the same ranking and source evidence", () => {
  const options = {
    scenario: "code-editor",
    ecosystem: "Vue",
    hosting: "static",
    ranking: "downloads",
  };
  const output = execFileSync(
    process.execPath,
    [
      "skills/frontend-stack-advisor/scripts/recommend.mjs",
      ...Object.entries(options).flatMap(([k, v]) => ["--" + k, v]),
      "--json",
    ],
    { encoding: "utf8" },
  );
  const r = recommendRanked(s, options, c, m);
  assert.deepEqual(JSON.parse(output), r);
  const markdown = recommendationMarkdown(r, c);
  assert.ok(markdown.includes(m.period.start));
  assert.ok(markdown.includes("api.npmjs.org"));
  assert.ok(markdown.includes("不等于真实用户数"));
});
