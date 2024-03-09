export const X = (symbol) => {

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
  setX(x) { this.x = x; },
  set_(_) { this._ = _; },
  async p(event, data) {
    const inject = {
      _: this._,
      [this._]: { b, x: event }
    }
    return await this.x({ ...data, ...inject });
  },
  async s(e, f) {
    const _ = this._;
    return await this.x({ [_]: { y: e, f } });
  },
}

export const set = async (x) => {

  const { type, id, path, k, ok, v, bin, binName } = x;
  const { b } = x[x._];
  const _ = await b.p('get_');
  const repo = await b.p('getRepo');

  if (v && v.i) delete v.i;

  //CHANGE ORDER
  if (id && ok && typeof ok === 'object') {
    const vById = await b.p('get', { id });
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
    await repo.set(id, vById);

    return { id, ok };
  }

  //SET key and value to id of (MAP) or add value (LIST)
  if (type && id && v) {
    const vById = await b.p('get', { id });
    if (!vById) return { msg: 'v not found' };

    if (type === 'm' && vById.m) {
      if (vById.m[k]) return { msg: `k [${k}] already exists in vById` };
      if (!vById.o) return { msg: `v.o is not found by [${id}]` };
      if (ok === undefined) return { msg: `ok is empty` };

      const newId = await b.p('getUniqId');
      vById.m[k] = newId;
      vById.o.splice(ok, 0, k);

      await repo.set(newId, v);
      await repo.set(id, vById);

      return { type, id, k, v, newId };
    }
    if (type === 'l' && vById.l) {
      const newId = await b.p('getUniqId');
      vById.l.push(newId);

      await repo.set(newId, v);
      await repo.set(id, vById);

      return { type, id, v, newId };
    }

    return { msg: 'Not found "m" in vById', vById };
  }

  //SET value by ID
  if (id && v) {
    await repo.set(id, v);
    return { id, v };
  }
  //SET binary file and save it's ID to specific varID
  if (id && bin && binName) {
    const v = await b.p('get', { id });
    if (!v) return { msg: 'v not found by id', id };
    //todo clear previous binary file;

    let t = binName.split('.').at(-1);
    if (t === 'png' || t === 'jpg' || t === 'jpeg') { }

    const newId = await b.p('getUniqId');
    await repo.set(newId, bin, 'raw');
    await repo.set(id, { b: { id: newId } });

    return { id, newId };
  }

  //SET BY PATH
  if (path) {

    const set = await createSet({ _, b, repo, path, type });
    if (!set) return;

    let data = v;

    for (let i = 0; i < set.length; i++) {
      const v = set[i];
      const isLast = i === set.length - 1;

      if (isLast) {
        if (v.l) {
          const newId = await b.p('getUniqId');
          const newV = { _: { id: newId }, v: data };
          await b.p('set', { repo, id: newId, v: prepareForTransfer(newV) });

          v.l.push(newId);
          if (!v[_].new) v[_].updated = true;
        } else if (v.v) {
          v.v = data;
          if (!v[_].new) v[_].updated = true;
        }
      }

      if (v[_].new || v[_].updated) {
        await b.p('set', { repo, id: v[_].id, v: prepareForTransfer(v) });
      }
    }

    return set.at(-1);
  }


  const {
    oldId, newId, key,
    oldKey, newKey
  } = x;

  //COPY or MOVE MAP key from one ID to another ID
  if (oldId && newId && oldId !== newId && key) {

    const oldV = await b.p('get', { id: oldId });
    const newV = await b.p('get', { id: newId });

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

    await b.p('set', { id: oldId, v: prepareForTransfer(oldV) });
    await b.p('set', { id: newId, v: prepareForTransfer(newV) });
    return { oldId, newId, key };
  }

  //RENAME of MAP key
  if (id && oldKey && newKey) {

    const v = await b.p('get', { id });
    if (!v.m || !v.m[oldKey]) {
      return { msg: 'v.m or v.m[oldKey] not found' };
    }

    v.m[newKey] = v.m[oldKey];
    delete v.m[oldKey];

    if (!v.o) return { msg: 'o not found in map' };
    const ok = v.o.indexOf(oldKey);
    if (ok === -1) return { msg: `order key for key [${oldKey}] not found` };
    v.o[ok] = newKey;

    await b.p('set', { id, v });
    return { id, oldKey, newKey };
  }
}

export const get = async (x) => {

  let { id, path, subIds, depth, getMeta, varIdsForGet } = x;
  const { b } = x[x._];
  const _ = await b.p('get_');
  const repo = await b.p('getRepo');

  if (depth === undefined) depth = 0;

  if (id) {
    let v = await repo.get(id);

    if (getMeta) {
      v.i = { id, t: getType(v) };
      v = await getVarData({ _, b, v, subIds: new Set(subIds), depth, getMeta });
    }
    return v;
  }

  if (path && path !== undefined) {
    if (!Array.isArray(path) && typeof path === 'string') {
      x.path = x.path.split('.');
    }

    const set = await createSet({
      _, b, repo, path, getMeta,
      isNeedStopIfVarNotFound: true,
    });
    if (!set) return;

    const v = set.at(-1);
    if (!v) return;

    return await getVarData({ _, b, repo, v, depth, getMeta, varIdsForGet });
  }
}

export const del = async (x) => {

  const { path, id, k, ok } = x;
  const { b } = x[x._];
  const _ = await b.p('get_');
  const repo = await b.p('getRepo');

  //DELETE KEY IN MAP with subVars
  if (id && k) {
    const v = await b.p('get', { id });
    if (!v) return { msg: 'v not found' };
    if (!v.m && !v.l) return { msg: 'v is not map and not list' };

    const isMap = Boolean(v.m);
    const isList = Boolean(v.l);

    const targetId = isMap ? v.m[k] : k;
    if (!targetId) return { msg: `targetId not found by [${k}]` };

    const targetV = await b.p('get', { id: targetId });
    if (!targetV) return { msg: `targetV not found by [${targetId}]` };
    targetV[_] = { id: targetId };

    if (isMap) {
      if (ok === undefined) return { msg: `oKey is empty` };
      if (!v.o) return { msg: `v.o is not found by [${id}]` };
      if (!v.o[ok]) return { msg: `v.o[oKey] is not found by key [${ok}]` };
    }

    const isDelWithSubVars = await delWithSubVars({ _, b, v: targetV });
    if (isDelWithSubVars) {

      if (isMap) {
        delete v.m[k];
        v.o.splice(ok, 1);
      } else if (isList) {
        const l = v.l;
        for (let i = 0; i < l.length; i++) {
          if (l[i] === k) l.splice(i, 1);
        }
      }

      await b.p('set', { id, v: prepareForTransfer(v) });
    }

    return;
  }

  //DELETE BY ID
  if (id && id !== 'root') return await repo.del(id);

  //DELETE BY PATH
  const set = await createSet({ _, b, path, isNeedStopIfVarNotFound: true });

  if (!set || set.length < 2) {
    console.log('log', { msg: 'Var set not found' });
    return;
  }

  const v1 = set.at(-2);
  const v2 = set.at(-1);

  const v2ID = v1.m[v2[_].name];
  if (!v2ID) {
    console.log('log', { msg: `key [${v2[_].name}] not found in v1` });
    return;
  }

  const isDelWithSubVars = await delWithSubVars({ _, b, v: v2 });
  if (isDelWithSubVars) {
    const isMap = Boolean(v1.m);
    const isList = Boolean(v1.l);

    if (isMap) {
      console.log(v2ID);

      delete v1.m[v2[_].name];
      v1.o = v1.o.filter(key => key !== v2[_].name);

      await b.p('set', { id: v1[_].id, v: prepareForTransfer(v1) });
    } else if (isList) {
      console.log('isList', v1);
    }
  }
}

export const delWithSubVars = async (x) => {
  const { _, b, v } = x;

  const varIds = await getVarIds({ b, v }); console.log('varIds for del', varIds);

  const len = Object.keys(varIds).length;
  if (len > 50) { await b.p('log', { msg: `Try to delete ${len} keys at once` }); return; }

  for (let id of varIds) await b.p('del', { id });
  await b.p('del', { id: v[_].id });
  console.log('del', v[_].id);

  return true;
};

export const createSet = async (x) => {

  const { _, b, path, getMeta, isNeedStopIfVarNotFound } = x;
  const type = x.type || 'v';

  let v1 = await b.p('get', { id: 'root' });
  v1[_] = { id: 'root', name: 'root' };
  if (getMeta) v1.i = { id: 'root' };

  let set = [v1];
  if (path[0] === 'root') return set;

  for (let i = 0; i < path.length; i++) {
    const name = path[i];
    if (!name) return;

    const v1 = set.at(-1);
    let v2;

    if (!v1.m && !v1.l) {
      console.log(`v1 hasn't m or l prop for getting name [${name}]`);
      return;
    }

    let id = v1.m[name];
    if (id) {
      v2 = await b.p('get', { id });
      if (v2) v2[_] = { id };
    }

    if (!v2) {
      if (isNeedStopIfVarNotFound) return;

      const vType = (i === path.length - 1) ? type : 'm';
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

const mkvar = async (b, type, _) => {

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

  const { _, b, v, subIds, depth, getMeta } = x;

  let data = { [_]: v[_] };
  if (getMeta) data.i = v.i;

  const isNeedToGet = Boolean(subIds && subIds.has(data.i.id));

  if (depth <= 0 && !isNeedToGet) {
    if (getMeta) data.i.openable = true;
    return data;
  }

  if (v.v) data.v = v.v;
  if (v.l) {

    data.l = [];

    for (let id of v.l) {

      const v2 = await b.p('get', { id });

      v2[_] = { id };
      if (getMeta) v2.i = { id, t: getType(v2) };

      if (v2.b || v2.v) {
        data.l.push(v2);
      } else if (v2.l || v2.m) {
        data.l.push(await getVarData({ _, b, v: v2, subIds, depth: depth - 1, getMeta }));
      }
    }

  } else if (v.m) {

    data.m = {};
    if (v.o) data.o = v.o;

    for (let p in v.m) {

      const id = v.m[p];
      if (!id) return;
      const v2 = await b.p('get', { id });

      v2[_] = { id };
      if (getMeta) v2.i = { id, t: getType(v2) };

      if (v2.b || v2.v) {
        data.m[p] = v2;
      } else if (v2.l || v2.m) {
        data.m[p] = await getVarData({ _, b, v: v2, subIds, depth: depth - 1, getMeta });
      }
    }

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
        await getIds(await b.p('get', { id }));
      }
    } else if (v.l) {
      for (let id of v.l) {
        ids.push(id);
        await getIds(await b.p('get', { id }));
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

  if (v.i) d.i = v.i; //metaData id, link, type, etc.

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
export const pathToArr = path => Array.isArray(path) ? path : path.split('.');
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
};
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

// GUI //
export const dmk = (d, x) => {
  const { id, type, txt, events, css } = x;

  const o = d.createElement(type || 'div');
  if (txt) o.innerText = txt;

  const classD = x['class'];
  if (classD) {
    o.className = Array.isArray(classD) ? classD.join(' ') : classD;
  }
  if (events) for (let k in events) o.addEventListener(k, events[k]);
  if (css) for (let k in css) o.style[k] = css[k];

  return o;
}

export const getSize = (o) => {
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

export const mkOb = (x) => {
  //todo opObject //dataObj // tick, add, subtract
  //o, msg, num, list, symbol, comment
  const data = {
    txt: x.txt,
    event: {
      //can attach any custom handler with specific connection mechanics build in UI.
      //click: () => {}
    },
  }
  if (x.style) data.style = x.style;

  return data;
}

export const mkOp = {
  txt: '+',
  style: {
    display: 'inline-block',
    cursor: 'pointer',
    'fontWeight': 'bold',
    margin: '1em'
  },
  // event: {
  //     click: async (e) => {
  //         const o = createOb();
  //         await op({ event: 'o.add', o: o });
  //     }
  // }
};

const on = (id, eventName, callback) => {
  //add event to id!
  //dom.addEventListener(eventName, callback);
}
const dragAndDrop = () => { }