import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read = (path) => readFile(path, "utf8").then(JSON.parse);
const c = await read("src/data/catalog.json"),
  scenarios = await read("src/data/scenarios.json");
const licenses = new Set([
  "MIT",
  "Apache-2.0",
  "Apache-2.0 OR MIT",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "ISC",
  "MPL-2.0",
  "AGPL-3.0-only",
]);
const stages = new Set(c.stages.map((s) => s.id)),
  ids = new Set(c.technologies.map((t) => t.id));
assert.equal(stages.size, 12);
assert.equal(ids.size, c.technologies.length);
for (const t of c.technologies) {
  for (const field of [
    "id",
    "name",
    "stage",
    "ecosystem",
    "kind",
    "description",
    "bestFor",
    "tradeoff",
    "url",
    "repository",
    "license",
    "licenseUrl",
    "reviewedAt",
  ])
    assert.ok(
      typeof t[field] === "string" && t[field].trim(),
      `${t.id}: missing ${field}`,
    );
  assert.ok(
    licenses.has(t.license),
    `${t.id}: unreviewed license ${t.license}`,
  );
  for (const field of ["url", "repository", "licenseUrl"])
    assert.equal(new URL(t[field]).protocol, "https:");
  assert.ok(stages.has(t.stage));
  for (const s of t.relatedStages) assert.ok(stages.has(s));
  assert.match(t.reviewedAt, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(t.tags.length);
}
assert.equal(new Set(scenarios.map((s) => s.id)).size, scenarios.length);
for (const s of scenarios) {
  for (const id of [s.primary, ...s.alternatives, ...s.tools])
    assert.ok(ids.has(id), `${s.id}: unknown ${id}`);
  assert.ok(s.tools.includes(s.primary));
  assert.ok(s.reason && s.tradeoff && s.group);
}
for (const name of ["catalog", "scenarios"])
  assert.equal(
    await readFile(`src/data/${name}.json`, "utf8"),
    await readFile(
      `skills/frontend-stack-advisor/references/${name}.json`,
      "utf8",
    ),
    "Run npm run sync",
  );
assert.equal(
  await readFile("src/engine.mjs", "utf8"),
  await readFile("skills/frontend-stack-advisor/scripts/engine.mjs", "utf8"),
  "Skill engine is stale",
);
console.log(
  `Validated ${ids.size} open-source technologies, ${scenarios.length} scenarios, 12 stages, references and skill parity.`,
);
