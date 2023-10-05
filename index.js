import { varcraft } from "./src/domain/varcraft.js";
import { bus } from "./src/domain/bus.js";

import { varcraftInterface } from "./src/domain/varcraftInterface.js";
import { transactionInterface } from "./src/domain/transaction.js";

import { promises as fs } from "node:fs";
import { parseCliArgs } from "./src/transport/cli.js";
import { pathToArr } from "./src/util/util.js";
import { ulid } from "ulid";

bus.sub('log', async (x) => {
  console.log(x);
});
bus.sub('getUniqId', () => ulid());

bus.sub('varcraft.output', async (x) => {
  console.log(x);
});

bus.sub('var.getById', async (id) => await varRepository.getById(id));


let r = await varcraft({cmd: 'bus.set', bus});
console.log(r);

r = await varcraft({ cmd: 'bus.get' });


//let r = await varcraft({cmd: 'bus.get', bus});
//console.log(r);


const cmd = {};

for (const method in varcraftInterface.methods) {
  if (!varcraft[method]) continue;
  cmd[method] = varcraft[method];
}
for (const method in transactionInterface.methods) {
  if (!varcraft[method]) continue;
  cmd[method] = varcraft[method];
}

const { FsStorage } = await import('./src/storage/fsStorage.js');
const varStorage = new FsStorage('./state', fs);

const { VarSerializer } = await import('./src/varSerializer.js');
const varSerializer = new VarSerializer;

const { VarRepository } = await import('./src/varRepository.js');
let varRepository = new VarRepository(varStorage);

const { VarFactory } = await import('./src/varFactory.js');
const varFactory = new VarFactory(ulid, varRepository);




const rootVar = await varRepository.getById('root');
if (!rootVar) {
  await varRepository.set('root', { map: {} });
}
const transactionVar = await varRepository.getById('transaction');
if (!transactionVar) {
  await varRepository.set('transaction', { version: 1, list: [] });
}


r = await varcraft({ cmd: 'var.get', path: ['frontend'] });
console.log(r);


const cliCmdMap = {
  'var.get': async (arg) => {
    const path = arg[1] ? pathToArr(arg[1]) : [];
    const depth = Number(arg[2]) || 0;

    return await cmd['var.get'](varRepository, path, depth);
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

    const meta = {
      factory: varFactory,
      repo: varRepository,
      serializer: varSerializer
    }
    return await cmd['var.set'](meta, pathToArr(arg[1]), arg[2]);
  },
  'var.del': async (arg) => {
    if (!arg[1]) {
      console.error('path is empty');
      return;
    }
    return cmd['var.del'](varRepository, varSerializer, pathToArr(arg[1]));
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

    return cmd['server.start'](conf);
  }
}

const runCliCmd = async () => {
  const process = (await import('node:process')).default;
  const cliArgs = parseCliArgs(process.argv);
  // if (!cliCmdMap[cliArgs[0]]) {
  //   console.log('Command not found');
  //   return;
  // }
  //console.log(await cliCmdMap[cliArgs[0]](cliArgs));
}

await runCliCmd();