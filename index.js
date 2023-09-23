//import { Var, VarMeta, VarRelation } from "./src/domain/var.js";
import { varcraftData } from "./src/domain/varcraft.js";
import { promises as fs } from "node:fs";
import { parseCliArgs } from "./src/transport/cli.js";
import { pathToArr } from "./src/util/util.js";

const varcraftConcrete = {
  'var.set': async (repository, path) => {
    if (!repository[1]) return;

    const resp= await repository.getByPath(path);
    if (resp.var && resp.relation) {
      return resp.var;
    }

    //if (v) await v.setData(arg[2]);

    //await this.varStorage.set(v.id, v);

    //v.relativeVarName
    //     if (!p.get(name)) {
    //         p.set(name, u.id);
    //     }

    console.log('...');
  },
  'var.get': async (varRepository, path) => {
    const resp = await varRepository.getByPath(path);
    if (!resp) return;

    if (resp.var) return resp.var;
    if (resp.relation) {

      const getData = async (relation, depth = 0) => {
        const data = {};
        const assoc = relation.assoc;
        if (!assoc) return data;

        for (let prop in assoc) {

          const id = assoc[prop];
          const relation = await varRelationRepository.getById(id);
          if (!relation) {
            data[prop] = await varRepository.getById(id);
            continue;
          }
          return data[prop] = await getData(relation, ++depth)
        }

        return data;
      }

      return await getData(resp.relation);
    }
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
const varRelationStorage = new FsStorage('./state', fs);

// const varRootData = await varStorage.get('root');
// if (!varRootData) {
//   await varStorage.set('root', JSON.stringify({}));
// }
//todo create varRelation if not exists

const { VarRepository } = await import('./src/varRepository.js');
let varRepository = new VarRepository(varStorage);


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
    return 'cmd test';
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