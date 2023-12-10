import { promises as fs } from "node:fs";
import { ulid } from "ulid";
import {
  U, X, b,
  createPath,
  del,
  get,
  getVarData, getVarIds,
  parseCliArgs,
  pathToArr,
  prepareForTransfer,
  set,
} from "./src/module/x.js";

const _ = Symbol('sys');

const x = X(_);
const u = U(x, _);

b.set_(_);
b.setX(x);
//await b.s('x', async (x) => {});

await u({
  y: 'log', f: async (x) => {
    if (typeof x === 'object') {
      console.log(x.msg);
      return;
    }
    console.log(x);
  }
});
await u({ y: 'get_', f: () => _ });
await u({ y: 'getUniqId', f: () => ulid() });
await b.s('fs.readFile', async (x) => {
  const { path } = x;
  return await fs.readFile(path, 'utf8');
});

await b.s('set', async (x) => {
  const { id, path, k, v } = x;

  if (id && k && v) {
    const vById = await b.p('get', { id });
    if (!vById) return { ok: 0, msg: 'V not found' };

    if (vById.m) {
      if (vById.m[k]) return { msg: `Key [${k}] already exists in vById.` };

      const newVId = await b.p('getUniqId');
      await defaultRepo.set(newVId, v);

      vById.m[k] = newVId;
      await defaultRepo.set(id, vById);

      return { id, k, v, newVId };
    }
    return { msg: 'Not found "m" in vById', vById };
  }

  if (id) {
    await defaultRepo.set(id, v);
  } else if (path) {
    const _ = await b.p('get_');
    x._ = _;
    x[_] = { _, b, createPath, prepareForTransfer };

    await set(x);
  }

  return { msg: 'update complete', v };
});

await b.s('get', async (x) => {
  const { id, path, depth } = x;

  if (id) return await defaultRepo.get(id);
  if (path && depth !== undefined) {
    const _ = await b.p('get_');
    x._ = _;
    x[_] = { _, b, createPath, getVarData };

    return await get(x);
  }
});
await b.s('del', async (x) => {
  const { id, path, k } = x;

  if (id && k) {
    x._ = _;
    x[_] = { _, b, createPath, getVarIds, prepareForTransfer };
    await del(x);
    return { msg: 'delete complete' };
  }

  if (id) return await defaultRepo.del(id);
  if (path) {
    const _ = await b.p('get_');
    x._ = _;
    x[_] = { _, b, createPath, getVarIds, prepareForTransfer };

    return await del(x);
  }
});
await b.s('cp', async (x) => {
  const { id, oldKey, newKey, delSource } = x;

  const _ = await b.p('get_');
  const v = await b.p('get', { id });

  if (oldKey && newKey && v.m && v.m[oldKey]) {
    v.m[newKey] = v.m[oldKey];
    delete v.m[oldKey];
    await b.p('set', { id, v })
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

const { FsStorage } = await import('./src/storage/fsStorage.js');
const defaultRepo = new FsStorage('./state', fs);

const root = await defaultRepo.get('root');
if (!root) await defaultRepo.set('root', { m: {} });

const e = {
  'set': async (arg) => {
    const path = arg[1];
    if (!path) {
      console.error('path is empty');
      return;
    }
    const v = arg[2];
    if (!v) {
      console.error('data is empty');
      return;
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
  'server.start': async (arg) => {

    //todo refactor this for more control
    const x = {
      server: (await import('node:http')).createServer({ requestTimeout: 30000 }),
      port: arg[1] || 8080,
    }
    const { rqHandler } = await import('./src/transport/http.js');

    x.server.on('clientError', (err, socket) => {
      console.log(err);
      if (err.code === 'ECONNRESET' || !socket.writable) {
        return;
      }
      socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    });
    x.server.on('request', async (rq, rs) => {
      await rqHandler({ b, rq, rs, fs, serveFS: true });
    });
    x.server.listen(x.port, () => console.log(`Server start on port: [${x.port}].`));
  },
  //todo add basic integrating testing
  //'test': async (arg) => {
  //test set, get what settled, and del, after del check get is return nothing
  //},
};

const args = parseCliArgs((await import('node:process')).default.argv);
if (e[args[0]]) {
  console.log(await e[args[0]](args) ?? '');
} else {
  console.log('Command not found');
}