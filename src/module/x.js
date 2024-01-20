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
  const { id, path, type } = x;
  let data = x.v;
  let repo = x.repo || 'default';
  let { _, b, createSet, prepareForTransfer } = x[x._];

  const set = await createSet({ _, b, repo, path, type });
  if (!set) return;

  for (let i = 0; i < set.length; i++) {
    const v = set[i];
    const isLast = i === set.length -1;

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

    const isMap = Boolean(v.m); const isList = Boolean(v.l);

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


  //DELETE BY PATH
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

  const isDelWithSubVars = await delWithSubVars({ _, b, v: v2 });
  if (isDelWithSubVars) {

    const isMap = Boolean(v1.m); const isList = Boolean(v1.l);
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

  const { _, b, v, depth } = x;

  const data = { [_]: { id: v[_].id } };
  if (v.v) data.v = v.v;

  if (v.l) {
    data.l = [];

    for (let id of v.l) {
      const v2 = await b.p('get', { id });
      if (v2) v2[_] = { id };

      if (v2.v) {
        data.l.push(v2);
      } else if (v2.l || v2.m) {
        data.l.push( await getVarData({ _, b, v: v2, depth: depth - 1 }) );
      }
    }
  }

  if (!v.m) return data;

  data.m = {};
  if (v.o) data.o = v.o;

  for (let p in v.m) {

    const id = v.m[p];
    if (!id) return;

    if (depth === 0) {
      data.m[p] = id;
      continue;
    }
    const v2 = await b.p('get', { id });
    if (v2) v2[_] = { id };

    if (v2.v) {
      data.m[p] = v2;
    } else if (v2.l || v2.m) {
      data.m[p] = await getVarData({ _, b, v: v2, depth: depth - 1 });
    }
  }

  return data;
}

export const getVarIds = async (x) => {

  const { b, v } = x;

  const ids = [];
  if (!v.l && !v.m) return ids;

  const getIds = async (v) => {

    if (v.l) {
      for (let id of v.l) {
        const subV = await b.p('get', { id });
        ids.push(id);

        if (subV.m || subV.l) await getIds(subV);
      }

    } else if (v.m) {
      for (let k in v.m) {
        const id = v.m[k];
        const subV = await b.p('get', { id });
        ids.push(id);

        if (subV.m || subV.l) await getIds(subV);
      }
    }
  }

  await getIds(v);

  return ids;
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

export const stateExport = (repo) => {

}

export const stateImport = (repo) => {

}

export const stateValidate = (repo) => {

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
const dragAndDrop = () => {}