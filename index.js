import { varcraft as v } from "./src/domain/varcraft.js";
import { bus } from "./src/domain/bus.js";
import { promises as fs } from "node:fs";
import { parseCliArgs } from "./src/transport/cli.js";
import { pathToArr } from "./src/util/util.js";
import { ulid } from "ulid";

await bus.sub('log', async (x) => console.log(x));
await bus.sub('getUniqId', () => ulid());

await bus.sub('repo.set', async (x) => {
  const { id, v } = x;

  await varRepository.set(id, v);

  return { msg: 'update complete', v };
});
await bus.sub('repo.get', async (id) => await varRepository.get(id));
await bus.sub('repo.del', async (id) => {

});

await v({ cmd: 'bus.set', bus });

const { FsStorage } = await import('./src/storage/fsStorage.js');
const varStorage = new FsStorage('./state', fs);

const { VarRepository } = await import('./src/varRepository.js');
let varRepository = new VarRepository(varStorage);

const root = await varRepository.get('root');
if (!root) {
  await varRepository.set('root', { map: {} });
}


const cliCmdMap = {
  'var.get': async (arg) => {
    const path = arg[1] ? pathToArr(arg[1]) : [];
    const depth = Number(arg[2]) || 0;

    return await v({ cmd: 'var.get', path, depth });
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
      cmd: 'var.set',
      path: pathToArr(arg[1]),
      data: arg[2]
    });
  },
  'var.del': async (arg) => {
    if (!arg[1]) {
      console.error('path is empty');
      return;
    }
    return await v({ cmd: 'var.del', path: pathToArr(arg[1]) });
  },
  'server.start': async (arg) => {

    const conf = {
      server: (await import('node:http')).createServer(),
      port: arg[1] || 8080,
      fs,
      repo: varRepository
    }
    const { rqHandler } = await import('./src/transport/http.js');
    conf.rqHandler = rqHandler;

    //return cmd['server.start'](conf);
  }
}

const runCliCmd = async () => {
  const process = (await import('node:process')).default;
  const cliArgs = parseCliArgs(process.argv);
  if (!cliCmdMap[cliArgs[0]]) {
    console.log('Command not found');
    return;
  }
  const r = await cliCmdMap[cliArgs[0]](cliArgs);
  console.log(r);
}

await runCliCmd();