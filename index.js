import AmdZip from 'adm-zip';
import { promises as fs } from "node:fs";
import process from 'node:process';
import { ulid } from "ulid";
import {
  X, b,
  del,
  get,
  getDateTime,
  getVarIds,
  parseCliArgs,
  pathToArr,
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

const injectSys = async (x) => {
  const _ = await b.p('get_');
  x._ = _;
  x[_] = { b, repo };
}

await b.s('getHtml', async (x) => {
  return {
    msg: await b.p('fs.readFile', { path: './src/gui/index.html' }),
    type: 'text/html',
  }
});
await b.s('set', async (x) => {
  await injectSys(x);
  return await set(x);
});
await b.s('get', async (x) => {
  await injectSys(x);
  return await get(x);
});
await b.s('del', async (x) => {
  await injectSys(x);
  return await del(x);
});

await b.s('signUp', async (x) => {
  const { email, password } = x;
  return { email, password };
});

await b.s('port', async (x) => await b.p(x.x, x));

await b.s('state.import', async x => (new AmdZip(x.path)).extractAllTo(repo.getStatePath(), true));
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

const { FsStorage } = await import('./src/storage/fsStorage.js');
const repo = new FsStorage('./state', fs);

const root = await repo.get('root');
if (!root) await repo.set('root', { m: {} });

const users = await b.p('get', { path: ['sys', 'users'] });
if (!users) {
  await b.p('set', { path: ['sys', 'users'], v: {}, type: 'm' })
}


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
        console.error('error in rqHandler', e);
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