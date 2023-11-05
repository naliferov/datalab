import {
  X, b, get, set, del, createPath, gatherVarData,
  gatherSubVarsIds, parseCliArgs, prepareForTransfer, pathToArr
} from "./src/domain/x.js";
import { promises as fs } from "node:fs";
import { ulid } from "ulid";

const _ = Symbol('sys');

const x = X(_);
b.set_(_);
b.setX(x);

await b.s('log', async (x) => {
  if (typeof x === 'object') {
    console.log(x.msg);
    return;
  }
  console.log(x);
});

await b.s('x', async (x) => {
  const { op, id, path, v } = x;
  if (op === 'g') {}
  else if (op === 's') {}
  else if (op === 'd') {}
});

await b.s('log', async (x) => console.log(x));
await b.s('get_', () => _);
await b.s('getUniqId', () => ulid());
await b.s('fs.readFile', async (x) => {
  const { path } = x;
  return await fs.readFile(path, 'utf8');
});

await b.s('set', async (x) => {
  const { id, path, v } = x;

  if (id) await defaultRepo.set(id, v);
  else if (path) {
    x._ = _;
    x[_] = { b, _, createPath, prepareForTransfer };
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
    x[_] = { b, _, createPath, gatherVarData };
    return await get(x);
  }
});
await b.s('del', async (x) => {
  const { id, path } = x;

  if (id) return await defaultRepo.del(id);
  if (path) {
    const _ = await b.p('get_');
    x._ = _;
    x[_] = { b, _, createPath, gatherSubVarsIds, prepareForTransfer };
    return await del(x);
  }
});
await b.s('mv', async (x) => {
  const { id, path } = x;

  if (id) return await defaultRepo.del(id);
  if (path) {
    const _ = await b.p('get_');
    x._ = _;
    x[_] = { b, _, createPath, gatherSubVarsIds, prepareForTransfer };
    return await del(x);
  }
});

await b.s('transport', async (x) => {
    const { b, msg } = x;

    const m = {
      'set': async (x) => {
        let { msg } = x;
        let { id, path, v } = msg;

        if (id && v) return await b.p('set', { id, v });
        return { ok: 1 };
      },
      'get': async (x) => {
        let { msg } = x;
        let { id, path, depth } = msg;

        if (id) return b.p('get', { id });
        return { test: 1 };
      },
    }

    if (m[msg.x]) {
      return await m[msg.x](x);
    } else {
      return {
        msg: await b.p('fs.readFile', { path: './src/gui/index.html' }),
        type: 'text/html',
      }
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
};

const args = parseCliArgs((await import('node:process')).default.argv);
if (e[args[0]]) {
  console.log(await e[args[0]](args) ?? 'No input after execute cmd.');
} else {
  console.log('Command not found');
}