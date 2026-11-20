import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test, type TestContext } from "node:test";
import { buildSnapshot, verifySnapshot } from "./snapshot.js";

const provenance = {
  sourceCommit: "a".repeat(40),
  sourceDirty: false,
  registryVersion: "1.2.3",
  registryHash: "b".repeat(64),
};

function fixture(t: TestContext) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), "reborn-kb-test-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const source = path.join(root, "source");
  const target = path.join(root, "snapshot");
  const entry = { id: "reborn-button", examples: [{ path: "Button.vue" }] };
  fs.mkdirSync(path.join(source, "components"), { recursive: true });
  fs.writeFileSync(path.join(source, "index.json"), JSON.stringify({ schemaVersion: 1, components: [entry] }));
  fs.writeFileSync(path.join(source, "components", `${entry.id}.json`), JSON.stringify(entry));
  fs.writeFileSync(path.join(root, "Button.vue"), "<RebornButton />\r\n");
  return { root, source, target, demoRoot: root, provenance };
}

test("快照包含离线示例和校验值，相同输入生成同一个版本", (t) => {
  const options = fixture(t);
  const manifest = buildSnapshot(options);
  assert.equal(manifest.componentCount, 1);
  assert.equal(manifest.sourceCommit, provenance.sourceCommit);
  assert.equal(manifest.registryVersion, provenance.registryVersion);
  assert.equal(verifySnapshot(options.target).snapshotVersion, manifest.snapshotVersion);
  assert.equal(buildSnapshot(options).snapshotVersion, manifest.snapshotVersion);
  const component = JSON.parse(fs.readFileSync(path.join(options.target, "components", "reborn-button.json"), "utf8"));
  assert.equal(component.examples[0].code, "<RebornButton />\n");
  fs.writeFileSync(path.join(options.target, "index.json"), "{}");
  assert.throws(() => verifySnapshot(options.target), /校验值不一致/);
});

test("缺少示例或索引和组件不一致时保留上一份快照", (t) => {
  const options = fixture(t);
  const { snapshotVersion } = buildSnapshot(options);
  fs.unlinkSync(path.join(options.root, "Button.vue"));
  assert.throws(() => buildSnapshot(options), /Button\.vue/);
  assert.equal(verifySnapshot(options.target).snapshotVersion, snapshotVersion);
  fs.writeFileSync(path.join(options.root, "Button.vue"), "<RebornButton />");
  fs.writeFileSync(path.join(options.source, "index.json"), '{"schemaVersion":1,"components":[{"id":"reborn-input"}]}');
  assert.throws(() => buildSnapshot(options), /组件集合不一致/);
  assert.equal(verifySnapshot(options.target).snapshotVersion, snapshotVersion);
});
