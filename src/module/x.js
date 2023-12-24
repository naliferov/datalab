export const X = (symbol) => {

  const _ = symbol;
  const f = {};

  return async (x) => {
    if (x[_].x) {
      return await f[x[_].x](x);
    }
    if (x[_].y) {
      f[x[_].y] = x[_].f;
    }
  }
}

export const U = (X, symbol) => {

  const _ = symbol;

  return async (x) => {
    if (x.x) {
      return await X({ [_]: { x: x.x }, ...x });
    }
    if (x.y) {
      return await X({ [_]: { y: x.y, f: x.f } });
    }
  }
};

export const b = {
  setX(x) { this.x = x; },
  set_(_) { this._ = _; },
  async p(e, data) {
    const _ = this._;
    return await this.x({ [_]: { x: e }, ...data });
  },
  async s(e, f) {
    const _ = this._;
    return await this.x({ [_]: { y: e, f } });
  },
}

export const set = async (x) => {
  const { path, type } = x;
  let data = x.v;
  let repo = x.repo || 'default';
  let { _, b, createSet, prepareForTransfer } = x[x._];

  const set = await createSet({ _, b, repo, path, type });
  if (!set) return;

  for (let i = 0; i < set.length; i++) {
    const v = set[i];
    if (v.v) {
      v.v = data;
      if (!v[_].new) v[_].updated = true;
    }
    if (v[_].new || v[_].updated) {
      await b.p('set', { repo, id: v[_].id, v: prepareForTransfer(v) });
    }
  }

  return set.at(-1);
}

export const get = async (x) => {
  let { path, depth } = x;
  let repo = x.repo || 'default';

  let { _, b, createSet, getVarData } = x[x._];

  if (!depth && depth !== 0) depth = 0;

  const set = await createSet({
    _, b, repo, path,
    isNeedStopIfVarNotFound: true,
  });

  if (!set) return;

  const v = set.at(-1);
  if (!v) return;

  return await getVarData({ b, _, repo, v, depth });
}

export const del = async (x) => {

  const { path, id, k, ok } = x;
  let repo = x.repo || 'default';
  let { _, b, createSet, prepareForTransfer } = x[x._];

  if (id && k) {
    const v = await b.p('get', { id });
    if (!v) return { msg: 'v not found' };
    if (!v.m && !v.l) return { msg: 'v is not map and not list' };

    const isMap = Boolean(v.m);

    const targetId = isMap ? v.m[k] : v.l[k];
    if (!targetId) return { msg: `v is not contains key [${k}]` };

    const targetV = await b.p('get', { id: targetId });
    if (!targetV) return { msg: `targetV not found by [${targetId}]` };
    targetV[_] = { id: targetId };

    if (isMap) {
      if (ok === undefined) return { msg: `oKey is empty` };
      if (!v.o) return { msg: `v.o is not found by [${id}]` };
      if (!v.o[ok]) return { msg: `v.o[oKey] is not found by key [${ok}]` };
    }

    if (await delWithSubVars({ _, b, v: targetV })) {

      if (isMap) {
        delete v.m[k];
        v.o.splice(ok, 1);
      }
      await b.p('set', { id, v: prepareForTransfer(v) });
    }
    return;
  }

  const set = await createSet({ _, b, repo, path, isNeedStopIfVarNotFound: true });

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
  if (await delWithSubVars({ _, b, v: v2 })) {
    delete v1.m[v2[_].name];
    v1.o = v1.o.filter(id => id !== v2ID);

    await b.p('set', { id: v1[_].id, v: prepareForTransfer(v1) });
  }
}

export const delWithSubVars = async (x) => {
  const { _, b, v } = x;

  const varIds = await getVarIds({ b, v }); console.log(varIds);

  const len = Object.keys(varIds).length;
  if (len > 50) { await b.p('log', { msg: `Try to delete ${len} keys at once` }); return; }

  for (let i = 0; i < varIds.length; i++) {
    const id = varIds[i];
    await b.p('del', { id });
  }
  console.log('del', v[_].id);
  await b.p('del', { id: v[_].id });

  return true;
};

export const createSet = async (x) => {

  const { b, path, isNeedStopIfVarNotFound, _, } = x;
  let type = x.type || 'v';

  let v1 = await b.p('get', { id: 'root' });
  v1[_] = { id: 'root', name: 'root' };

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
      v1.o.push(v2[_].id);

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

//rename to getDeeper
export const getVarData = async (x) => {

  const { b, v, depth, _ } = x;

  const data = { [_]: { id: v[_].id } };
  if (v.v) data.v = v.v;

  if (!v.m) return data;

  data.m = {};

  for (let p in v.m) {

    const id = v.m[p];
    if (!id) return;

    if (depth === 0) {
      data.m[p] = id;
      continue;
    }
    const v2 = await b.p('get', { id });
    if (v2) {
      v2[_] = { id };
    }

    if (v2.v) {
      data.m[p] = v2;
    } else if (v2.m) {
      data.m[p] = await getVarData({ b, v: v2, depth: depth - 1, _ });
    }
  }
  return data;
}

export const getVarIds = async (x) => {

  const { b, v } = x;

  if (!v.m) return {};

  const subVars = [];

  const getSubVars = async (v) => {
    for (let prop in v.m) {
      const id = v.m[prop];
      const subV = await b.p('get', { id });
      subVars.push(id);

      if (subV.m) await getSubVars(subV);
      if (subV.l) await getSubVars(subV);
    }
  }
  await getSubVars(v);

  return subVars;
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

export const pathToArr = path => Array.isArray(path) ? path : path.split('.');


//GUI
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

const dragAndDrop = () => {

}