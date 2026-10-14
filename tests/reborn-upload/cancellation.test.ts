/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import type { UploadChunkAdapter, UploadChunkPart, UploadChunkTask, UploadRequestOptions } from '../../app/components/reborn/ui/reborn-upload/reborn-upload.config';
import assert from 'node:assert/strict';
import { it } from 'node:test';
import { deferred, flush, mockNetwork, mountUpload } from './harness';

for (const all of [false, true]) {
  it(`beforeUpload 等待期间 ${all ? 'abort() 中止全部' : 'abort(file) 只中止目标'}，钩子返回后不恢复上传`, async (t) => {
    const requests = mockNetwork(t);
    const gate = deferred<boolean>();
    const view = mountUpload(t, { beforeUpload: () => gate.promise });
    const first = view.add('甲.txt');
    view.add('乙.txt');
    view.api.submit();
    view.api.abort(all ? undefined : first);
    gate.resolve(true);
    await flush();
    assert.equal(requests.length, all ? 0 : 1);
    assert.equal(view.files[0]!.status, 'ready');
    if (!all) assert.equal((requests[0]!.body!.get('file') as File).name, '乙.txt');
  });
}

const outcomes = ['通过', '拒绝', '异常', '替换文件'] as const;
for (const outcome of outcomes) {
  for (const oldFirst of [false, true]) {
    it(`取消后重新 submit：旧钩子${oldFirst ? '先' : '后'}返回${outcome}不影响新上传`, async (t) => {
      const requests = mockNetwork(t);
      const old = deferred<boolean | Blob>();
      const current = deferred<boolean | Blob>();
      let calls = 0;
      const view = mountUpload(t, { beforeUpload: () => (++calls === 1 ? old.promise : current.promise) });
      const raw = view.add();
      view.api.submit();
      view.api.abort(raw);
      view.api.submit();
      const settleOld = () => {
        if (outcome === '异常') old.reject(new Error('旧校验失败'));
        else old.resolve(outcome === '替换文件' ? new File(['旧文件'], '旧.txt') : outcome === '通过');
      };
      if (oldFirst) { settleOld(); await flush(); }
      current.resolve(new File(['当前内容'], '新.txt'));
      await flush();
      if (!oldFirst) { settleOld(); await flush(); }
      assert.equal(calls, 2);
      assert.equal(requests.length, 1);
      assert.equal(requests[0]!.abortCalls, 0);
      assert.equal((requests[0]!.body!.get('file') as File).name, '新.txt');
      assert.equal(view.files.length, 1);
      assert.equal(view.files[0]!.raw!.name, '新.txt');
      assert.equal(view.files[0]!.status, 'uploading');
      assert.deepEqual(view.events, ['change']);
      requests[0]!.dispatchEvent(new Event('load'));
      assert.equal(view.files[0]!.status, 'success');
      assert.deepEqual(view.events, ['change', 'success', 'change']);
    });
  }
}

for (const outcome of outcomes) {
  it(`卸载时仍等待 beforeUpload，之后返回${outcome}不上传也不触发回调`, async (t) => {
    const requests = mockNetwork(t);
    const gate = deferred<boolean | Blob>();
    const view = mountUpload(t, { beforeUpload: () => gate.promise });
    view.add();
    view.api.submit();
    view.unmount();
    if (outcome === '异常') gate.reject(new Error('迟到的错误'));
    else gate.resolve(outcome === '替换文件' ? new Blob(['新内容']) : outcome === '通过');
    await flush();
    assert.equal(requests.length, 0);
    assert.equal(view.files.length, 1);
    assert.equal(view.files[0]!.status, 'ready');
    assert.deepEqual(view.events, ['change']);
  });
}

it('卸载中止全部默认 XHR，屏蔽同步中止错误和迟到的进度、成功、失败', async (t) => {
  const requests = mockNetwork(t);
  const view = mountUpload(t);
  view.add('甲.txt');
  view.add('乙.txt');
  view.api.submit();
  await flush();
  assert.equal(requests.length, 2);
  view.unmount();
  const snapshot = JSON.stringify(view.files);
  requests.forEach(request => request.lateEvents());
  assert.deepEqual(requests.map(request => request.abortCalls), [1, 1]);
  assert.equal(JSON.stringify(view.files), snapshot);
  assert.deepEqual(view.events, ['change', 'change']);
});

for (const reject of [false, true]) {
  it(`卸载中止自定义请求句柄，忽略其迟到回调及 Promise ${reject ? 'reject' : 'resolve'}`, async (t) => {
    mockNetwork(t);
    const gate = deferred<unknown>();
    let options!: UploadRequestOptions;
    let abortCalls = 0;
    const view = mountUpload(t, { httpRequest: (value: UploadRequestOptions) => {
      options = value;
      return Object.assign(gate.promise, { abort() { abortCalls++; options.onError(new Error('同步中止')); } });
    } });
    view.add();
    view.api.submit();
    await flush();
    view.unmount();
    const snapshot = JSON.stringify(view.files);
    options.onProgress(Object.assign(new ProgressEvent('progress'), { percent: 80 }));
    options.onSuccess('迟到成功');
    options.onError(new Error('迟到失败'));
    if (reject) gate.reject(new Error('迟到的 Promise 错误'));
    else gate.resolve('迟到的 Promise 成功');
    await flush();
    assert.equal(abortCalls, 1);
    assert.equal(JSON.stringify(view.files), snapshot);
    assert.deepEqual(view.events, ['change']);
  });

  it(`自定义请求没有 abort 句柄时，卸载后仍屏蔽 Promise ${reject ? 'reject' : 'resolve'}`, async (t) => {
    mockNetwork(t);
    const gate = deferred<unknown>();
    const view = mountUpload(t, { httpRequest: () => gate.promise });
    view.add();
    view.api.submit();
    await flush();
    view.unmount();
    if (reject) gate.reject(new Error('迟到失败'));
    else gate.resolve('迟到成功');
    await flush();
    assert.deepEqual(view.events, ['change']);
  });
}

for (const stage of ['init', 'uploadChunk', 'merge'] as const) {
  it(`卸载时取消分片 ${stage} 阶段，迟到的完成和进度不继续流程`, async (t) => {
    mockNetwork(t);
    const gate = deferred<string>();
    const tasks: UploadChunkTask[] = [];
    const parts: UploadChunkPart[] = [];
    let merges = 0;
    const chunk: UploadChunkAdapter = {
      chunkSize: 2, concurrency: 2, retries: 0,
      init(task) { tasks.push(task); return stage === 'init' ? gate.promise : '会话'; },
      uploadChunk(part) { tasks.push(part); parts.push(part); return stage === 'uploadChunk' ? gate.promise : undefined; },
      merge(task) { tasks.push(task); merges++; return stage === 'merge' ? gate.promise : '已合并'; },
    };
    const view = mountUpload(t, { chunk });
    view.add();
    view.api.submit();
    await flush();
    assert.equal(parts.length, stage === 'init' ? 0 : 2);
    assert.equal(merges, stage === 'merge' ? 1 : 0);
    view.events.length = 0;
    view.unmount();
    const snapshot = JSON.stringify(view.files);
    const aborted = tasks.every(task => task.signal.aborted);
    parts.forEach(part => part.onProgress(90));
    gate.resolve('迟到完成');
    await flush();
    assert.equal(aborted, true);
    assert.equal(parts.length, stage === 'init' ? 0 : 2);
    assert.equal(merges, stage === 'merge' ? 1 : 0);
    assert.equal(JSON.stringify(view.files), snapshot);
    assert.deepEqual(view.events, []);
  });
}

it('卸载期间等待异步 data，不再发送请求', async (t) => {
  const requests = mockNetwork(t);
  const data = deferred<Record<string, unknown>>();
  const view = mountUpload(t, { data: data.promise });
  view.add();
  view.api.submit();
  view.unmount();
  data.resolve({ token: '测试字段' });
  await flush();
  assert.equal(requests.length, 0);
  assert.deepEqual(view.events, ['change']);
});

it('未取消的 beforeUpload 拒绝仍移除文件，通过仍完成默认上传', async (t) => {
  const requests = mockNetwork(t);
  const view = mountUpload(t, { beforeUpload: (file: File) => file.name !== '拒绝.txt' });
  view.add('拒绝.txt');
  view.add('通过.txt');
  view.api.submit();
  await flush();
  assert.equal(view.files.length, 1);
  assert.equal(view.files[0]!.name, '通过.txt');
  assert.equal(requests.length, 1);
  requests[0]!.dispatchEvent(new Event('load'));
  assert.equal(view.files[0]!.status, 'success');
  assert.deepEqual(view.events, ['change', 'change', 'remove', 'success', 'change']);
});
