import { readFile, writeFile, rename, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const exec = promisify(execFile);
const catalog = JSON.parse(await readFile("src/data/catalog.json", "utf8"));
const sources = JSON.parse(
  await readFile("src/data/metrics-sources.json", "utf8"),
);
await mkdir(".cache/metrics", { recursive: true });
let npmQueue = Promise.resolve();
async function json(url) {
  const cache = `.cache/metrics/${createHash("sha256").update(url).digest("hex")}.json`;
  try {
    const saved = JSON.parse(await readFile(cache, "utf8"));
    if (Date.now() - saved.at < 3600000)
      return { ...saved.data, fetchedAt: new Date(saved.at).toISOString() };
  } catch {}
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const turn = npmQueue.then(
        () => new Promise((resolve) => setTimeout(resolve, 2200)),
      );
      npmQueue = turn;
      await turn;
      const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`${response.status} ${url}`);
      const data = await response.json();
      const at = Date.now();
      await writeFile(cache, JSON.stringify({ at, data }));
      return { ...data, fetchedAt: new Date(at).toISOString() };
    } catch (error) {
      if (attempt === 4) throw error;
      await new Promise((resolve) =>
        setTimeout(resolve, 10000 * (attempt + 1)),
      );
    }
  }
}
// One explicit period for every package; never sum subpackages or multiple weeks.
const period = await json(
  "https://api.npmjs.org/downloads/point/last-week/react",
);
const entries = {};
let cursor = 0;
async function worker() {
  while (cursor < catalog.technologies.length) {
    const t = catalog.technologies[cursor++];
    const source = sources[t.id];
    if (!source) throw new Error(`Missing metrics mapping: ${t.id}`);
    const slug = new URL(
      source.githubRepository || t.repository,
    ).pathname.slice(1);
    const { stdout } = await exec("gh", ["api", `repos/${slug}`], {
      maxBuffer: 1024 * 1024,
    });
    const repo = JSON.parse(stdout);
    if (
      !Number.isSafeInteger(repo.stargazers_count) ||
      repo.stargazers_count < 0
    )
      throw new Error(`Invalid stars: ${t.id}`);
    const observedAt = new Date().toISOString();
    let npm = null;
    if (source.npmPackage) {
      const sourceUrl = `https://api.npmjs.org/downloads/point/${period.start}:${period.end}/${encodeURIComponent(source.npmPackage)}`;
      const data = await json(sourceUrl);
      if (
        !Number.isSafeInteger(data.downloads) ||
        data.downloads < 0 ||
        data.package !== source.npmPackage ||
        data.start !== period.start ||
        data.end !== period.end
      )
        throw new Error(`Invalid npm response: ${t.id}`);
      npm = {
        package: data.package,
        downloads: data.downloads,
        start: data.start,
        end: data.end,
        sourceUrl,
        observedAt: data.fetchedAt,
      };
    }
    entries[t.id] = {
      stars: repo.stargazers_count,
      repository: repo.html_url,
      starsSourceUrl: `https://api.github.com/repos/${repo.full_name}`,
      observedAt,
      archived: repo.archived,
      activeUpstream: source.activeUpstream || null,
      npm,
      usageNote: npm
        ? "代表 npm 包的下载次数，包含 CI、重复与间接安装；不等于真实用户数。Stars 为整个源码仓库的关注数。"
        : "该实现没有可比的官方 npm 采用量；用户数与下载量未知，不记为零。",
    };
    console.log(`Fetched ${t.id}`);
  }
}
await Promise.all(Array.from({ length: 5 }, worker));
const snapshot = {
  schemaVersion: 1,
  updatedAt: new Date().toISOString(),
  period: { start: period.start, end: period.end },
  entries: Object.fromEntries(
    catalog.technologies.map((t) => [t.id, entries[t.id]]),
  ),
};
// All-or-nothing update: an API failure preserves the previous published snapshot.
const target = "src/data/metrics.json";
await writeFile(`${target}.tmp`, JSON.stringify(snapshot, null, 2) + "\n");
await rename(`${target}.tmp`, target);
console.log(
  `Updated ${Object.keys(entries).length} repositories; npm period ${period.start} – ${period.end}`,
);
