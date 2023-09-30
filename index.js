import { varcraftData } from "./src/domain/varcraft.js";
import { promises as fs } from "node:fs";
import { parseCliArgs } from "./src/transport/cli.js";
import { pathToArr } from "./src/util/util.js";
import { ulid } from "ulid";

const cmd = {};
const varcraft = {
  'var.set': async (repo, serializer, path, data) => {

    const resp= await repo.getByPath(path);
    if (!resp) {
      const resp = await varFactory.createByPath(path);

      if (resp.varB) {
        const { varA, varB } = resp;
        //varB.data = data;
        //await repo.set(varB.id, serializer.serialize(varB));

        if (varB.new) {
          //await repo.set(varA.id, serializer.serialize(varA));
        }

        return { varA, varB };
      }
    }

    const varB = resp.varB;
    if (varB && !varB.assoc) {
      //varB.data = data;
      //await repo.set(varB.id, serializer.serialize(varB));

      return varB;
    }
  },
  'var.get': async (repo, path = [], depth) => {

    const getData = async (v, depth) => {
      const data = {};

      if (v.data) return v;
      if (!v.assoc) return data;

      for (let prop in v.assoc) {
        const id = v.assoc[prop];
        if (!id) return;

        if (depth === 0) {
          data[prop] = id;
          continue;
        }

        const v2 = await repo.getById(id);
        if (v2.assoc) {
          data[prop] = await getData(v2, --depth);
        } else if (v2.data) {
          data[prop] = v2;
        }
      }
      return data;
    }

    const set = await repo.getByPath(path);

    return await getData(set.at(-1), depth);
  },
  'var.del': async (repo, serializer, path) => {
    const resp = await repo.getByPath(path);
    if (!resp) return;
    const { varA, varB } = resp;

    repo.del(varB.id);
    delete varA.assoc[varB.name];
    repo.set(varA.id, serializer.serialize(varA));
  },
  'server.start': (conf) => {

    const { fs, server, port, rqHandler, repo } = conf;

    conf.serveFiles = true;
    conf.cmdMap = {
      'default': async () => {
        return {
          msg: await fs.readFile('./src/ui/index.html', 'utf8'),
          type: 'text/html',
        }
      },
      'var.get': async ({msg}) => {
        let { path, depth } = msg;
        depth = Number(depth) || 1;

        return await cmd['var.get'](repo, path, depth);
      }
    }
    server.on('request', async (rq, rs) => {
      await rqHandler(rq, rs, conf);
    });
    server.listen(port, () => console.log(`Server start on port: [${port}].`));
  },
  'server.stop': () => {}
}

for (const method in varcraftData.methods) {
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

const cliCmdMap = {
  'var.get': async (arg) => {
    const path = arg[1] ? pathToArr(arg[1]) : [];
    const depth = Number(arg[2]) || 0;

    return cmd['var.get'](varRepository, path, depth);
  },
  'var.set': (arg) => {
    if (!arg[1]) {
      console.error('path is empty');
      return;
    }
    if (!arg[2]) {
      console.error('data is empty');
      return;
    }
    return cmd['var.set'](varRepository, varSerializer, pathToArr(arg[1]), arg[2]);
  },
  'var.del': (arg) => {
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
    return;
  }

  const response = await cliCmdMap[cliArgs[0]](cliArgs);
  if (response) {
    console.log(response);
  }
}

await runCliCmd();