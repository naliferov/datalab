import { varcraftData } from "./src/domain/varcraft.js";
import { promises as fs } from "node:fs";
import { parseCliArgs } from "./src/transport/cli.js";
import { pathToArr } from "./src/util/util.js";
import { ulid } from "ulid";

const varcraft = {
  'var.set': async (repo, serializer, path, data) => {

    const resp= await repo.getByPath(path);
    if (!resp) {
      const resp = await varFactory.createByPath(path);

      if (resp.varB) {
        const { varA, varB } = resp;
        varB.data = data;
        await repo.set(varB.id, serializer.serialize(varB));

        if (varB.new) {
          await repo.set(varA.id, serializer.serialize(varA));
        }

        return { varA, varB };
      }
    }

    const varB = resp.varB;
    if (varB && !varB.assoc) {
      varB.data = data;
      await repo.set(varB.id, serializer.serialize(varB));

      return varB;
    }
  },
  'var.get': async (repo, path) => {
    const resp = await repo.getByPath(path);
    if (!resp) return;
    if (!resp.varB) return;

    if (resp.varB.data) {
      return resp.varB;
    }

    const getData = async (varA) => {
      const data = {};

      const assoc = varA.assoc;
      if (!assoc) return data;

      for (let prop in assoc) {
        const id = assoc[prop];
        if (!id) return;

        const varB = await repo.getById(id);
        if (varB.assoc) {
          data[prop] = await getData(varB)
        } else if (varB.data) {
          data[prop] = varB;
        } else {
          data[prop] = null;
        }
      }

      return data;
    }

    return await getData(resp.varB);
  },
  'var.getRaw': async (repo, path) => {
    return await repo.getByPath(path);
  },
  'var.del': async (repo, serializer, path) => {
    const resp = await repo.getByPath(path);
    if (!resp) return;
    const { varA, varB } = resp;

    repo.del(varB.id);
    delete varA.assoc[varB.name];
    repo.set(varA.id, serializer.serialize(varA));
  },
  'server.start': (server, conf) => {
    server.listen(conf.port, () => console.log(`Server start on port: [${conf.port}].`));
  },
  'server.stop': () => {}
}

const cmd = {};
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
    if (!arg[1]) {
      console.error('path is empty');
      return;
    }
    return cmd['var.get'](varRepository, pathToArr(arg[1]));
  },
  'var.getRaw': async (arg) => {
    if (!arg[1]) {
      console.error('path is empty');
      return;
    }
    return cmd['var.getRaw'](varRepository, pathToArr(arg[1]));
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
    const config = {
      port: arg[1] || 8080,
      handler: async (rq, rs) => rs.end('Default server response.')
    }
    const server = (await import('node:http')).createServer(async (rq, rs) => {
      await config.handler(rq, rs);
    });
    return cmd['server.start'](server, config);
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