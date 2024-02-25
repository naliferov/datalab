import AmdZip from 'adm-zip';
import { promises as fs } from "node:fs";
import process from 'node:process';
import { ulid } from "ulid";
import {
  X, b,
  createSet,
  del,
  get,
  getDateTime,
  getType,
  getVarData, getVarIds,
  parseCliArgs,
  pathToArr,
  prepareForTransfer,
  set
} from "./src/module/x.js";

const _ = Symbol('sys');
b.set_(_);
b.setX(X(_));

await b.s('log', async (x) => {
  if (typeof x === 'object') {
    console.log(x.msg);
    return;
  }
  console.log(x);
});
await b.s('get_', () => _);
await b.s('getUniqId', () => ulid());
await b.s('fs.readFile', async (x) => {
  const { path } = x;
  return await fs.readFile(path, 'utf8');
});

await b.s('set', async (x) => {
  const { type, id, path, k, ok, v } = x;

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

      if (ok > vById.o.length - 1) vById.o.push(k);
      else vById.o.splice(ok, 0, k);

      await repo.set(newId, v);
      await repo.set(id, vById);

      return { id, k, v, newId };
    }
    if (type === 'l' && vById.l) {
      const newId = await b.p('getUniqId');
      vById.l.push(newId);
      await repo.set(newId, v);
      await repo.set(id, vById);

      return { type, id, newId, v };
    }

    return { msg: 'Not found "m" in vById', vById };
  }

  //SET value by ID
  if (id && v) {
    await repo.set(id, v);
    return { id, v };
  }

  //SET by PATH
  if (path) {
    const _ = await b.p('get_');
    x._ = _;
    x[_] = { _, b, createSet, prepareForTransfer };
    await set(x);
    return { msg: 'update complete', x };
  }

  return { msg: 'unknown state', x };
});

await b.s('get', async (x) => {

  const { id, subIds, path, depth, getMeta } = x;

  if (id) {
    const _ = await b.p('get_');
    let v = await repo.get(id);

    if (depth !== undefined && getMeta) {
      v.i = { id, t: getType(v) };
      v = await getVarData({ _, b, v, subIds: new Set(subIds), depth, getMeta });
    }

    return v;
  }

  if (path && depth !== undefined) {
    const _ = await b.p('get_');
    x._ = _;
    x[_] = { _, b, createSet, getVarData };
    return await get(x);
  }
});

await b.s('del', async (x) => {
  const { id, path, k, ok } = x;

  if ((id && k) || path) {
    x._ = _;
    x[_] = { _, b, createSet, getVarIds, prepareForTransfer };
    return await del(x) ?? { msg: 'delete complete' };
  }
  if (id && id !== 'root') return await repo.del(id);
});

await b.s('cp', async (x) => {
  const {
    oldId, newId, key,
    id, oldKey, newKey
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
});

await b.s('port', async (x) => {
  const { b, msg } = x;
  if (msg.x) return await b.p(msg.x, msg);

  return {
    msg: await b.p('fs.readFile', { path: './src/gui/index.html' }),
    type: 'text/html',
  }
});

await b.s('state.import', async (x) => {
  (new AmdZip(x.path)).extractAllTo(repo.getStatePath(), true);
});
await b.s('state.export', async (x) => {
  const zip = new AmdZip();
  zip.addLocalFolder(repo.getStatePath());
  zip.writeZip(`./state_${getDateTime()}.zip`);
});
await b.s('state.validate', async (x) => {
  const list = await fs.readdir('./state');
  const fSet = new Set;
  for (let i of list) {
    if (i === '.gitignore' || i === 'root') continue;
    fSet.add(i);
  }
  const v = await b.p('get', { id: 'root' });
  const varIds = await getVarIds({ b, v });

  for (let i of varIds) fSet.delete(i);
  console.log('files that not exists in varIds', fSet);
});

process.on('uncaughtException', (e, origin) => {
  if (e?.code === 'ECONNRESET') {
    console.error(e);
    return;
  }
  if (e.stack) console.log('e.stack', e.stack);

  console.error('UNCAUGHT EXCEPTION', e, e.stack, origin);
  process.exit(1);
});

const { FsStorage } = await import('./src/storage/fsStorage.js');
const repo = new FsStorage('./state', fs);

//todo if env === test // clear tests/state, and set repo to tests/state

const root = await repo.get('root');
if (!root) await repo.set('root', { m: {} });

const e = {
  'set': async (arg) => {
    const path = arg[1];
    if (!path) {
      console.error('path is empty'); return;
    }
    const v = arg[2];
    if (!v) {
      console.error('data is empty'); return;
    }
    const type = arg[3];

    return await b.p('set', { path: pathToArr(path), v, type });
  },
  'get': async (arg) => {
    const path = arg[1] ? pathToArr(arg[1]) : [];
    const depth = Number(arg[2]) || 0;
    return await b.p('get', { path, depth });
  },
  'del': async (arg) => {
    const path = arg[1];
    if (!path) {
      console.error('path is empty'); return;
    }
    return await b.p('del', { path: pathToArr(arg[1]) });
  },
  'state.import': async (arg) => {
    const path = arg[1];
    return await b.p('state.import', { path: './' + path });
  },
  'state.export': async (arg) => await b.p('state.export', { repo }),
  'state.validate': async (arg) => await b.p('state.validate'),
  'server.start': async (arg) => {
    //todo refactor this for more control
    const x = {
      server: (await import('node:http')).createServer({ requestTimeout: 30000 }),
      port: arg[1] || 8080,
    }
    const { rqHandler } = await import('./src/transport/http.js');

    x.server.on('clientError', (err, socket) => {
      console.log(err);
      if (err.code === 'ECONNRESET' || !socket.writable) return;
      socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    });
    x.server.on('request', async (rq, rs) => {
      try {
        await rqHandler({ b, rq, rs, fs, serveFS: true });
      } catch (e) {
        console.error('error in rqHandler', e);
      }
    });
    x.server.listen(x.port, () => console.log(`Server start on port: [${x.port}].`));
  },
  //todo add basic integrating testing
  //'test': async (arg) => {
  //test set, get what settled, and del, after del check get is return nothing
  //},
};

const args = parseCliArgs(process.argv);
if (e[args[0]]) {
  console.log(await e[args[0]](args) ?? '');
} else {
  console.log('Command not found');
}