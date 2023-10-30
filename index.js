import { bus } from "./src/domain/bus.js";
import { varcraft as v } from "./src/domain/varcraft.js";
import { promises as fs } from "node:fs";
import { parseCliArgs } from "./src/transport/cli.js";
import { pathToArr } from "./src/util/util.js";
import { ulid } from "ulid";

const _ = Symbol('sys');

await bus.s('log', async (x) => {
  if (typeof x === 'object') {
    console.log(x.msg);
    return;
  }
  console.log(x);
});
await bus.s('getUniqId', () => ulid());
await bus.s('default.set', async (x) => {
  const { id, v } = x;
  await varRepository.set(id, v);
  return { msg: 'update complete', v };
});
await bus.s('default.get', async (x) => {
  const { id } = x;
  if (id) return await varRepository.get(id);
});
await bus.s('default.del', async (x) => {
  const { id } = x;
  await varRepository.del(id);
});
await bus.s('fs.readFile', async (x) => {
  const { path } = x;
  return await fs.readFile(path, 'utf8');
});

await bus.s('http.in', async (x) => {
    const { bus, event, msg } = x;

    const m = {
      'default': async () => {
        return {
          msg: await bus.p('fs.readFile', { path: './src/gui/index.html' }),
          type: 'text/html',
        }
      },
      'var.set': async (x) => {
        let { msg } = x;
        let { id, path, v } = msg;
        let repo = x.repo || 'default';

        if (id && v) {
          return await bus.p('default.set', { id, v });
        }
        return { ok: 1 };
      },
      'var.get': async (x) => {
        let { msg } = x;
        let { id, path, depth } = msg;

        if (id) return bus.p('default.get', { id });
        return { test: 1 };
      },
    }
    if (m[event]) return await m[event](x);
});

await v({ event: '_.set', _ });
await v({ event: 'bus.set', bus });

const { FsStorage } = await import('./src/storage/fsStorage.js');
const varStorage = new FsStorage('./state', fs);

const { VarRepository } = await import('./src/domain/varRepository.js');
let varRepository = new VarRepository(varStorage);

const root = await varRepository.get('root');
if (!root) await varRepository.set('root', { m: {} });


const eventMap = {
  'var.get': async (arg) => {
    const path = arg[1] ? pathToArr(arg[1]) : [];
    const depth = Number(arg[2]) || 0;

    return await v({ event: 'var.get', path, depth });
  },
  'var.set': async (arg) => {
    if (!arg[1]) {
      console.error('path is empty');
      return;
    }
    if (!arg[2]) {
      console.error('data is empty');
      return;
    }
    return await v({
      event: 'var.set', path: pathToArr(arg[1]),
      data: arg[2], type: arg[3],
    });
  },
  'var.del': async (arg) => {
    if (!arg[1]) {
      console.error('path is empty');
      return;
    }
    return await v({
      event: 'var.del',
      path: pathToArr(arg[1])
    });
  },
  'server.start': async (arg) => {

    const x = {
      server: (await import('node:http')).createServer({
        requestTimeout: 30000,
      }),
      port: arg[1] || 8080,
    }
    const { rqHandler } = await import('./src/transport/http.js');

    x.server.on('request', async (rq, rs) => {
      await rqHandler({ bus, rq, rs, fs, serveFS: true });
    });
    x.server.listen(x.port, () => console.log(`Server start on port: [${x.port}].`));
  },
}

const runCliEvent = async () => {
  const process = (await import('node:process')).default;
  const cliArgs = parseCliArgs(process.argv);

  if (!eventMap[cliArgs[0]]) {
    console.log('Command not found');
    return;
  }
  const r = await eventMap[cliArgs[0]](cliArgs);
  if (r) console.log(r);
}

await runCliEvent();