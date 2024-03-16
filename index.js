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
await b.s('getRepo', () => mainRepo);
await b.s('getUniqId', () => ulid());
await b.s('fs', async (x) => {
  if (x.get) {
    const { path } = x.get;
    return await fs.readFile(path, 'utf8');
  }
  if (x.set) {
    const { path, v } = x.set;
    return await fs.writeFile(path, v);
  }
});
await b.s('repo', async (x) => {
  if (x.get) {
    const { id, repoType } = x.get;
    //return await fs.readFile(path, 'utf8');
  }
  if (x.set) {
    const { id, v, repoType } = x.set;
    console.log(x.set);
    //return await fs.writeFile(path, v);
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

const { FsStorage } = await import('./src/storage/fsStorage.js');
const mainRepo = new FsStorage('./state', fs);
const sysRepo = new FsStorage('./state/sys', fs);

const mapV = { m: {}, o: [] };
let v = await mainRepo.get('root');
if (!v) await mainRepo.set('root', mapV);
v = await sysRepo.get('root');
if (!v) await sysRepo.set('root', mapV);

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

    return await u({ set: { path: pathToArr(path), v, type } });
  },
  'get': async (arg) => {
    const path = arg[1] ? pathToArr(arg[1]) : [];
    const depth = Number(arg[2]) || 0;
    return await u({ set: { path, depth } });
  },
  'del': async (arg) => {
    const path = arg[1];
    if (!path) {
      console.error('path is empty'); return;
    }
    return await u({ del: { path: pathToArr(arg[1]) } });
  },
  'state.import': async (arg) => {
    const path = arg[1];
    return await b.p('state.import', { path: './' + path });
  },
  'state.export': async (arg) => await b.p('state.export', { repo: mainRepo }),
  'state.validate': async (arg) => await b.p('state.validate'),
  'server.start': async (arg) => {
    const x = {
      server: (await import('node:http')).createServer({ requestTimeout: 30000 }),
      port: arg[1] || 8080,
    }
    const { rqHandler } = await import('./src/transport/http.js');

    x.server.on('clientError', (err, socket) => {
      console.log('CLIENT ERROR', err);

      if (err.code === 'ECONNRESET' || !socket.writable) return;
      socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    });
    x.server.on('request', async (rq, rs) => {
      try {
        await rqHandler({ b, rq, rs, fs, serveFS: true });
      } catch (e) {
        const m = 'Error in rqHandler';
        console.error(m, e);
        rs.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' }).end(m);
      }
    });
    x.server.listen(x.port, () => console.log(`Server start on port: [${x.port}].`));
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

const args = parseCliArgs(process.argv);
if (e[args[0]]) {
  console.log(await e[args[0]](args) ?? '');
} else {
  console.log('Command not found');
}