import { varcraftData } from "./src/domain/varcraft.js";
import { promises as fs } from "node:fs";
import { parseCliArgs } from "./src/transport/cli.js";
import { pathToArr } from "./src/util/util.js";
import { ulid } from "ulid";

const varcraftConcrete = {
  'var.set': async (repository, path, data) => {

    const resp= await repository.getByPath(path);
    if (resp && resp.assoc) {
      return;
    }

    if (!resp) {
      const resp = await varFactory.createByPath(path);
      if (resp.varB) {
        resp.varB.data = data;
        //await repository.save(varB.id, varSerializer.serialize(varB));
      }
      if (resp.varB.new) {
        //await repository.save(varA.id, varSerializer.serialize(varA));
      }
      console.log('created', resp);
      return;
    }

    const varB = resp.varB;
    if (varB && !varB.assoc) {
      varB.data = data;
      await repository.save(varB.id, varSerializer.serialize(varB));
    }
  },
  'var.get': async (varRepository, path) => {
    const resp = await varRepository.getByPath(path);
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

        const varB = await varRepository.getById(id);
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
  'var.getRaw': async (repository, path) => {
    return await repository.getByPath(path);
  },
  'del': async (arg) => {
    // if (!arg[1]) return;
    // const v = await varRepository.find({ path: arg[1] });
    // const name = arg[1].split('.').at(-1);

    //todo if not found create var with varFactory

    //if (!v.relativeVarName || !v.relativeVarName) return;
    //p.del(name);
    //await this.varStorage.del(v.id);

    //if (v && name) await varRepository.delete(v, name);
  },
  serverStart: (server) => {
    //if (s.server) s.server.listen(8080, () => console.log(`httpServer start port: 8080`));
  },
}

const cmd = {};
for (const method in varcraftData.methods) {
  if (!varcraftConcrete[method]) continue;
  cmd[method] = varcraftConcrete[method];
}

const { FsStorage } = await import('./src/storage/fsStorage.js');
const varStorage = new FsStorage('./state', fs);

const { VarSerializer } = await import('./src/varSerializer.js');
const varSerializer = new VarSerializer;

// const varRootData = await varStorage.get('root');
// if (!varRootData) {
//   await varStorage.set('root', JSON.stringify({}));
// }
//todo create varRelation if not exists

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
    return cmd['var.set'](varRepository, pathToArr(arg[1]), arg[2]);
  },
  'var.del': (arg) => {
    return 'cmd test';
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