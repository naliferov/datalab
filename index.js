import { varcraftInterface } from "./src/domain/varcraft.js";
import { transactionInterface } from "./src/domain/transaction.js";
import { promises as fs } from "node:fs";
import { parseCliArgs } from "./src/transport/cli.js";
import { pathToArr } from "./src/util/util.js";
import { ulid } from "ulid";

const cmd = {};
const varcraft = {
  'var.set': async (meta, path, data) => {

    const { factory, repo, serializer } = meta;

    const set = await factory.createByPath(path);

    //await cmd['transaction.set'](repo)

    for (let i = 0; i < set.length; i++) {
      const v = set[i];
      //const transaction = v.transaction;
      //if (!transaction) continue;

      if (v.data) {
        v.data = data;
        v.updated = 1;
      }
      if (v.updated || v.new) {
        await repo.set(v.id, serializer.serialize(v));
      }
    }

    return set;
  },
  'var.get': async (repo, path = [], depth = 0) => {

    const getData = async (v, localDepth) => {

      const data = {};
      if (!v.map) return data;

      for (let prop in v.map) {
        const id = v.map[prop];
        if (!id) return;

        if (localDepth === 0) {
          data[prop] = id;
          continue;
        }

        const v2 = await repo.getById(id);
        if (v2.map) {
          data[prop] = await getData(v2, localDepth - 1);
        } else if (v2.data) {
          data[prop] = v2;
        }
      }
      return data;
    }

    const set = await repo.getByPath(path);
    if (!set) return;

    const v = set.at(-1);
    if (!v) return;
    if (v.data) return v;

    return await getData(v, depth);
  },
  'var.del': async (repo, serializer, path) => {
    const set = await repo.getByPath(path);
    if (!set || !set.length) {
      console.log(path, 'Var set not found')
      return;
    }
    //const vars = await cmd['var.gatherSubVars'](repo, set.at(0)); console.log(Object.keys(vars).length); return;
    const varA = set.at(-2);
    const varB = set.at(-1);

    const subVars = await cmd['var.gatherSubVars'](repo, varB);
    const len = Object.keys(subVars).length;
    if (len > 5) {
      console.log(`Try to delete ${Object.keys(subVars).length} keys at once`);
      return;
    }
    for (let id in subVars) {
      console.log(`Delete subVar [${id}]`);
      await repo.del(id);
    }

    console.log(`Delete var [${varB.id}]`);
    await repo.del(varB.id);
    delete varA.map[varB.name];

    console.log(`Update var [${varA.id}]`);
    await repo.set(varA.id, serializer.serialize(varA));
  },
  'var.gatherSubVars': async (repo, v) => {
    if (!v.map) return {};

    const subVars = {};

    const getSubVars = async (v) => {
      for (let prop in v.map) {
        const id = v.map[prop];
        const subV = await repo.getById(id);
        subVars[id] = 1;

        if (subV.map) await getSubVars(subV);
      }
    }
    await getSubVars(v);

    return subVars;
  },
  'server.start': (meta) => {

    const { fs, server, port, rqHandler, repo } = meta;

    meta.serveFS = true;
    meta.cmdMap = {
      'default': async () => {
        return {
          msg: await fs.readFile('./src/ui/index.html', 'utf8'),
          type: 'text/html',
        }
      },
      'var.get': async ({msg}) => {
        let { path, depth } = msg;
        depth = Number(depth) || 0;

        return await cmd['var.get'](repo, path, depth);
      }
    }
    server.on('request', async (rq, rs) => {
      await rqHandler(meta, rq, rs);
    });
    server.listen(port, () => console.log(`Server start on port: [${port}].`));
  },
  'server.stop': () => {},

  'transaction.set': async (meta, op) => {

    const { trans, repo } = meta;

    if (state.lock) return;
    state.lock = true;

    state.version++;
    state.transaction.push(transaction);

    await repo.set('transaction', {
      version: state.version,
      transaction: state.transaction
    });

    state.lock = false;
  },
  'transaction.get': (repo, version) => {
    //if first transaction version is behind query version, client have to download all data
    //how to download all data without corruption
    //return products after this version
  }
}

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
  if (!cliCmdMap[cliArgs[0]]) {
    console.log('Command not found');
    return;
  }
  console.log(await cliCmdMap[cliArgs[0]](cliArgs));
}

await runCliCmd();