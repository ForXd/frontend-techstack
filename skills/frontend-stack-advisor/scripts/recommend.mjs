#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import {
  recommendRanked,
  recommendationMarkdown,
  filterCatalog,
  sortTechnologies,
} from "./engine.mjs";
const read = (name) =>
  readFile(new URL(`../references/${name}.json`, import.meta.url), "utf8").then(
    JSON.parse,
  );
try {
  const [catalog, scenarios, metrics] = await Promise.all([
    read("catalog"),
    read("scenarios"),
    read("metrics"),
  ]);
  const args = process.argv.slice(2);
  const options = {};
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (["--json", "--list", "--help"].includes(key))
      options[key.slice(2)] = true;
    else if (
      [
        "--scenario",
        "--ecosystem",
        "--hosting",
        "--search",
        "--ranking",
      ].includes(key) &&
      args[i + 1] &&
      !args[i + 1].startsWith("--")
    )
      options[key.slice(2)] = args[++i];
    else throw new Error(`未知或缺少参数：${key}`);
  }
  if (options.help)
    console.log(
      "用法：node scripts/recommend.mjs --list | --search 关键词 | --scenario ID [--ecosystem any|React|Vue|Svelte|Angular] [--hosting any|static|server] [--ranking popularity|stars|downloads] [--json]",
    );
  else if (options.list)
    console.log(
      options.json
        ? JSON.stringify(scenarios, null, 2)
        : scenarios.map((s) => `${s.id}\t${s.name} — ${s.goal}`).join("\n"),
    );
  else if (options.search !== undefined)
    console.log(
      JSON.stringify(
        sortTechnologies(
          filterCatalog(catalog, { query: options.search }),
          metrics,
          options.ranking,
        ).map((t) => ({ ...t, metrics: metrics.entries[t.id] })),
        null,
        2,
      ),
    );
  else {
    const r = recommendRanked(scenarios, options, catalog, metrics);
    console.log(
      options.json
        ? JSON.stringify(r, null, 2)
        : recommendationMarkdown(r, catalog),
    );
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
