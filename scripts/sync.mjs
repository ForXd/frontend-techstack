import { mkdir, readFile, writeFile, copyFile, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
const catalog = JSON.parse(await readFile("src/data/catalog.json", "utf8"));
const scenarios = JSON.parse(await readFile("src/data/scenarios.json", "utf8"));
const skill = "skills/frontend-stack-advisor";
await mkdir("public", { recursive: true });
for (const name of ["catalog", "scenarios"]) {
  await copyFile(`src/data/${name}.json`, `public/${name}.json`);
  await copyFile(`src/data/${name}.json`, `${skill}/references/${name}.json`);
}
await copyFile("LICENSE", `${skill}/LICENSE`);
await copyFile("src/engine.mjs", `${skill}/scripts/engine.mjs`);
const lookup = (id) => catalog.technologies.find((t) => t.id === id);
await writeFile(
  `${skill}/references/scenarios.md`,
  `# 开源前端场景索引\n\n整理日期：${catalog.updatedAt}。推荐是基于条件的编辑判断，不是普遍最优。\n\n${scenarios.map((s) => `## ${s.name} (${s.id})\n\n- 目标：${s.goal}\n- 首选：[${lookup(s.primary).name}](${lookup(s.primary).url})\n- 理由：${s.reason}\n- 替代：${s.alternatives.map((id) => lookup(id).name + "：" + s.alternativeReasons[id]).join("；")}\n- 限制：${s.tradeoff}\n`).join("\n")}`,
);
await writeFile(
  "public/llms.txt",
  `# Stack Atlas — 开源前端技术栈图谱\n\n按12个开发生命周期阶段整理${catalog.technologies.length}项开源技术，覆盖${scenarios.length}个应用场景。\n目录整理日期：${catalog.updatedAt}。推荐为编辑判断；实际使用前核对版本和许可证。\n\n- [技术目录](https://forxd.github.io/frontend-techstack/catalog.json)\n- [场景配方](https://forxd.github.io/frontend-techstack/scenarios.json)\n- [Skill 源码](https://github.com/ForXd/frontend-techstack/tree/main/skills/frontend-stack-advisor)\n- [完整 Skill 包](https://forxd.github.io/frontend-techstack/frontend-stack-advisor.zip)\n`,
);
await copyFile(`${skill}/SKILL.md`, "public/SKILL.md");
await rm("public/frontend-stack-advisor.zip", { force: true });
execFileSync(
  "zip",
  [
    "-q",
    "-r",
    "../public/frontend-stack-advisor.zip",
    "frontend-stack-advisor",
  ],
  { cwd: "skills" },
);
console.log(
  `Synced ${catalog.technologies.length} technologies, ${scenarios.length} scenarios and portable skill.`,
);
