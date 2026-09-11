/* eslint test/no-import-node-test: off -- 使用项目现有的 Node 内置测试运行器 */
import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { Box3, Group, SkinnedMesh, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { heroMessage, installCommand, retargetingModels } from "../../app/components/common/landing/retargetingHero.config.ts";
import { createRetargetOptions, prepareRetargetedActors } from "../../app/lib/three/retargetingScene.ts";

// 测试只读取真实骨骼与网格，不在 Node 中解码装饰性纹理。
async function loadRig(path: string) {
  const file = await readFile(new URL(`../../public${path}`, import.meta.url));
  const jsonLength = file.readUInt32LE(12);
  const json = JSON.parse(file.subarray(20, 20 + jsonLength).toString());
  for (const mesh of json.meshes) for (const primitive of mesh.primitives) delete primitive.material;
  const encoded = Buffer.from(JSON.stringify(json));
  const padded = Buffer.alloc(Math.ceil(encoded.length / 4) * 4, 0x20);
  encoded.copy(padded);
  const binary = file.subarray(20 + jsonLength);
  const header = Buffer.from(file.subarray(0, 20));
  header.writeUInt32LE(20 + padded.length + binary.length, 8);
  header.writeUInt32LE(padded.length, 12);
  const buffer = Buffer.concat([header, padded, binary]);
  return new GLTFLoader().parseAsync(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength), "");
}

test("首页保留组件库文案、真实安装命令与本地模型", () => {
  assert.equal(installCommand, "npx reborn-ui@latest init");
  assert.match(heroMessage, /Vue 组件/);
  assert.equal(retargetingModels.length, 2);
  assert.ok(retargetingModels.every(path => path.startsWith("/models/retargeting/")));
});

test("骨骼映射包含髋部、脊柱与双侧四肢及姿态补偿", () => {
  const options = createRetargetOptions();
  assert.equal(options.hip, "mixamorigHips");
  assert.equal(Object.keys(options.names).length, 20);
  assert.equal(Object.keys(options.localOffsets).length, 16);
  assert.equal(options.scale, 100);
  assert.ok(options.localOffsets.mixamorigLeftFoot!.elements.every(Number.isFinite));
});

test("真实模型重定向后保持人体尺寸，并且两个角色都随时间运动", async () => {
  const [source, target] = await Promise.all(retargetingModels.map(loadRig));
  assert.ok(source && target);
  const group = new Group();
  group.add(source.scene, target.scene);
  const mixers = prepareRetargetedActors(source, target);
  const snapshots: number[][] = [];
  for (let frame = 0; frame < 4; frame++) {
    for (const mixer of mixers) mixer.update(0.25);
    group.updateMatrixWorld(true);
    for (const actor of [source, target]) {
      actor.scene.traverse(object => { if (object instanceof SkinnedMesh) object.computeBoundingBox(); });
      const box = new Box3().setFromObject(actor.scene);
      const size = box.getSize(new Vector3());
      assert.ok(size.y > 0.5 && size.y < 3, `角色高度异常：${size.y}`);
      assert.ok(box.min.y > -1 && box.max.y < 4, `角色移出舞台：${box.min.y} / ${box.max.y}`);
      snapshots.push([...box.min.toArray(), ...box.max.toArray()]);
    }
  }
  assert.notDeepEqual(snapshots[0], snapshots[2], "源角色必须运动");
  assert.notDeepEqual(snapshots[1], snapshots[3], "目标角色必须应用重定向动画");
  for (const mixer of mixers) { mixer.stopAllAction(); mixer.uncacheRoot(mixer.getRoot()); }
});

test("多角色独立模式克隆三个骨骼并播放不同动画", async () => {
  const { prepareMultipleActors } = await import("../../app/lib/three/multipleAnimationScene.ts");
  const model = await loadRig(retargetingModels[1]);
  const actors = prepareMultipleActors(model);
  assert.equal(actors.mixers.length, 3);
  const skins: SkinnedMesh[] = [];
  actors.root.traverse(object => { if (object instanceof SkinnedMesh && object.name === "vanguard_Mesh") skins.push(object); });
  assert.equal(skins.length, 3);
  assert.equal(new Set(skins.map(skin => skin.skeleton)).size, 3);
  const snapshot = () => {
    actors.root.updateMatrixWorld(true);
    return skins.map(skin => skin.skeleton.bones.map(bone => bone.matrixWorld.elements.slice()));
  };
  const before = snapshot();
  actors.mixers[1]!.update(0.25);
  const after = snapshot();
  assert.deepEqual(before[0], after[0], "仅更新跑步动画时，待机角色不受影响");
  assert.notDeepEqual(before[1], after[1]);
  assert.deepEqual(before[2], after[2], "仅更新跑步动画时，行走角色不受影响");
  actors.dispose();
});

test("共享模式只使用一个混合器，三个网格共享骨骼且尺寸正常", async () => {
  const { prepareMultipleActors } = await import("../../app/lib/three/multipleAnimationScene.ts");
  const model = await loadRig(retargetingModels[1]);
  // 反复切换不能销毁共享的原始模型几何体。
  for (const shared of [true, false, true]) {
    const actors = prepareMultipleActors(model, shared);
    assert.equal(actors.mixers.length, shared ? 1 : 3);
    const skins: SkinnedMesh[] = [];
    actors.root.traverse(object => { if (object instanceof SkinnedMesh && object.name === "vanguard_Mesh") skins.push(object); });
    assert.equal(skins.length, 3);
    assert.equal(new Set(skins.map(skin => skin.skeleton)).size, shared ? 1 : 3);
    const poses: number[][] = [];
    for (let frame = 0; frame < 3; frame++) {
      for (const mixer of actors.mixers) mixer.update(0.2);
      actors.root.updateMatrixWorld(true);
      for (const skin of skins) {
        skin.computeBoundingBox();
        const size = new Box3().setFromObject(skin).getSize(new Vector3());
        assert.ok(size.y > 0.5 && size.y < 3, `角色高度异常：${size.y}`);
      }
      poses.push(skins[0]!.skeleton.bones.flatMap(bone => bone.matrixWorld.elements));
    }
    assert.notDeepEqual(poses[0], poses[1]);
    actors.dispose();
  }
});

