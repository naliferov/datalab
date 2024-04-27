const x = (o) => {
  if (o.isStoped) return x;

  o.isStoped = true;
  return x(o);
};

export const BigX = (symbol) => {

  const _ = symbol;
  const f = {};

  return async (x) => {
    const callMyName = x[_].x;
    if (callMyName) {
      return await f[callMyName](x);
    }

    const subscribeName = x[_].y;
    if (subscribeName) {
      f[subscribeName] = x[_].f;
    }
  }
}

export const b = {
  set_(_) { this._ = _; },
  get_() { return this._; },

  setExec(exec) { this.exec = exec; },
  async p(e, d) {
    const _ = this._;
    const inject = {
      _: _,
      [_]: { b: this, x: e }
    }
    return await this.exec({ ...d, ...inject });
  },
  async s(e, f) {
    const _ = this._;
    return await this.exec({ [_]: { y: e, f } });
  },
  async x(d) {
    return this.p('x', d);
  },
}

export const busFactory = () => {

  const _ = Symbol();

  const B = Object.create(b);
  B.set_(_);
  B.setExec(BigX(_));

  const proxy = new Proxy(function () { }, {
    get(t, p) { return B[p]; },
    apply(t, thisArg, args) {
      return B.p('x', args[0]);
    }
  });

  return proxy;
}

export const u = async (x) => {
  if (x.set) return await set(x);
  if (x.get) return await get(x);
  if (x.del) return await del(x);
  if (x.getHtml) return await getHtml(x);
  if (x.signUp) return await signUp(x);
}

const getHtml = async (x) => {

  const { b } = x[x._];
  const { mtimeMs } = await b.p('fs', { stat: { path: x.jsFileName } });

  return {
    bin: `
<!DOCTYPE html>
<html>
<head>
    <title>varcraft</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&family=Roboto:wght@400;700&display=swap" rel="stylesheet">
</head>
<body><script type="module" src="${x.jsFileName}?${mtimeMs}"></script></body>
</html>
    `,
    isHtml: true,
  }
};

const set = async (x) => {

  const set = { ...x.set, bin: x.bin };

  const { type, id, path, k, ok, v, bin, binName, repoName } = set;
  const { b } = x[x._];
  const _ = await b.p('get_');

  if (v && v.i) delete v.i;

  const getFromRepo = async (id) => await b({ get: { id, useRepo: true } });

  //CHANGE ORDER
  if (id && ok && typeof ok === 'object') {
    const vById = await getFromRepo(id);
    if (!vById) return { ok: 0, msg: 'v not found' };

    const { from, to } = ok;

    if (vById.m) {
      if (!vById.o) return { ok: 0, msg: 'v.o not found' };

      const i = vById.o.splice(from, 1)[0];
      vById.o.splice(to, 0, i);
    }
    if (vById.l) {
      const i = vById.l.splice(from, 1)[0];
      vById.l.splice(to, 0, i);
    }
    await b.p('repo', { set: { id, v: vById } });

    return { id, ok };
  }

  //SET key and value to id of (MAP) or add value (LIST)
  if (type && id && v) {
    const vById = await getFromRepo(id);
    if (!vById) return { msg: 'v not found' };

    if (type === 'm' && vById.m) {
      if (vById.m[k]) return { msg: `k [${k}] already exists in vById` };
      if (!vById.o) return { msg: `v.o is not found by [${id}]` };
      if (ok === undefined) return { msg: `ok is empty` };

      const newId = await b.p('getUniqId');
      vById.m[k] = newId;
      vById.o.splice(ok, 0, k);

      await b.p('repo', { set: { id: newId, v } });
      await b.p('repo', { set: { id, v: vById } });

      return { type, id, k, v, newId };
    }
    if (type === 'l' && vById.l) {
      const newId = await b.p('getUniqId');
      vById.l.push(newId);

      await b.p('repo', { set: { id: newId, v } });
      await b.p('repo', { set: { id, v: vById } });

      return { type, id, v, newId };
    }

    return { msg: 'Not found logic for change vById', vById };
  }

  //SET binary file and save it's ID to specific varID
  if (id && bin && binName) {

    const vById = await getFromRepo(id);
    if (!vById) return { msg: 'v not found by id', id };
    //todo clear previous binary file;

    let ext = binName.split('.').at(-1);
    let t = '';

    if (ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'gif' || ext === 'webp') {
      t = 'i';
    }

    const newId = await b.p('getUniqId');
    const v = { b: { id: newId, t } };

    await b.p('repo', { set: { id: newId, v: bin, format: 'raw' } });
    await b.p('repo', { set: { id, v } });

    return { id };
  }
  //SET value by ID
  if (id && v) {
    await b.p('repo', { set: { id, v }, repoName });
    return { id, v };
  }

  const {
    oldId, newId, key,
    oldKey, newKey
  } = set;

  //COPY or MOVE MAP key from one ID to another ID
  if (oldId && newId && oldId !== newId && key) {

    const oldV = await getFromRepo(oldId);
    const newV = await getFromRepo(newId);

    if (!oldV || !newV) return { msg: 'oldV or oldV not found' };
    if (!oldV.m || !newV.m) return { msg: 'oldV.m or newV.m not found' };
    if (!oldV.o || !newV.o) return { msg: 'oldV.o or newV.o not found' };

    if (!oldV.m[key]) return { msg: `key [${key}] not found in oldV.m` };
    if (newV.m[key]) return { msg: `newV.m already have key [${key}]` };

    newV.m[key] = oldV.m[key];
    delete oldV.m[key];

    const index = oldV.o.indexOf(key);
    if (index !== -1) oldV.o.splice(index, 1);
    newV.o.push(key);

    await b({ set: { id: oldId, v: prepareForTransfer(oldV) } });
    await b({ set: { id: newId, v: prepareForTransfer(newV) } });
    return { oldId, newId, key };
  }

  //RENAME of MAP key
  if (id && oldKey && newKey) {

    const v = await getFromRepo(id);
    if (!v.m || !v.m[oldKey]) {
      return { msg: 'v.m or v.m[oldKey] not found' };
    }

    v.m[newKey] = v.m[oldKey];
    delete v.m[oldKey];

    if (!v.o) return { msg: 'o not found in map' };
    const ok = v.o.indexOf(oldKey);
    if (ok === -1) return { msg: `order key for key [${oldKey}] not found` };
    v.o[ok] = newKey;

    await b({ set: { id, v } });
    return { id, oldKey, newKey };
  }

  //SET BY PATH
  if (path) {

    const set = await createSet({ _, b, path, type });
    if (!set) return;

    let data = v;

    for (let i = 0; i < set.length; i++) {
      const v = set[i];
      const isLast = i === set.length - 1;

      if (isLast) {
        if (v.l) {
          const newId = await b.p('getUniqId');
          const newV = { _: { id: newId }, v: data };
          await b({ set: { id: newId, v: newV } });

          v.l.push(newId);
          if (!v[_].new) v[_].updated = true;
        } else if (v.v) {
          v.v = data;
          if (!v[_].new) v[_].updated = true;
        }
      }
      if (v[_].new || v[_].updated) {
        await b({ set: { id: v[_].id, v } });
      }
    }

    return set.at(-1);
  }
}

const get = async (x) => {

  let { id, subIds, path, depth, getMeta, useRepo, repoName } = x.get;
  const { b } = x[x._];

  if (id) {
    if (useRepo) return await b.p('repo', { get: { id }, repoName });

    return await getVarData({ b, id, subIds: new Set(subIds), depth, getMeta });
  }

  if (path) {
    const _ = await b.p('get_');

    if (!Array.isArray(path) && typeof path === 'string') {
      path = path.split('.');
    }

    const pathSet = await createSet({ _, b, path, getMeta, repoName, isNeedStopIfVarNotFound: true });
    if (!pathSet) return;

    const v = pathSet.at(-1);
    if (!v) return;

    if (useRepo) return v;

    return await getVarData({ b, v, depth, getMeta });
  }
}

const del = async (x) => {

  const { path, id, k, ok } = x.del;
  const { b } = x[x._];
  const _ = await b.p('get_');

  //DELETE KEY IN MAP with subVars
  if (id && k) {
    const v = await b.x({ get: { id, useRepo: true } });
    if (!v) return { msg: 'v not found' };
    if (!v.m && !v.l) return { msg: 'v is not map and not list' };

    const isMap = Boolean(v.m);
    const isList = Boolean(v.l);

    const targetId = isMap ? v.m[k] : k;
    if (!targetId) return { msg: `targetId not found by [${k}]` };

    const targetV = await b.x({ get: { id: targetId, useRepo: true } });
    if (!targetV) return { msg: `targetV not found by [${targetId}]` };
    targetV[_] = { id: targetId };

    if (isMap) {
      if (ok === undefined) return { msg: `oKey is empty` };
      if (!v.o) return { msg: `v.o is not found by [${id}]` };
      if (!v.o[ok]) return { msg: `v.o[oKey] is not found by key [${ok}]` };
    }

    const isDelWithSubVars = await delWithSubVars({ _, b, v: targetV });
    if (isDelWithSubVars || true) {

      if (isMap) {
        delete v.m[k];
        v.o = v.o.filter(currentK => currentK !== k);
      } else if (isList) {
        v.l = v.l.filter(currentK => currentK !== k);
      }

      await b({ set: { id, v } });
    }

    return { id, k };
  }

  //DELETE BY ID
  if (id && id !== 'root') {
    return await b.p('repo', { del: { id } });
  }

  //DELETE BY PATH
  if (path) {

    const set = await createSet({ _, b, path, isNeedStopIfVarNotFound: true });

    if (!set || set.length < 2) return { msg: 'var set not found' };

    const parentV = set.at(-2);
    const v = set.at(-1);
    const k = v[_].name;
    const isMap = Boolean(parentV.m);
    const isList = Boolean(parentV.l);

    const vId = parentV.m[k];
    if (!vId) { console.log('log', { msg: `key [${k}] not found in v1` }); return; }

    const isDelWithSubVars = await delWithSubVars({ _, b, v });
    if (isDelWithSubVars) {

      if (isMap) {
        delete parentV.m[k];
        parentV.o = parentV.o.filter(currentK => currentK !== k);

        await b({ set: { id: parentV[_].id, v: parentV } });

      } else if (isList) {
        console.log('isList', v);
      }
    }
  }
}
export const it = async (v) => {
  //if (v.m) {}
}
const signUp = async (x) => {
  const { email, password } = x.signUp;
  const { b } = x[x._];
  const _ = await b.p('get_');

  let users = await b({ get: { path: 'users', useRepo: true } });
  if (!users) {

    const root = await b({ get: { id: 'root', useRepo: true } });
    users = await mkvar(b, 'm');

    if (users[_].id) {
      root.m.users = users[_].id;
      root.o.push('users');

      await b({ set: { id: users[_].id, v: users } });
      await b({ set: { id: 'root', v: root } });
    }
  }

  const user = await mkvar(b, 'm');
  user.m.password = password;
  user.o.push('password');

  if (users.m[email]) return { msg: 'user with this email already exists' };

  users.m[email] = user[_].id;

  await b({ set: { id: user[_].id, v: user } });
  await b({ set: { id: users[_].id, v: users } });

  return { email, password };
}
const delWithSubVars = async (x) => {
  const { _, b, v } = x;
  const varIds = await getVarIds({ b, v }); console.log('varIds for del', varIds);

  const len = Object.keys(varIds).length;
  if (len > 50) { await b.p('log', { msg: `Try to delete ${len} keys at once` }); return; }

  for (let id of varIds) await b({ del: { id } });
  await b({ del: { id: v[_].id } });
  console.log('del', v[_].id);

  return true;
}

export const createSet = async (x) => {

  const { _, b, repoName, path, isNeedStopIfVarNotFound } = x;
  const pathArr = [...path];
  const type = x.type || 'v';

  let v1 = await b.p('repo', { get: { id: 'root' }, repoName });
  v1[_] = { id: 'root', name: 'root' };
  //if (getMeta) v1.i = { id: 'root' };
  if (pathArr[0] === 'root') pathArr.shift();

  let set = [v1];

  for (let i = 0; i < pathArr.length; i++) {
    const name = pathArr[i];
    if (!name) return;

    const v1 = set.at(-1);
    let v2;

    if (!v1.m && !v1.l) {
      console.log(`v1 hasn't m or l prop for getting name [${name}]`);
      return;
    }

    let id = v1.m[name];

    if (id) {
      v2 = await b.p('repo', { get: { id }, repoName });
      if (v2) v2[_] = { id };
    }

    if (!v2) {
      if (isNeedStopIfVarNotFound) return;

      const vType = (i === pathArr.length - 1) ? type : 'm';
      v2 = await mkvar(b, vType, _);

      v1.m[name] = v2[_].id;
      if (!v1.o) v1.o = [];
      v1.o.push(name);

      if (!v1[_].new) v1[_].updated = true;
    }

    v2[_].name = name;

    set.push(v2);
  }

  return set;
}

const mkvar = async (b, type) => {

  const _ = await b.p('get_');
  const id = await b.p('getUniqId');
  let v = {
    [_]: { id, new: true }
  };

  if (type === 'b') v.b = {};
  else if (type === 'v') v.v = true;
  else if (type === 'm') {
    v.m = {};
    v.o = [];
  }
  else if (type === 'l') v.l = [];
  else if (type === 'f') v.f = {};
  else if (type === 'x') v.x = {};
  else throw new Error(`Unknown type [${type}]`);

  return v;
}

export const getVarData = async (x) => {

  const { b, id, subIds, getMeta, depth = 1 } = x;
  let v = x.v;

  const _ = await b.p('get_');

  if (id && !v) {
    v = await b.p('repo', { get: { id } });
    if (!v) { console.error(`v not found by id [${id}]`); return; }
    v[_] = { id, t: getType(v) };
    if (getMeta) v.i = { ...v[_] };
  }

  let data = { [_]: v[_] };
  if (v.i) data.i = v.i;

  const isNeededId = Boolean(subIds && data.i && subIds.has(data.i.id));
  if (!isNeededId && depth <= 0) {

    if (data.i) data.i.openable = true; //todo openable is only certain data types m, l;
    return data;
  }

  const processItem = async (x) => {

    const { id, k, v } = x;

    const v2 = await b.p('repo', { get: { id } });

    v2[_] = { id, t: getType(v2) };
    if (getMeta) v2.i = { ...v2[_] };

    let data;
    if (v2.b || v2.v) {
      data = v2;
    } else if (v2.l || v2.m) {
      data = await getVarData({ b, v: v2, subIds, getMeta, depth: depth - 1 });
    }

    if (v.m) v.m[k] = data;
    if (v.l) v.l.push(data);
  }

  if (v.b) data.b = v.b;
  else if (v.v) data.v = v.v;
  else if (v.l) {
    data.l = [];
    for (let id of v.l) await processItem({ id, v: data })
  } else if (v.m) {
    if (v.o) data.o = v.o;
    data.m = {};
    for (let k in v.m) await processItem({ id: v.m[k], k, v: data });
  }

  return data;
}

export const getVarIds = async (x) => {

  const { b, v } = x;

  const ids = [];
  if (!v.b && !v.m && !v.l) return ids;

  const getIds = async (v) => {

    if (v.b) {
      if (v.b.id) ids.push(v.b.id);
    } else if (v.m) {
      for (let k in v.m) {
        const id = v.m[k];
        ids.push(id);
        await getIds(await b({ get: { id, useRepo: true } }));
      }
    } else if (v.l) {
      for (let id of v.l) {
        ids.push(id);
        await getIds(await b({ get: { id, useRepo: true } }));
      }
    }
  }

  await getIds(v);

  return ids;
}

export const getType = (v) => {
  if (v.b) return 'b';
  if (v.m) return 'm';
  if (v.l) return 'l';
  if (v.v) return 'v';
  return 'unknown';
}

export const prepareForTransfer = (v) => {
  const d = {};

  if (v.b) d.b = v.b;
  if (v.v) d.v = v.v;
  if (v.m) d.m = v.m;
  if (v.l) d.l = v.l;
  if (v.o) d.o = v.o;
  if (v.f) d.f = v.f;
  if (v.x) d.x = v.x;

  return d;
}

// UTILS //
export const isObj = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
export const pathToArr = path => {
  if (!path) return [];
  return Array.isArray(path) ? path : path.split('.');
}
export const parseCliArgs = cliArgs => {
  const args = {};
  let num = 0;

  for (let i = 0; i < cliArgs.length; i++) {
    if (i < 2) continue; //skip node and scriptName args

    let arg = cliArgs[i];
    args[num++] = arg;

    if (arg.includes('=')) {
      let [k, v] = arg.split('=');
      if (!v) {
        args[num] = arg; //start write args from main 0
        continue;
      }
      args[k.trim()] = v.trim();
    } else {
      args['cmd'] = arg;
    }
  }
  return args;
}
export const getDateTime = () => {
  const d = new Date;

  let year = d.getFullYear();
  let month = ('0' + (d.getMonth() + 1)).slice(-2); // Months are zero-based
  let day = ('0' + d.getDate()).slice(-2);
  const hours = ('0' + d.getHours()).slice(-2);
  const minutes = ('0' + d.getMinutes()).slice(-2);
  const seconds = ('0' + d.getSeconds()).slice(-2);

  return year + '-' + month + '-' + day + '_' + hours + ':' + minutes + ':' + seconds;
}

//TRANSPORT
export const httpHandler = async (x) => {

  const { b, runtimeCtx, rq, fs } = x;
  const ctx = {
    rq, headers: rq.headers,
    url: new URL('http://t.c' + rq.url),
    query: {}, body: {},
  };
  ctx.url.searchParams.forEach((v, k) => ctx.query[k] = v);

  if (runtimeCtx.rtName === 'deno' || runtimeCtx.rtName === 'bun') {
    ctx.url = new URL(rq.url);
  }
  if (typeof rq.headers.get !== 'function') {
    ctx.headers = { headers: rq.headers, get(k) { return this.headers[k]; } };
  }
  if (ctx.url.pathname.toLowerCase().includes('state/sys')) {
    return httpMkResp({ code: 403, v: 'Access denied', runtimeCtx });
  }

  if (fs) {
    const r = await httpGetFile({ ctx, fs });
    if (r.file) {
      return httpMkResp({ v: r.file, mime: r.mime, runtimeCtx, isBin: true });
    }
    if (r.fileNotFound) {
      return httpMkResp({ code: 404, v: 'File not found', runtimeCtx });
    }
  }

  const body = await httpGetBody({ ctx, runtimeCtx });
  let msg = body ?? query;
  if (msg.err) {
    console.log('msg.err', msg.err);
    return httpMkResp({ v: 'error processing rq', runtimeCtx });
  }

  const xHeader = ctx.headers.get('x');
  if (msg.bin && xHeader) {
    msg = { bin: msg.bin, ...JSON.parse(xHeader) };

    if (runtimeCtx.rtName === 'deno') {
      msg.bin = new runtimeCtx.Buffer(msg.bin);
    }
  }
  if (Object.keys(msg).length < 1) {
    msg.getHtml = true;
    msg.jsFileName = runtimeCtx.fileName;
  }

  const o = await b.p('x', msg);
  if (!o) return httpMkResp({ v: 'Default response', runtimeCtx });

  if (o.bin && o.isHtml) {
    const { bin, isHtml } = o;
    const mime = isHtml ? 'text/html' : null;
    return httpMkResp({ v: bin, isBin: bin, mime, runtimeCtx });
  }
  return httpMkResp({ v: o, runtimeCtx });
};
const httpGetBody = async ({ ctx, runtimeCtx, limitMb = 12 }) => {

  let limit = limitMb * 1024 * 1024;
  const rq = ctx.rq;
  const readAsJson = ctx.headers.get('content-type') === 'application/json';

  if (!rq.on) {
    if (!rq.body) return {};
    // const b = [];
    // let len = 0;
    // for await (const p of rq.body) {
    //   b.push(p);
    //   len += p.length;
    //   if (len > limit) {
    //     return;
    //   }
    // }
    const bin = await rq.arrayBuffer();
    if (readAsJson) return JSON.parse((new TextDecoder('utf-8')).decode(bin));
    return { bin };
  }

  return new Promise((resolve, reject) => {
    let b = [];
    let len = 0;

    rq.on('data', chunk => {
      len += chunk.length;
      if (len > limit) {
        rq.destroy();
        resolve({ err: `limit reached [${limitMb} mb]` });
        return;
      }
      b.push(chunk);
    });
    rq.on('error', err => {
      rq.destroy();
      reject({ err });
    });
    rq.on('end', () => {
      let msg = {};
      if (b.length > 0) msg.bin = runtimeCtx.Buffer.concat(b);

      if (readAsJson) {
        try { msg = JSON.parse(b.toString()); }
        catch (e) { msg = { err: 'json parse error', data: b.toString() }; }
      }
      resolve(msg);
    });
  });
}
const httpGetFile = async ({ ctx, fs }) => {

  const query = ctx.query;
  let ext, mime;

  if (!query.bin) {
    const lastPart = ctx.url.pathname.split('/').pop();
    const spl = lastPart.split('.');

    if (spl.length < 2) return {};

    ext = spl.at(-1);
    if (!ext) return {};

    mime = { html: 'text/html', js: 'text/javascript', css: 'text/css', map: 'application/json' }[ext];
  }

  try {
    return { file: await fs.readFile('.' + ctx.url.pathname), mime };
  } catch (e) {
    if (e.code !== 'ENOENT') console.log('Error of resolve file', e);
    return { fileNotFound: true };
  }
}
const httpMkResp = ({ runtimeCtx, code = 200, mime, v, isBin }) => {

  const send = (v, typeHeader) => {
    const headers = { 'content-type': typeHeader };
    try {
      return new runtimeCtx.Response(v, { status: code, headers });
    } catch (e) {
      console.log('err sending response', e);
    }
  }

  if (isBin) return send(v, mime ?? '');
  if (typeof v === 'object') {
    return send(JSON.stringify(v), 'application/json');
  }

  const plain = 'text/plain; charset=utf-8';
  if (typeof v === 'string' || typeof v === 'number') {
    return send(v, mime ?? plain);
  }
  return send('empty resp', plain);
}

export class HttpClient {

  constructor(baseURL = '', headers = {}) {
    this.headers = headers;
    if (baseURL) this.baseURL = baseURL;
  }

  processHeaders(headers, params) {
    if (!headers['Content-Type']) {
      if (params instanceof ArrayBuffer) {
        headers['Content-Type'] = 'application/octet-stream';
      } else {
        headers['Content-Type'] = 'application/json';
      }
    }
  }

  async rq(method, url, params, headers, options = {}) {
    let timeoutId;
    const controller = new AbortController();
    if (options.timeout) {
      timeoutId = setTimeout(() => controller.abort(), options.timeout);
    }
    this.processHeaders(headers, params);

    const fetchParams = { method, headers, signal: controller.signal };

    if (method === 'POST' || method === 'PUT') {
      if (params instanceof ArrayBuffer) {
        fetchParams.body = params;
      } else {
        fetchParams.body = headers['Content-Type'] === 'application/json' ? JSON.stringify(params) : this.strParams(params);
      }
    } else {
      if (Object.keys(params).length) url += '?' + new URLSearchParams(params);
    }

    const response = await fetch(this.baseURL ? this.baseURL + url : url, fetchParams);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    let r = {
      statusCode: response.status,
      headers: response.headers
    };
    if (options.blob) {
      r.data = await response.blob();
    } else {
      const t = response.headers.get('content-type') ?? '';
      r.data = t.startsWith('application/json') ? await response.json() : await response.text();
    }
    return r;
  }
  async get(url, params = {}, headers = {}, options = {}) {
    return await this.rq('GET', url, params, headers, options);
  }
  async post(url, params = {}, headers = {}, options = {}) {
    return await this.rq('POST', url, params, headers, options);
  }
  async delete(url, params = {}, headers = {}, options = {}) { return await this.rq('DELETE', url, params, headers, options); }
  strParams(params) {
    let str = '';
    for (let k in params) str = str + k + '=' + params[k] + '&';
    return str.length ? str.slice(0, -1) : '';
  }
}

//STORAGE
export class Storage {

  constructor(path, b) {
    this.path = path;
    this.b = b;
  }
  getStatePath() { return this.path; }

  async set(id, v, format = 'json') {
    const path = `${this.path}/${id}`;

    this.b.p('storage', { set: { id, path, v, format } });
  }
  async get(id, format = 'json') {
    const path = `${this.path}/${id}`;

    return this.b.p('storage', { get: { id, path, format } });
  }
  async del(id) {
    const path = `${this.path}/${id}`;

    return this.b.p('storage', { del: { id, path } });
  }
}

export class IndexedDb {

  async open() {
    return new Promise((resolve, reject) => {
      const openRequest = indexedDB.open('varcraft');
      openRequest.onerror = () => {
        reject(openRequest.error);
      };
      openRequest.onsuccess = () => {
        this.db = openRequest.result;
        resolve(this.db);
      };
      openRequest.onupgradeneeded = () => {
        let db = openRequest.result;
        if (!db.objectStoreNames.contains('vars')) {
          db.createObjectStore('vars');
        }
      };
    });
  }

  async set(x) {

    const { id, v } = x;

    return new Promise((resolve, reject) => {

      const t = this.db.transaction('vars', 'readwrite');
      const vars = t.objectStore('vars');

      const rq = vars.put(v, id);
      rq.onsuccess = () => resolve(rq.result);
      rq.onerror = () => reject(rq.error);
    });
  }

  async get(x) {

    const { id } = x;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction('vars', 'readonly');
      const vars = transaction.objectStore('vars');

      const rq = vars.get(id);
      rq.onsuccess = () => resolve(rq.result);
      rq.onerror = () => reject(rq.error);
    });
  }

  async del(x) {

    const { id } = x;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction('vars', 'readwrite');
      const vars = transaction.objectStore('vars');

      const rq = vars.delete(id);
      rq.onsuccess = () => resolve(rq.result);
      rq.onerror = () => reject(rq.error);
    });
  }
}

// FRONTEND //
export const docMk = (d, x) => {
  const { id, type, txt, events, css } = x;

  const o = d.createElement(type || 'div');
  if (txt) o.innerText = txt;

  if (id) o.id = id;

  const classD = x['class'];
  if (classD) {
    o.className = Array.isArray(classD) ? classD.join(' ') : classD;
  }
  if (events) for (let k in events) o.addEventListener(k, events[k]);
  if (css) for (let k in css) o.style[k] = css[k];

  return o;
}

export const docGetSizes = (o) => {
  let sizes = o.getBoundingClientRect();
  let scrollX = window.scrollX;
  let scrollY = window.scrollY;

  return {
    height: sizes.height,
    width: sizes.width,

    top: sizes.top + scrollY,
    bottom: sizes.bottom + scrollY,
    left: sizes.left + scrollX,
    right: sizes.right + scrollX,
    x: sizes.x + scrollX,
    y: sizes.y + scrollY,
  }
}

export const Frame = {

  setB(b) { this.b = b },
  async createStyle() {

    // .topBar {
    //         width: 100%;
    //         display: flex;
    //         align-items: center;
    //         padding: 0.5em 0;
    //         background: rgba(55, 53, 47, 0.08);
    //         cursor: pointer;
    //     }

    const css = `
    .shadow {
        box-shadow: 0 2px 4px 0 rgba(0,0,0,0.2);
    }
    .frame {
        position: absolute;
        /*top: 30px;*/
        overflow: hidden;

    }
    /* this create small glitches when after start and drag window */
    .frame.drag {
        -webkit-touch-callout: none; /* iOS Safari */
        -webkit-user-select: none;   /* Chrome/Safari/Opera */
        -khtml-user-select: none;    /* Konqueror */
        -moz-user-select: none;      /* Firefox */
        -ms-user-select: none;       /* Internet Explorer/Edge*/
        user-select: none;
    }

    .frame.drag .topBar {
        cursor: move;
    }
    .appTitle {
        font-weight: bold;
        white-space: nowrap;
        margin-left: 5px;
    }
    .resizer {
        position: absolute;
        min-width: 0.8em;
        min-height: 0.8em;
    }
    .resizeTop {
        left: 0.5em;
        right: 0.5em;
        top: -0.5em;
        cursor: ns-resize;
    }
    .resizeBottom {
        left: 0.5em;
        right: 0.5em;
        bottom: -0.5em;
        cursor: ns-resize;
    }
        `;
    return await this.b.p('doc.mk', { type: 'style', txt: css });
  },

  async init() {

    const p = async (event, data) => await this.b.p(event, data);

    this.o = await p('doc.mk', {
      class: ['frame'], css: {
        position: 'absolute',
        minWidth: '100px', minHeight: '100px',
        boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2)',
        transition: '0.3s',
      }
    });
    this.oShadow = this.o.attachShadow({ mode: 'open' });
    this.oShadow.appendChild(await this.createStyle());

    //const top = await p('doc.mk', { class: ['topBar'] });
    //await p('doc.ins', { o1: this.oShadow, o2: top });

    //this.container = await p('doc.mk', { class: 'container' });
    //this.oShadow.appendChild(this.container);

    const resizeTop = await p('doc.mk', { class: ['resizer', 'resizeTop'] });
    await p('doc.ins', { o1: this.oShadow, o2: resizeTop });
    //resizeTop.on('pointerdown', (e) => this.resizeTop(e, resizeTop));
    await p('doc.ins', { o1: this.oShadow, o2: resizeTop });

    const slot = await p('doc.mk', { type: 'slot' });
    slot.setAttribute('name', 'content');
    this.oShadow.append(slot);

    //top.on('pointerdown', (e) => this.topBarDragAndDrop(e));

    // const closeBtn = new this.O({ class: 'closeBtn' });
    // e('>', [closeBtn, top]);
    // closeBtn.on('click', () => {
    //     this.view.remove();
    //     if (this.app.close) {
    //         this.app.close();
    //     }
    //     s.e('appFrame.close', { appFrame: this });
    // });

    //const title = new v({ txt: this.app.getTitle(), class: 'appTitle' });
    //e('>', [title, topBar]);

    return;

    const nsResizeBottom = await p('doc.mk', { class: ['resizer', 'resizeBottom'] });
    await p('doc.ins', { o1: this.oShadow, o2: nsResizeBottom });
    await p('doc.on', { e: 'pointerdown', o: nsResizeBottom, f: (e) => this.resizeBottom(e) });


    //nsResizeBottom.on('pointerdown', (e) => this.resizeBottom(e));
    return;


    const resizeLeft = new v({ class: ['resizer', 'resizeLeft'] });
    //e('>', [resizeLeft, this.view]);
    resizeLeft.on('pointerdown', (e) => this.resizeLeft(e));

    const resizeRight = new v({ class: ['resizer', 'resizeRight'] });
    e('>', [resizeRight, this.view]);
    resizeRight.on('pointerdown', (e) => this.resizeRight(e));



    const resizeTopLeft = new v({ class: ['resizer', 'resizeTopLeft'] });
    e('>', [resizeTopLeft, this.view]);
    resizeTopLeft.on('pointerdown', (e) => this.resizeTopLeft(e));

    const resizeTopRight = new v({ class: ['resizer', 'resizeTopRight'] });
    e('>', [resizeTopRight, this.view]);
    resizeTopRight.on('pointerdown', (e) => this.resizeTopRight(e));

    const resizeBottomLeft = new v({ class: ['resizer', 'resizeBottomLeft'] });
    e('>', [resizeBottomLeft, this.view]);
    resizeBottomLeft.on('pointerdown', (e) => this.resizeBottomLeft(e));

    const resizeBottomRight = new v({ class: ['resizer', 'resizeBottomRight'] });
    e('>', [resizeBottomRight, this.view]);
    resizeBottomRight.on('pointerdown', (e) => this.resizeBottomRight(e));
  },

  setContent(content) {
    content.setAttribute('slot', 'content');
    this.o.append(content);
  },

  recalcDimensions() {
    const height = this.view.getSizes().height - this.topBar.getSizes().height;
    this.content.setSize(null, height);
  },
  setPosition(x, y) { this.view.setPosition(x, y); },
  setSize(width, height) { this.view.setSize(width, height); },
  getSizes() { return this.view.getSize(); },
  setDefaultSize() {
    if (this.app.getDefaultSize) {
      const { width, height } = this.app.getDefaultSize();
      this.setSize(width, height);
    }
  },

  topBarDragAndDrop(e) {
    const viewSizes = this.view.getSizes();
    const shift = { x: e.clientX - viewSizes.x, y: e.clientY - viewSizes.y };
    this.view.addClass('drag');

    s.e('input.pointer.setHandlers', {
      move: e => {
        const x = e.clientX - shift.x;
        const y = e.clientY - shift.y;
        this.view.setPosition(x, y);
        s.e('appFrame.changePosition', { appFrame: this, x, y });
      },
      up: (e) => {
        s.e('input.pointer.setHandlers', { move: null, up: null });
        this.view.removeClass('drag');
      }
    });
  },
  resizeTop(e) {

    const sizes = this.view.getSizes();

    const maxY = sizes.y + sizes.height;
    this.view.addClass('drag');

    s.e('input.pointer.setHandlers', {
      move: e => {
        const height = maxY - (e.clientY);
        this.view.setSize(null, height);
        this.view.setPosition(null, e.clientY);

        //this.recalcDimensions();
        //s.e('appFrame.changeSize', { appFrame: this, height });
        //s.e('appFrame.changePosition', { appFrame: this, y: e.clientY });
      },
      up: (e) => {
        s.e('input.pointer.setHandlers', { move: null, up: null });
        this.view.removeClass('drag');
      }
    });
  },
  resizeBottom(e) {
    console.log('test 9999');

    const sizes = this.view.getSizes();
    this.view.addClass('drag');

    s.e('input.pointer.setHandlers', {
      move: e => {
        const height = e.clientY - sizes.y;
        this.view.setSize(null, height);
        this.recalcDimensions();
        s.e('appFrame.changeSize', { appFrame: this, height });
      },
      up: (e) => {
        s.e('input.pointer.setHandlers', { move: null, up: null });
        this.view.removeClass('drag');
      }
    });
  },
  resizeLeft(e) {
    const sizes = this.view.getSizes();
    const maxW = sizes.x + sizes.width;
    this.view.addClass('drag');

    s.e('input.pointer.setHandlers', {
      move: e => {
        const width = maxW - e.clientX;
        this.view.setSize(width);
        this.view.setPosition(e.clientX);
        this.recalcDimensions();
        s.e('appFrame.changeSize', { appFrame: this, width });
        s.e('appFrame.changePosition', { appFrame: this, x: e.clientX });
      },
      up: (e) => {
        s.e('input.pointer.setHandlers', { move: null, up: null });
        this.view.removeClass('drag');
      }
    });
  },
  resizeRight(e) {
    const sizes = this.view.getSizes();
    this.view.addClass('drag');

    s.e('input.pointer.setHandlers', {
      move: e => {
        const width = e.clientX - sizes.x;
        this.view.setSize(width);
        this.recalcDimensions();
        s.e('appFrame.changeSize', { appFrame: this, width });
      },
      up: (e) => {
        s.e('input.pointer.setHandlers', { move: null, up: null });
        this.view.removeClass('drag');
      }
    });
  },
  resizeTopLeft(e) {
    const sizes = this.view.getSizes();
    const maxW = sizes.x + sizes.width;
    const maxН = sizes.y + sizes.height;
    this.view.addClass('drag');

    s.e('input.pointer.setHandlers', {
      move: e => {
        const height = maxН - e.clientY;
        const width = maxW - e.clientX;
        this.view.setSize(width, height);
        this.view.setPosition(e.clientX, e.clientY);
        this.recalcDimensions();

        s.e('appFrame.changeSize', { appFrame: this, width, height });
        s.e('appFrame.changePosition', { appFrame: this, x: e.clientX, y: e.clientY });
      },
      up: (e) => {
        s.e('input.pointer.setHandlers', { move: null, up: null });
        this.view.removeClass('drag');
      }
    });
  },
  resizeTopRight(e) {
    const sizes = this.view.getSizes();
    const maxН = sizes.y + sizes.height;
    this.view.addClass('drag');

    s.e('input.pointer.setHandlers', {
      move: e => {
        const height = maxН - e.clientY;
        const width = e.clientX - sizes.x;
        this.view.setSize(width, height);
        this.view.setPosition(null, e.clientY);
        this.recalcDimensions();

        s.e('appFrame.changeSize', { appFrame: this, width, height });
        s.e('appFrame.changePosition', { appFrame: this, y: e.clientY });
      },
      up: (e) => {
        s.e('input.pointer.setHandlers', { move: null, up: null });
        this.view.removeClass('drag');
      }
    });
  },
  resizeBottomLeft(e) {
    const sizes = this.view.getSizes();
    const maxW = sizes.x + sizes.width;
    this.view.addClass('drag');

    s.e('input.pointer.setHandlers', {
      move: e => {
        const width = maxW - e.clientX;
        const height = e.clientY - sizes.y;

        this.view.setSize(width, height);
        this.view.setPosition(e.clientX);
        this.recalcDimensions();
        s.e('appFrame.changeSize', { appFrame: this, width, height });
        s.e('appFrame.changePosition', { appFrame: this, x: e.clientX });
      },
      up: (e) => {
        s.e('input.pointer.setHandlers', { move: null, up: null });
        this.view.removeClass('drag');
      }
    });
  },
  resizeBottomRight(e) {

    const sizes = this.view.getSizes();
    this.view.addClass('drag');

    s.e('input.pointer.setHandlers', {
      move: e => {
        const width = e.clientX - sizes.x;
        const height = e.clientY - sizes.y;
        this.view.setSize(width, height);
        this.recalcDimensions();
        //s.e('appFrame.changeSize', { appFrame: this, width, height });
      },
      up: (e) => {
        //s.e('input.pointer.setHandlers', { move: null, up: null });
        this.view.removeClass('drag');
      }
    });
  },
}

export class DomPart {

  constructor(data) {

    this.data = data || {};

    const { id, type, txt, events, css, addShadowDOM } = this.data;

    const o = document.createElement(type || 'div');
    this.dom = o;

    if (txt) o.innerText = txt;

    const classD = this.data['class'];
    if (classD) {
      o.className = Array.isArray(classD) ? classD.join(' ') : classD;
    }
    if (events) for (let k in events) o.addEventListener(k, events[k]);
    if (css) for (let k in css) o.style[k] = css[k];
  }

  setDOM(dom) { this.dom = dom; }
  getDOM() { return this.dom; }
  getId() { return this.dom.id; }

  on(eventName, callback) { this.getDOM().addEventListener(eventName, callback); }
  off(eventName, callback) { this.getDOM().removeEventListener(eventName, callback); }

  setTxt(txt) { this.getDOM().innerText = txt; }
  getTxt() { return this.getDOM().innerText; }
  setHtml(txt) { this.getDOM().innerHTML = txt; }

  setVal(val) { this.getDOM().value = val; }
  getVal() { return this.getDOM().value; }

  setAttr(k, v) {
    this.getDOM().setAttribute(k, v);
    return this;
  }

  attachCSS() {
    const css = new DomPart({ type: 'style', txt: this.css })
    this.ins(css);
  }
  attachShadow() {
    this.shadow = this.getDOM().attachShadow({ mode: 'open' });
  }

  ins(domPart) {
    if (this.shadow) {
      this.shadow.appendChild(domPart.getDOM());
      return;
    }
    this.dom.appendChild(domPart.getDOM());
  }
}

export class Header extends DomPart {

  css = `
    .container {
      display: flex;
      font-family: 'Roboto', sans-serif;
      align-items: center;
      padding: 10px 0;
    }
    .logo {
      font-size: 23px;
      font-weight: bold;
    }
    .leftMenu {
      flex-grow: 1;
    }
    .btn {
      color: black;
      cursor: pointer;
    }
    .btn:hover {
      text-decoration: underline;
    }
    .signUp {
      margin-left: 10px;
    }
  `;

  constructor(data = {}) {

    data.type = 'header';

    super(data);
    this.attachShadow();
    this.attachCSS();

    const container = new DomPart({ class: 'container' });
    this.ins(container);

    const logo = new DomPart({ class: 'logo', txt: 'VARCRAFT' });
    container.ins(logo);

    const leftMenu = new DomPart({ class: 'leftMenu' });
    container.ins(leftMenu);

    const rightMenu = new DomPart({ class: 'rightMenu', css: { display: 'flex' } });
    container.ins(rightMenu);

    const signInBtn = new DomPart({ type: 'a', class: ['signIn', 'btn'], txt: 'Sign In' });
    signInBtn.setAttr('href', '/sign/in');
    rightMenu.ins(signInBtn);

    const signUpBtn = new DomPart({ type: 'a', class: ['signUp', 'signBtn', 'btn'], txt: 'Sign Up' });
    signUpBtn.setAttr('href', '/sign/up');
    rightMenu.ins(signUpBtn);
  }

  async init() {

    const b = this.b;

    this.o = await b.p('doc.mk', { type: 'header' });
    this.oShadow = this.o.attachShadow({ mode: 'open' });
    //this.oShadow.append(await this.createStyle());
    //this.oShadow.addEventListener('contextmenu', (e) => this.handleContextmenu(e));

    const container = await b.p('doc.mk', { class: 'container' });
    this.oShadow.append(container);

    const logo = await b.p('doc.mk', { class: 'logo', txt: 'varcraft' });
    await b.p('doc.ins', { o1: container, o2: logo });
  }
}

export const DataEditor = {

  root: 'root',
  setB(b) { this.b = b; },
  set_(_) { this._ = _; },

  async createStyle() {

    const css = `
.container {
  font-family: 'Roboto', sans-serif;
  font-size: 1em;
  color: rgb(55, 53, 47);
}
.inline { display: inline; }
.hidden { display: none; }
.header {
    font-weight: bold;
    font-size: 1.2em;
    margin-bottom: 8px;
}
.menu {
    position: absolute;
    background: lightgray;
    min-width: 100px;
}
.menuBtn {
    cursor: pointer;
    padding: 1px 7px;
    white-space: nowrap;
}
.menuBtn:hover {
    background: #ababab;
}
div[contenteditable="true"] {
    outline: none;
}
.row {
    margin-left: 16px;
}
.key {
    cursor: pointer;
    border: 1px solid transparent;
    display: inline;
    font-weight: bold;
}
.val {
    cursor: pointer;
    border: 1px solid transparent;
}
.val > img {
    max-width: 100px;
}

.key.mark,
.val.mark {
    background: lightblue;
}
.key[contenteditable="true"],
.val[contenteditable="true"]
 {
    cursor: inherit;
    border: 1px solid rgb(148 148 148);
}
.openClose {
  font-family: monospace;
  font-size: 1.1em;
  cursor: pointer;
  margin-right: 5px;
}
`;
    return await this.b.p('doc.mk', { type: 'style', txt: css });
  },

  getSizes() {
    return docGetSizes(this.o);
  },

  async getOpenedIds() {
    let ids = await this.b.p('x', { repo: 'idb', get: { id: 'openedIds' } });
    if (!ids) ids = new Set();
    return ids;
  },
  async openId(id) {
    const v = await this.getOpenedIds();
    v.add(id);
    await this.b.p('x', { repo: 'idb', set: { id: 'openedIds', v } });
  },
  async closeId(id) {
    //close id
  },

  async init() {

    const p = async (event, data) => await this.b.p(event, data);
    this.o = await p('doc.mk', { class: 'dataEditor' });

    this.oShadow = this.o.attachShadow({ mode: 'open' });
    this.oShadow.append(await this.createStyle());
    this.oShadow.addEventListener('contextmenu', (e) => this.handleContextmenu(e));
    this.oShadow.addEventListener('pointerdown', (e) => this.click(e));

    const container = await p('doc.mk', { class: 'container' });
    this.oShadow.append(container);
    this.container = container;

    const header = await p('doc.mk', { class: 'header', txt: 'Data Editor' });
    container.append(header);

    const k = this.root;
    const root = await this.mkRow({
      k,
      v: { m: {}, o: [], i: { id: k, t: 'm' } },
      id: k
    });
    container.append(root);

    const openedIds = await this.getOpenedIds();
    const v = await p('x', { get: { id: k, subIds: [...openedIds], getMeta: true } });
    //console.log(v);
    await this.rend(v, root);

    //const v = await p('x', { get: { path: 'settings', subIds: [...openedIds], getMeta: true } });
    //apply setting from
  },

  async rend(v, parentRow) {

    const getVId = v => { if (v.i) return v.i.id };
    const id = getVId(v);
    if (!id) { console.log('Unknown VAR', v); return; }

    if (v.m) {
      if (!v.o) { console.error('No order array for map', id, v); return; }

      let mod;

      for (let k of v.o) {
        if (!v.m[k]) { console.error(`Warning key [${k}] not found in map`, v.o, v.m); return; }

        const curV = v.m[k];
        const curVId = getVId(curV);
        if (!curVId) { console.log('2: Unknown type of VAR', curV); return; }

        const row = await this.mkRow({ k, v: curV, parentId: id, id: curVId });
        this.rowInterface(parentRow).val.append(row);

        if (k === '__mod') {
          mod = curV;
          this.setDomIdToMod(mod, this.rowInterface(row).getDomId());
        }

        await this.rend(curV, row);
      }

      if (mod && !mod.i.modApplied) {
        await this.applyMod(mod.i.domId);
        mod.i.modApplied = true;
      }

    } else if (v.l) {

      for (let curV of v.l) {

        const curVId = getVId(curV);
        if (!curVId) { console.log('2: Unknown type of VAR', curV); return; }

        const row = await this.mkRow({ v: curV, parentId: id, id: curVId });
        this.rowInterface(parentRow).val.append(row);
        await this.rend(curV, row);
      }
    }
    else if (v.i || v.v) { }
    else console.log('Unknown type of var', v);
  },

  findRow(domId) { return this.container.querySelector('#' + domId); },
  setDomIdToMod(mod, domId) {

    mod.i.domId = domId;

    if (!mod.m) return;

    for (let k in mod.m) {
      const v = mod.m[k];
      v.i.domId = domId;
      if (v.i) this.setDomIdToMod(v, domId);
    }
  },

  async applyMod(modDomId) {

    const modRow = this.findRow(modDomId);

    const id = this.rowInterface(modRow).getId();
    const mod = await this.b.p('x', { get: { id, depth: 2, getMeta: true } });

    const modParent = modRow.parentNode.parentNode; //todo use special interface method for get parent row

    for (const k in mod.m) {
      const v = mod.m[k];

      //if (k === 'target') {}
      if (k === 'css') {
        for (const p in v.m) {
          const v2 = v.m[p];
          modParent.style[p] = v2.v;
        }
      }
    }

    if (mod.m.favicon) {
      let link = await this.b.p('doc.mk', { type: 'link' });
      link.setAttribute('rel', 'icon');
      link.setAttribute('href', mod.m.favicon.v);
      document.getElementsByTagName('head')[0].append(link);
    }
  },

  async mkRow(x) {
    const { k, v, parentId, id, domId } = x;

    let r;
    if (domId) {
      r = this.findRow(domId);
      if (!r) return;
      r.innerHTML = '';
    } else {
      r = await this.b.p('doc.mk', { class: 'row' });
      r.id = await this.b.p('getUniqIdForDom');
    }

    if (id) r.setAttribute('_id', id);
    if (parentId) r.setAttribute('_parent_id', parentId);

    let openCloseBtn = await this.b.p('doc.mk', { txt: '+', class: ['openClose', 'hidden', 'inline'] });
    r.append(openCloseBtn);

    if (k) {
      r.append(await this.b.p('doc.mk', { txt: k, class: 'key' }));
      r.append(await this.b.p('doc.mk', { txt: ': ', class: ['sep', 'inline'] }));
    }

    const val = await this.b.p('doc.mk', { class: 'val' });
    r.append(val);

    if (v) {
      const t = v.i.t;
      if (t) r.setAttribute('t', t);
      if (t === 'l' || t === 'm') openCloseBtn.classList.remove('hidden');

      if (!v.i.openable) {
        openCloseBtn.innerText = '-';
        openCloseBtn.classList.add('opened');
      }

      if (v.b) {

        if (v.b.id) {
          let o;
          if (v.b.t === 'i') {
            o = new DomPart({ type: 'img' });
            o.setAttr('src', `state/${v.b.id}?bin=1`);
          }
          if (o) val.append(o.getDOM());

        } else {
          const i = new DomPart({ type: 'input' });
          i.setAttr('type', 'file');
          i.on('change', async (e) => {
            const row = this.rowInterface(r);
            return await this.setBinToId(row, i);
            //todo after this rerender row
          });
          val.append(i.getDOM());
        }

      } else if (v.v) {
        let txt = v.v;
        if (txt && txt.split) txt = txt.split('\n')[0];
        val.classList.add('inline');
        val.innerText = txt;
      }
    }

    return r;
  },

  rowInterface(row) {
    const children = row.children;
    const self = this;

    const o = {
      dom: row,
      getDom() { return this.dom },
      getDomId() { return this.dom.getAttribute('id') },
      getId() { return this.dom.getAttribute('_id') },
      getParentId() { return this.dom.getAttribute('_parent_id') },
      getType() { return this.dom.getAttribute('t') },
      getKeyValue() {
        if (!this.key) return;
        return this.key.innerText;
      },
      clearVal() { this.val.innerHTML = ''; },
      isValHasSubItems() {
        return this.val.children.length > 0;
      },
      isRoot() { return self.isRoot(this.dom); }
    }

    o.openCloseBtn = {
      obj: children[0],
      open() {
        this.obj.classList.add('opened');
        this.obj.innerText = '-';
      },
      close() {
        this.obj.classList.remove('opened');
        this.obj.innerText = '+';
      },
      isOpened() { return this.obj.classList.contains('opened'); }
    }

    if (children.length === 2) {
      o.val = children[1];
    } else {
      o.key = children[1];
      o.val = children[3];
    }

    return o;
  },

  getOrderKey(item, type) {

    const rows = item.parentNode.parentNode.children;
    for (let i = 0; i < rows.length; i++) {

      let element;
      if (type === 'm') element = this.rowInterface(rows[i]).key;
      else if (type === 'l') element = this.rowInterface(rows[i]).val;

      if (element && this.isMarked(element)) {
        return i;
      }
    }
  },
  isRoot(t) { return t.getAttribute('_id') === this.root },
  isKey(t) { return t.classList.contains('key'); },
  isVal(t) { return t.classList.contains('val'); },
  isOpenCloseBtn(t) { return t.classList.contains('openClose'); },

  remark(t) {
    this.unmark();
    t.classList.add('mark');
    this.marked = t;
  },
  mark() {
    if (this.marked) this.marked.classList.add('mark');
  },
  unmark() {
    if (this.marked) this.marked.classList.remove('mark');
  },
  isMarked(t) {
    return t.classList.contains('mark');
  },
  markedEditDisable(restorePreviousTxt = true) {
    this.marked.removeAttribute('contenteditable');

    if (restorePreviousTxt && this.markedTxt && this.marked.innerText !== this.markedTxt) {
      this.marked.innerText = this.markedTxt;
    }
    this.markedTxt = null;
    this.mark();
  },
  async setBinToId(row, input) {
    const f = input.getDOM().files[0];
    const r = new FileReader;
    r.onload = async (e) => {
      const resp = await this.b.p('x', {
        set: { id: row.getId(), v: e.target.result, binName: f.name }
      });
      console.log(resp);
    }
    r.readAsArrayBuffer(f);
  },

  async click(e) {
    const path = e.composedPath();
    const t = path[0];

    if (this.menu) {
      if (!path.includes(this.menu)) {
        this.menu.remove();
        this.unmark();
      }

    } else this.unmark();

    if (this.isOpenCloseBtn(t)) {
      const row = this.rowInterface(t.parentNode);
      const id = row.getId();

      if (row.openCloseBtn.isOpened()) {

        const openedIds = await this.getOpenedIds();
        if (id) openedIds.delete(id);
        await this.b.p('x', { repo: 'idb', set: { id: 'openedIds', v: openedIds } });

        row.openCloseBtn.close();
        row.clearVal();
      } else {
        if (!row.isRoot()) await this.openId(id);

        const openedIds = await this.getOpenedIds();

        const data = await this.b.p('x', { get: { id, subIds: [...openedIds], getMeta: true } });
        await this.rend(data, row.getDom());
        row.openCloseBtn.open();
      }

      return;
    }

    if (this.isRoot(t)) return;
    if (!this.isKey(t) && !this.isVal(t)) return;

    if (this.isVal(t)) {
      const row = this.rowInterface(t.parentNode);
      if (row.isValHasSubItems()) return;
    }

    if (this.marked) this.markedEditDisable();

    e.preventDefault();
    this.remark(t);
  },
  async keydown(e) {

    if (e.key === 'Escape') {
      this.markedEditDisable();
      return;
    }
    if (e.key !== 'Enter') return;
    e.preventDefault();

    const isEnabled = this.marked.getAttribute('contenteditable') === 'true';
    if (isEnabled) {

      const oldV = this.markedTxt;
      const newV = this.marked.innerText;

      if (!oldV) { console.log('No oldV is set.'); return; }
      if (!newV) { console.log('No newV is set.'); return; }
      if (oldV === newV) return;

      const isKey = this.isKey(this.marked);
      const isVal = this.isVal(this.marked);

      const row = this.marked.parentNode;
      if (isKey) {
        const parentId = row.getAttribute('_parent_id');
        const resp = await this.b.p('x', { set: { id: parentId, oldKey: oldV, newKey: newV } });
        console.log(resp);
      } else if (isVal) {
        const id = row.getAttribute('_id');
        if (id === 'vid_stub') return;
        const resp = await this.b.p('x', { set: { id, v: { v: newV } } });
        console.log(resp);
      }
      this.markedEditDisable(false);

      return;
    }

    this.unmark();
    this.marked.setAttribute('contenteditable', 'true');
    this.marked.focus();
    this.markedTxt = this.marked.innerText;
  },
  async handleContextmenu(e) {
    const t = e.target;

    const isKey = t.classList.contains('key');
    const isV = t.classList.contains('val');
    if (!isKey && !isV) return;

    e.preventDefault();
    this.remark(t);

    const p = async (e, d) => await this.b.p(e, d);
    const mkBtn = async (txt, fn) => await p('doc.mk', { txt, class: 'menuBtn', events: { click: fn } });

    const sizes = this.getSizes();
    const menu = await p('doc.mk', {
      class: 'menu', css: {
        left: e.clientX - sizes.x + 'px',
        top: window.scrollY + e.clientY - sizes.y + 'px',
        padding: '5px',
      }
    });
    if (this.menu) this.menu.remove();
    this.menu = menu;
    this.container.append(menu);

    //todo expand, collapse, structural stream;
    let btn = await mkBtn('Open', (e) => console.log(e));
    btn = await mkBtn('Add', async (e) => {

      const mark = this.marked;
      if (!mark) return;
      if (!this.isKey(mark) && !this.isVal(mark)) return;

      const row = this.rowInterface(mark.parentNode);
      const id = row.getId();
      const v = { v: 'newVal', i: { id: 'vid_stub', t: 'v' } };
      const type = row.getType();

      if (type === 'm') {
        const k = 'newKey';
        const ok = row.val.children.length;
        const newRow = await this.mkRow({ k, v, id: 'vid_stub', parentId: id });
        row.val.append(newRow);

        const resp = await p('x', { set: { type: 'm', id, k, ok, v } });
        console.log(resp);
        if (resp.newId) newRow.setAttribute('_id', resp.newId);
      }

      if (type === 'l') {
        const newRow = await this.mkRow({ v, id: 'vid_stub', parentId: id });
        row.val.append(newRow);

        const resp = await p('x', { set: { type: 'l', id, v } });
        console.log(resp);
        if (resp.newId) newRow.setAttribute('_id', resp.newId);
      }

      this.menu.remove();
    });
    this.menu.append(btn);


    const mv = async (dir) => {

      let parentId, k, row = this.marked.parentNode;

      if (!this.isKey(this.marked) && !this.isVal(this.marked)) return;
      if (dir === 'up' && !row.previousSibling) return;
      if (dir === 'down' && !row.nextSibling) return;

      if (this.isKey(this.marked)) {

        parentId = row.getAttribute('_parent_id');
        k = this.getOrderKey(this.marked, 'm');

        console.log(k);

      } else if (this.isVal(this.marked)) {

        const parentRowInterface = this.rowInterface(row.parentNode.parentNode);
        if (parentRowInterface.getType() !== 'l') return;

        parentId = row.getAttribute('_parent_id');
        k = this.getOrderKey(this.marked, 'l');
      }

      if (parentId === undefined) { console.log('parentId is empty'); return; }
      if (k === undefined) { console.log('ok not found'); return; }

      const ok = { from: k, to: dir === 'up' ? --k : ++k };
      const v = await this.b.p('x', { set: { id: parentId, ok } });
      console.log(v);

      if (dir === 'up') row.previousSibling.before(row);
      if (dir === 'down') row.nextSibling.after(row);
    }
    btn = await mkBtn('Move up', async (e) => await mv('up'));
    this.menu.append(btn);
    btn = await mkBtn('Move down', async (e) => await mv('down'));
    this.menu.append(btn);

    btn = await mkBtn('Copy', (e) => {
      if (!this.isKey(this.marked)) return;
      this.buffer = { marked: this.marked };
      this.menu.remove();
    });
    this.menu.append(btn);

    if (this.buffer) {
      btn = await mkBtn('Paste', async (e) => {
        const key = this.marked;
        if (!this.isKey(key)) return;

        const row = this.rowInterface(key.parentNode);
        if (row.getType() !== 'm') {
          this.menu.remove();
          return;
        }

        const mvRow = this.rowInterface(this.buffer.marked.parentNode);
        const type = row.getType();

        if (type !== 'm' && type !== 'l') return;

        const set = {
          oldId: mvRow.getParentId(),
          newId: row.getId(),
          key: mvRow.key.innerText,
        };
        const resp = await this.b.p('x', { set });
        console.log(resp);

        row.val.append(mvRow.dom);
        this.buffer = null;
        this.menu.remove();
      });

      this.menu.append(btn);
    }

    btn = await mkBtn('Convert to bin', async (e) => {
      const row = this.rowInterface(this.marked.parentNode);
      const id = row.getId();
      if (!id) return;

      const v = { b: {}, i: { id, t: 'b' } };
      await this.mkRow({ domId: row.getDomId(), k: row.getKeyValue(), v });

      const r = await this.b.p('x', { set: { id, v } }); console.log(r);
    });
    this.menu.append(btn);

    btn = await mkBtn('Convert to map', async (e) => {
      const row = this.rowInterface(this.marked.parentNode);
      const id = row.getId();
      if (!id) return;

      const v = { m: {}, o: [], i: { id, t: 'm' } };
      await this.mkRow({ domId: row.getDomId(), k: row.getKeyValue(), v });
      this.openId(id);

      const r = await this.b.p('x', { set: { id, v } });
      console.log(r);
    });
    this.menu.append(btn);
    btn = await mkBtn('Convert to list', async (e) => {
      const row = this.marked.parentNode;
      const id = row.getAttribute('_id');
      if (!id) return;
      const r = await this.b.p('x', { set: { id, v: { l: [] } } });
      console.log(r);
    });

    this.menu.append(btn);
    btn = await mkBtn('Convert to val', (e) => console.log(e));
    this.menu.append(btn);

    btn = await mkBtn('Remove', async (e) => {
      const marked = this.marked;
      if (!marked) return;
      this.menu.remove();

      let row, k, ok;

      if (this.isKey(marked)) {
        row = marked.parentNode;
        k = marked.innerText;
        ok = this.getOrderKey(marked, 'm'); //todo this need to be found automatically on backend
        if (ok === undefined) { console.log('ok not found'); return; }

      } else if (this.isVal(marked)) {
        row = marked.parentNode;
        k = row.getAttribute('_id');
      }

      const parentId = row.getAttribute('_parent_id');
      if (!parentId || !k) return;

      const v = await this.b.p('x', { del: { id: parentId, k, ok } }); console.log(v);
      marked.parentNode.remove();
    });
    this.menu.append(btn);
  },
}

const runFrontend = async (b) => {

  if (!Array.prototype.at) {
    Array.prototype.at = function (i) {
      return i < 0 ? this[this.length + i] : this[i];
    }
  }

  const _ = b.get_();

  globalThis.vc = b;
  await b.s('getUniqIdForDom', async () => {

    const getRandomLetter = () => {
      const alphabet = 'abcdefghijklmnopqrstuvwxyz';
      const randomIndex = Math.floor(Math.random() * alphabet.length);
      return alphabet.charAt(randomIndex);
    }
    const id = await b.p('getUniqId');
    return id.replace(/^[0-9]/, getRandomLetter());
  });
  await b.s('x', async (x) => {
    if (x.repo === 'idb') {
      if (x.set) await idb.set(x.set);
      if (x.get) return await idb.get(x.get);
      return;
    }
    return await b.p('port', x);
  });
  await b.s('port', async (x) => {

    let headers = {};
    if (x.set && x.set.v instanceof ArrayBuffer) {

      const v = x.set.v; delete x.set.v;
      headers.x = JSON.stringify(x);
      x = v;
    }

    const { data } = await (new HttpClient).post('/', x, headers);
    return data;
  });

  await b.s('doc.mk', async (x) => docMk(doc, x));
  await b.s('doc.on', async (x) => {
    const { o, e, f } = x;
    o.addEventListener(e, f);
  });
  await b.s('doc.get', async (x) => doc.getElementById(x.id));
  await b.s('doc.ins', async (x) => {
    const { o1, o2 } = x;

    let first;
    if (typeof o1 === 'string') {
      first = await b.p('doc.get', { id: o1 });
    } else {
      first = o1;
    }

    let second;
    if (typeof o2 === 'string') {
      second = await b.p('doc.get', { id: o2 });
    } else if (o2 instanceof Node) {
      second = o2;
    } else {
      second = await b.p('doc.mk', o2);
    }

    first.appendChild(second);
  });
  await b.s('doc.mv', async (x) => { });
  await b.s('doc.getSize', async (x) => {
    const { o } = x;
    return getSize(o);
  });

  const idb = new IndexedDb();
  await idb.open();

  //BUILD APP
  const doc = globalThis.document;

  const appDOM = await b.p('doc.mk', { id: 'app' });
  doc.body.append(appDOM);

  const app = new DomPart;
  app.setDOM(appDOM);

  const header = new Header;
  await b.p('doc.ins', { o1: app.dom, o2: header.dom });



  //SIMPLE ROUTING
  const path = doc.location.pathname;

  if (path.startsWith('/sign/')) {

    const act = path === '/sign/in' ? 'Sign In' : 'Sign Up';

    const signForm = new DomPart({ class: 'signForm' });
    app.ins(signForm);

    const signHeader = new DomPart({ class: 'header', txt: act });
    signForm.ins(signHeader);

    const email = new DomPart({ type: 'input', class: 'email', txt: '' });
    signForm.ins(email);

    signForm.ins(new DomPart({ type: 'br' }));

    const password = new DomPart({ type: 'input', class: 'password', txt: '' });
    signForm.ins(password);

    signForm.ins(new DomPart({ type: 'br' }));

    const btn = new DomPart({ type: 'button', class: 'btn', txt: act });
    signForm.ins(btn);

    btn.on('pointerdown', async (e) => {
      if (act === 'Sign Up') {
        const r = await b.p('x', {
          signUp: {
            email: email.getVal(),
            password: password.getVal(),
          }
        });
        console.log(r);
      }
    });

  } else {

    const dataEditor = Object.create(DataEditor);
    dataEditor.setB(b);
    dataEditor.set_(_);
    await dataEditor.init();

    const frame = Object.create(Frame);
    frame.setB(b);
    await frame.init();
    frame.setContent(dataEditor.o);

    appDOM.append(frame.o);

    //const customHtml = await b.p('doc.mk', { html: 'okokok', class: 'customHtml' });
    //appDOM.append(customHtml);

    window.onkeydown = (e) => dataEditor.keydown(e);
  }
}

//BACKEND
const run = async () => {

  const ctx = {};
  if (globalThis.Bun) ctx.rtName = 'bun';
  else if (globalThis.Deno) ctx.rtName = 'deno';
  else if (globalThis.Window) ctx.rtName = 'browser';
  else ctx.rtName = 'node';

  const b = busFactory();

  await b.s('getUniqId', () => {
    if (!window.crypto || !window.crypto.randomUUID) {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,
        function (c) {
          const uuid = Math.random() * 16 | 0, v = c == 'x' ? uuid : (uuid & 0x3 | 0x8);
          return uuid.toString(16);
        });
    }
    return crypto.randomUUID();
  });

  if (ctx.rtName === 'browser') {
    await runFrontend(b);
    return;
  }
  ctx.fileName = process.argv[1].split('/').at(-1);

  const { promises } = await import('node:fs');
  const fs = promises;

  const _ = b.get_();

  await b.s('u', () => u);
  await b.s('x', async x => {
    const u = await b.p('u');
    return await u(x);
  });
  await b.s('get_', () => _);
  await b.s('getUniqId', () => crypto.randomUUID());
  await b.s('sh', async (x) => {
    const { spawn, exec } = await import('node:child_process');

    exec(x.cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec err: ${error}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
      console.error(`stderr: ${stderr}`);
    });
    // const cmd = x.cmd.split(' ');
    // const ls = spawn(cmd[0], cmd.slice(1));
    // ls.stdout.on('data', (data) => console.log(`stdout: ${data}`));
    // ls.stderr.on('data', (data) => console.error(`stderr: ${data}`));
    // ls.on('close', (code) => console.log(`exit code ${code}`));
  });

  await b.s('storage', async (x) => await b.p('fs', x));
  await b.s('repo', async (x) => {
    const repo = mainRepo;

    if (x.set) {
      const { id, v, format } = x.set;
      return await repo.set(id, v, format);
    }
    if (x.get) {
      const { id } = x.get;
      return await repo.get(id);
    }
    if (x.del) {
      const { id } = x.del;
      return await repo.del(id);
    }
  });
  await b.s('fs', async (x) => {

    if (x.set) {
      const { path, v, format } = x.set;

      const data = format === 'json' ? JSON.stringify(v) : v;
      return await fs.writeFile(path, data);
    }
    if (x.get) {
      const { path, format } = x.get;

      try {
        const data = await fs.readFile(path);
        return format === 'json' ? JSON.parse(data) : data;
      } catch (e) {
        console.log(e.message);
      }
    }
    if (x.del) {
      const { path } = x.del;
      return await await fs.unlink(path);
    }
    if (x.stat) {
      const { path } = x.stat;
      return await fs.stat(path);
    }
  });
  await b.s('state.import', async x => {

  });
  await b.s('state.export', async (x) => {
    await b.p('sh', { cmd: 'zip -vr state.zip state' });
  });
  await b.s('state.validate', async (x) => {
    const list = await fs.readdir('./state');
    const fSet = new Set;
    for (let i of list) {
      if (i === '.gitignore' || i === 'root' || i === 'sys') continue;
      fSet.add(i);
    }
    const v = await b.x({ get: { id: 'root', useRepo: true } });
    const varIds = await getVarIds({ b, v });

    for (let i of varIds) fSet.delete(i);
    console.log('files that not exists in varIds', fSet);
  });

  const mainRepo = new Storage('./state', b);

  const mapV = { m: {}, o: [] };

  let v = await b.p('repo', { get: { id: 'root' } });
  if (!v) await mainRepo.set('root', mapV);

  const e = {
    'set': async (arg) => {
      const path = pathToArr(arg[1]);
      if (!path) { console.error('path is empty'); return; }

      const v = arg[2];
      if (!v) { console.error('data is empty'); return; }
      const type = arg[3];

      return await b({ set: { path, v, type } });
    },
    'get': async (arg) => {
      const path = arg[1] ? pathToArr(arg[1]) : [];
      const depth = arg[2] || 1;

      return await b({ get: { path, depth } });
    },
    'del': async (arg) => {
      const path = pathToArr(arg[1]);
      if (!path) { console.error('path is empty'); return; }

      return b({ del: { path } });
    },
    'deploy': async (arg) => {

      //${ctx.fileName}

      const ctx = arg[_].ctx;

      const stop = 'pkill -9 node';
      const nodePath = '/root/.nvm/versions/node/v20.8.0/bin/node';
      const run = `${nodePath} x.js server.start 80 > output.log 2>&1 &`;
      const c = `ssh root@164.90.232.3 "cd varcraft; git pull; ${stop}; ${run}"`;

      await b.p('sh', { cmd: c });
    },
    'state.import': async (arg) => {
      const path = arg[1];
      return await b.p('state.import', { path: './' + path });
    },
    'state.import': async (arg) => {
      const path = arg[1];
      return await b.p('state.import', { path: './' + path });
    },
    'state.export': async (arg) => await b.p('state.export'),
    'state.validate': async (arg) => await b.p('state.validate'),
    'server.start': async (arg) => {

      const port = arg[1] || 8080;
      const hostname = '0.0.0.0';
      const ctx = arg[_].ctx;
      ctx.Buffer = Buffer;
      ctx.Response = Response;
      ctx.Uint8Array = Uint8Array;

      const handler = async (rq) => await httpHandler({ b, rq, fs, runtimeCtx: ctx });

      if (ctx.rtName === 'bun') {
        Bun.serve({ port, hostname, fetch: handler });
        return;
      }
      if (ctx.rtName === 'deno') {
        const { Buffer } = await import('https://deno.land/std@0.177.0/node/buffer.ts');
        ctx.Buffer = Buffer;
        Deno.serve({ port, hostname, handler });
        return;
      }
      if (ctx.rtName === 'node') {
        const x = {};
        x.server = (await import('node:http')).createServer({ requestTimeout: 30000 });
        x.server.on('request', async (rq, rs) => {

          rq.on('error', (e) => { rq.destroy(); console.log('request no error', e); });
          try {
            const r = await httpHandler({ b, runtimeCtx: ctx, rq, fs });
            const v = new ctx.Uint8Array(await r.arrayBuffer());

            rs.writeHead(r.status, Object.fromEntries(r.headers)).end(v);
          } catch (e) {
            const m = 'err in rqHandler';
            console.log(m, e);
            rs.writeHead(503, { 'content-type': 'text/plain; charset=utf-8' }).end(m);
          }
        });

        x.server.listen(port, () => console.log(`server start on port: [${port}]`));
      }
    },
  };

  process.on('uncaughtException', (e, origin) => {
    if (e?.code === 'ECONNRESET') {
      console.error(e);
      return;
    }
    if (e.stack) console.log('e.stack', e.stack);

    console.error('UNCAUGHT EXCEPTION', e, e.stack, origin);
    process.exit(1);
  });

  const processCliArgs = async () => {

    const args = parseCliArgs([...process.argv]);

    args[_] = { ctx };

    if (e[args[0]]) {
      console.log(await e[args[0]](args) ?? '');
    } else {
      console.log('Command not found');
    }
  }

  await processCliArgs();
}

run();