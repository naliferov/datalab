import AmdZip from 'adm-zip';
import { promises as fs } from "node:fs";
import process from 'node:process';
import { ulid } from "ulid";
import {
  X, b,
  getDateTime,
  getVarIds,
  parseCliArgs,
  pathToArr,
  u
} from "./src/module/x.js";

const _ = Symbol('sys');
b.set_(_);
b.setX(X(_));

await b.s('x', async x => await u(x));
await b.s('get_', () => _);
await b.s('getUniqId', () => ulid());
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
});
//if use remote storage
await b.s('storage', async (x) => {
  //const repo = x.storageName === 'remote' ? sysRepo : mainRepo;
  //send request to http storage with machine token, need to add permissions and private space

  return await b.p('fs', x);
});
await b.s('repo', async (x) => {
  const repo = x.repoName === 'sys' ? sysRepo : mainRepo;

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

await b.s('state.import', async x => (new AmdZip(x.path)).extractAllTo(mainRepo.getStatePath(), true));
await b.s('state.export', async (x) => {
  const zip = new AmdZip();
  zip.addLocalFolder(mainRepo.getStatePath());
  zip.writeZip(`./state_${getDateTime()}.zip`);
});
await b.s('state.validate', async (x) => {
  const list = await fs.readdir('./state');
  const fSet = new Set;
  for (let i of list) {
    if (i === '.gitignore' || i === 'root' || i === 'sys') continue;
    fSet.add(i);
  }
  const v = await b.p('x', { get: { id: 'root', useRepo: true } });
  const varIds = await getVarIds({ b, v });

  for (let i of varIds) fSet.delete(i);
  console.log('files that not exists in varIds', fSet);
});

const { storage } = await import('./src/storage/storage.js');
const mainRepo = new storage('./state', b);
const sysRepo = new storage('./state/sys', b);

const mapV = { m: {}, o: [] };

let v = await b.p('repo', { get: { id: 'root' } });
if (!v) await mainRepo.set('root', mapV);
v = await b.p('repo', { get: { id: 'root' }, repoName: 'sys' });
if (!v) await sysRepo.set('root', mapV);

const e = {
  'set': async (arg) => {
    const path = pathToArr(arg[1]);
    if (!path) { console.error('path is empty'); return; }

    const v = arg[2];
    if (!v) { console.error('data is empty'); return; }
    const type = arg[3];

    return await b.p('x', { set: { path, v, type } });
  },
  'get': async (arg) => {
    const path = arg[1] ? pathToArr(arg[1]) : [];
    const depth = arg[2] || 1;

    return b.p('x', { get: { path, depth } });
  },
  'del': async (arg) => {
    const path = pathToArr(arg[1]);
    if (!path) { console.error('path is empty'); return; }

    return b.p('x', { del: { path } });
  },
  'state.import': async (arg) => {
    const path = arg[1];
    return await b.p('state.import', { path: './' + path });
  },
  'state.export': async (arg) => await b.p('state.export', { repo: mainRepo }),
  'state.validate': async (arg) => await b.p('state.validate'),
  'server.start': async (arg) => {

    const port = arg[1] || 8080;
    const hostname = '0.0.0.0';
    const ctx = arg[_].ctx;
    ctx.Buffer = Buffer;
    ctx.Response = Response;
    ctx.Uint8Array = Uint8Array;

    const { rqHandler } = await import('./src/transport/http.js');
    const handler = async (rq) => await rqHandler({ b, rq, fs, runtimeCtx: ctx });

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
      x.server.on('clientError', (e, sock) => {
        console.log('CLIENT ERR', e);
        if (e.code === 'ECONNRESET' || !sock.writable) return;
        sock.end('HTTP/1.1 400 Bad Request\r\n\r\n');
      });
      x.server.on('request', async (rq, rs) => {

        rq.on('error', (e) => { rq.destroy(); console.log('request no error', e); });
        try {
          const r = await rqHandler({ b, runtimeCtx: ctx, rq, fs });
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
  const ctx = {};
  if (globalThis.Bun) ctx.rtName = 'bun';
  else if (globalThis.Deno) ctx.rtName = 'deno';
  else ctx.rtName = 'node';

  args[_] = { ctx };

  if (e[args[0]]) {
    console.log(await e[args[0]](args) ?? '');
  } else {
    console.log('Command not found');
  }
}

await processCliArgs();